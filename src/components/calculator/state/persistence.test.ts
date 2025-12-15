import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FX_LAST_SUCCESS_KEY,
  FX_TTL_MS,
  PERSIST_KEY,
  STATE_TTL_MS,
} from "./constants";
import { readInitialState } from "./persistence";

const mockStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

describe("readInitialState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    vi.stubGlobal("localStorage", mockStorage());
  });

  it("hydrates fresh state within TTL and clamps numbers", () => {
    const persistedAt = Date.now();
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        carPrices: [1000, 2000, 3000],
        krwPerUsdRate: 1400,
        usdPerEurRate: 1.05,
        customsDuty: 10,
        vat: 18,
        translationPages: 5,
        homologationFee: 500,
        miscellaneous: 1000,
        scenario: "company",
        numberOfCars: 5,
        containerType: "20ft",
        autoUpdateFX: true,
        persistedAt,
      }),
    );

    const state = readInitialState();

    expect(state.numberOfCars).toBe(2);
    expect(state.carPrices).toEqual([1000, 2000]);
    expect(state.krwPerUsdRate).toBe(1400);
    expect(state.usdPerEurRate).toBe(1.05);
    expect(state.autoUpdateFX).toBe(true);
    expect(state.scenario).toBe("company");
  });

  it("falls back when TTL expired", () => {
    const expired = Date.now() - STATE_TTL_MS - 1000;
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        carPrices: [999],
        persistedAt: expired,
      }),
    );

    const state = readInitialState();

    expect(state.carPrices).toEqual([0]);
    expect(state.numberOfCars).toBe(1);
    expect(state.containerType).toBe("40ft");
  });

  it("derives legacy FX rates when present", () => {
    const persistedAt = Date.now();
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        krwToEurRate: 1500,
        usdToEurRate: 1.1,
        persistedAt,
      }),
    );

    const state = readInitialState();
    expect(state.krwPerUsdRate).toBe(500);
    expect(state.usdPerEurRate).toBeCloseTo(0.91, 2);
  });

  it("uses last successful FX within TTL", () => {
    const fetchedAt = Date.now();
    localStorage.setItem(
      FX_LAST_SUCCESS_KEY,
      JSON.stringify({
        krwPerUsd: 1300,
        usdPerEur: 1.02,
        fetchedAt,
      }),
    );

    const state = readInitialState();
    expect(state.lastValidRates).toEqual({ krwPerUsd: 1300, usdPerEur: 1.02 });
    expect(state.lastUpdatedAt).toBe(fetchedAt);
  });

  it("drops stale FX snapshots beyond TTL", () => {
    const fetchedAt = Date.now() - FX_TTL_MS - 1000;
    localStorage.setItem(
      FX_LAST_SUCCESS_KEY,
      JSON.stringify({
        krwPerUsd: 1300,
        usdPerEur: 1.02,
        fetchedAt,
      }),
    );

    const state = readInitialState();
    expect(state.lastValidRates).toBeNull();
    expect(state.lastUpdatedAt).toBeNull();
  });
});
