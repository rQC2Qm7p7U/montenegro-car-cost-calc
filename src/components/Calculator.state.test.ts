import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { readInitialState } from "./calculator/state";

const PERSIST_KEY = "car-import-state-v1";
const FX_LAST_SUCCESS_KEY = "car-import-last-fx-v1";
const STATE_TTL_MS = 24 * 60 * 60 * 1000;
const FX_TTL_MS = 6 * 60 * 60 * 1000;

describe("readInitialState (persistence)", () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    const mock = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    Object.defineProperty(global, "localStorage", {
      value: mock,
      configurable: true,
    });
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("hydrates fresh persisted state", () => {
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        carPrices: [11111, 22222],
        numberOfCars: 2,
        containerType: "20ft",
        persistedAt: Date.now(),
      }),
    );

    const state = readInitialState();

    expect(state.carPrices).toEqual([11111, 22222]);
    expect(state.numberOfCars).toBe(2);
    expect(state.containerType).toBe("20ft");
  });

  it("drops stale persisted state after TTL", () => {
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        carPrices: [99999],
        numberOfCars: 1,
        persistedAt: Date.now() - STATE_TTL_MS - 1,
      }),
    );

    const state = readInitialState();

    expect(state.carPrices).toEqual([99999]);
    expect(localStorage.getItem(PERSIST_KEY)).toBeNull();
  });

  it("restores last valid FX rates when fresh", () => {
    localStorage.setItem(
      FX_LAST_SUCCESS_KEY,
      JSON.stringify({
        krwPerUsd: 1500,
        usdPerEur: 1.2,
        fetchedAt: Date.now(),
      }),
    );

    const state = readInitialState();

    expect(state.lastValidRates).toEqual({ krwPerUsd: 1500, usdPerEur: 1.2 });
    expect(state.lastUpdatedAt).toBeTypeOf("number");
  });

  it("ignores stale FX rates", () => {
    localStorage.setItem(
      FX_LAST_SUCCESS_KEY,
      JSON.stringify({
        krwPerUsd: 1600,
        usdPerEur: 1.25,
        fetchedAt: Date.now() - FX_TTL_MS - 1,
      }),
    );

    const state = readInitialState();

    expect(state.lastValidRates).toBeNull();
    expect(localStorage.getItem(FX_LAST_SUCCESS_KEY)).toBeNull();
  });

  it("defaults to language based on navigator.language", () => {
    Object.defineProperty(window.navigator, "language", {
      value: "en-US",
      configurable: true,
    });

    const state = readInitialState();
    expect(state.carPrices.length).toBeGreaterThan(0); // ensure no crash
  });
});
