import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculatorReducer,
  clampCars,
  ensureCarPriceLength,
  readInitialState,
} from "./calculator/state";

const PERSIST_KEY = "car-import-state-v1";
const FX_LAST_SUCCESS_KEY = "car-import-last-fx-v1";

const createMockStorage = () => {
  let store: Record<string, string> = {};
  return {
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
};

const baseState = () => ({
  ...readInitialState(),
  carPrices: [10_000, 20_000, 30_000, 40_000],
  numberOfCars: 4,
  containerType: "40ft" as const,
});

describe("calculator reducer helpers", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: createMockStorage(),
      configurable: true,
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("clamps car count to container capacity and minimum of 1", () => {
    expect(clampCars(0, "20ft")).toBe(1);
    expect(clampCars(5, "20ft")).toBe(2);
    expect(clampCars(10, "40ft")).toBe(4);
  });

  it("sanitizes car prices and pads missing entries", () => {
    const sanitized = ensureCarPriceLength(
      [1000, Number.NaN, -50],
      3,
      "20ft",
    );
    expect(sanitized).toEqual([1000, 0]);

    const padded = ensureCarPriceLength([500], 3, "40ft");
    expect(padded).toEqual([500, 0, 0]);
  });

  it("limits car prices length when container type shrinks", () => {
    const state = baseState();
    const next = calculatorReducer(state, {
      type: "setContainerType",
      value: "20ft",
    });

    expect(next.numberOfCars).toBe(2);
    expect(next.carPrices).toEqual([10_000, 20_000]);
  });

  it("expands or trims prices when car count changes", () => {
    const state = baseState();
    const fewer = calculatorReducer(state, {
      type: "setNumberOfCars",
      value: 1,
    });
    expect(fewer.numberOfCars).toBe(1);
    expect(fewer.carPrices).toEqual([10_000]);

    const more = calculatorReducer(fewer, { type: "setNumberOfCars", value: 4 });
    expect(more.numberOfCars).toBe(4);
    expect(more.carPrices).toEqual([10_000, 0, 0, 0]);
  });
});

describe("readInitialState persistence and hardening", () => {
  beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
      value: createMockStorage(),
      configurable: true,
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-01T12:00:00Z"));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("hydrates fresh persisted state with clamped values", () => {
    const persistedAt = Date.now() - 1000;
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        carPrices: ["10000", "abc", -1],
        krwPerUsdRate: 10_000, // will be clamped down
        usdPerEurRate: 0.1, // will be clamped up
        vat: 50, // clamped to max
        containerType: "invalid",
        numberOfCars: 5,
        scenario: "company",
        autoUpdateFX: "true",
        persistedAt,
      }),
    );

    localStorage.setItem(
      FX_LAST_SUCCESS_KEY,
      JSON.stringify({
        krwPerUsd: 1400,
        usdPerEur: 1.1,
        fetchedAt: Date.now() - 5_000,
      }),
    );

    const state = readInitialState();

    expect(state.containerType).toBe("40ft");
    expect(state.numberOfCars).toBe(4);
    expect(state.carPrices).toEqual([10_000, 0, 0, 0]);
    expect(state.krwPerUsdRate).toBeLessThanOrEqual(2000);
    expect(state.usdPerEurRate).toBeGreaterThanOrEqual(0.5);
    expect(state.vat).toBe(25);
    expect(state.scenario).toBe("company");
    expect(state.autoUpdateFX).toBe(true);
    expect(state.lastValidRates).toEqual({ krwPerUsd: 1400, usdPerEur: 1.1 });
    expect(state.lastUpdatedAt).toBeTypeOf("number");
  });

  it("drops expired FX cache and falls back safely", () => {
    const fetchedAt = Date.now() - 7 * 60 * 60 * 1000; // older than FX_TTL_MS
    localStorage.setItem(
      FX_LAST_SUCCESS_KEY,
      JSON.stringify({ krwPerUsd: 2000, usdPerEur: 0.9, fetchedAt }),
    );

    const state = readInitialState();

    expect(state.lastValidRates).toBeNull();
    expect(state.lastUpdatedAt).toBeNull();
    expect(localStorage.getItem(FX_LAST_SUCCESS_KEY)).toBeNull();
  });

  it("clears stale persisted state via TTL and returns defaults", () => {
    const expiredAt = Date.now() - 2 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ carPrices: [999], persistedAt: expiredAt }),
    );

    const state = readInitialState();

    expect(state.carPrices).toEqual([999]);
    expect(localStorage.getItem(PERSIST_KEY)).toBeNull();
  });

  it("is resilient to malformed storage payloads", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(PERSIST_KEY, "{not-json");

    const state = readInitialState();

    expect(state).toMatchObject({
      carPrices: [0],
      containerType: "40ft",
      autoUpdateFX: false,
    });
    warnSpy.mockRestore();
  });
});
