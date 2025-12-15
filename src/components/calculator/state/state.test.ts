import { describe, expect, it } from "vitest";
import {
  clampCars,
  clampPositive,
  clampToRange,
  ensureCarPriceLength,
  calculatorReducer,
} from "../state/reducer";
import { MAX_CAR_PRICE_EUR } from "../state/constants";

describe("state helpers", () => {
  it("clamps numeric ranges with fallbacks", () => {
    expect(clampToRange(5, { min: 1, max: 10 }, 3)).toBe(5);
    expect(clampToRange(-1, { min: 1, max: 10 }, 3)).toBe(1);
    expect(clampToRange(20, { min: 1, max: 10 }, 3)).toBe(10);
    expect(clampToRange(NaN, { min: 1, max: 10 }, 3)).toBe(3);
  });

  it("clamps positive values with max", () => {
    expect(clampPositive(5, 10, 2)).toBe(5);
    expect(clampPositive(-5, 10, 2)).toBe(0);
    expect(clampPositive(50, 10, 2)).toBe(10);
    expect(clampPositive(NaN, 10, 2)).toBe(2);
  });

  it("ensures car prices length and caps values", () => {
    const capped = ensureCarPriceLength(
      [MAX_CAR_PRICE_EUR + 10, -5, 20_000],
      3,
      "40ft",
    );
    expect(capped).toEqual([MAX_CAR_PRICE_EUR, 0, 20_000]);

    const limitedByContainer = ensureCarPriceLength([1000, 2000, 3000], 4, "20ft");
    expect(limitedByContainer).toEqual([1000, 2000]);
  });

  it("clamps car count by container type", () => {
    expect(clampCars(5, "20ft")).toBe(2);
    expect(clampCars(0, "40ft")).toBe(1);
  });
});

describe("calculatorReducer", () => {
  const baseState = {
    carPrices: [0],
    krwPerUsdRate: 1350,
    usdPerEurRate: 1.08,
    customsDuty: 5,
    vat: 21,
    translationPages: 3,
    homologationFee: 100,
    miscellaneous: 0,
    scenario: "physical" as const,
    numberOfCars: 1,
    containerType: "40ft" as const,
    autoUpdateFX: false,
    lastValidRates: null,
    lastUpdatedAt: null,
  };

  it("updates car prices via updater and trims length", () => {
    const next = calculatorReducer(
      { ...baseState, numberOfCars: 2 },
      { type: "setCarPricesWithUpdater", updater: () => [10_000, 20_000, 30_000] },
    );
    expect(next.carPrices).toEqual([10_000, 20_000]);
  });

  it("clamps number of cars when container changes", () => {
    const next = calculatorReducer(
      { ...baseState, numberOfCars: 3, carPrices: [1, 2, 3] },
      { type: "setContainerType", value: "20ft" },
    );
    expect(next.numberOfCars).toBe(2);
    expect(next.carPrices).toEqual([1, 2]);
  });

  it("merges rates and toggles flags", () => {
    const next = calculatorReducer(baseState, {
      type: "setRates",
      krwPerUsdRate: 1500,
    });
    expect(next.krwPerUsdRate).toBe(1500);
    expect(next.usdPerEurRate).toBe(baseState.usdPerEurRate);

    const toggled = calculatorReducer(baseState, { type: "setAutoUpdateFX", value: true });
    expect(toggled.autoUpdateFX).toBe(true);
  });

  it("clamps miscellaneous values", () => {
    const next = calculatorReducer(baseState, { type: "setMiscellaneous", value: -10 });
    expect(next.miscellaneous).toBe(0);
  });

  it("resets to provided state", () => {
    const next = calculatorReducer(baseState, {
      type: "reset",
      value: { ...baseState, carPrices: [999] },
    });
    expect(next.carPrices).toEqual([999]);
  });
});
