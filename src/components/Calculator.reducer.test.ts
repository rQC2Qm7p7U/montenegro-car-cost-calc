import { describe, expect, it, beforeAll, beforeEach } from "vitest";
import { calculatorReducer, readInitialState } from "./Calculator";

const setupLocalStorage = () => {
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
};

const baseState = () => ({
  ...readInitialState(),
});

beforeAll(() => {
  setupLocalStorage();
});

beforeEach(() => {
  localStorage.clear();
});

describe("calculatorReducer", () => {
  it("clamps number of cars to container capacity and extends prices", () => {
    const initial = {
      ...baseState(),
      carPrices: [10000],
      numberOfCars: 1,
      containerType: "20ft" as const,
    };

    const next = calculatorReducer(initial, { type: "setNumberOfCars", value: 3 });

    expect(next.numberOfCars).toBe(2); // 20ft max 2
    expect(next.carPrices).toHaveLength(2);
    expect(next.carPrices[1]).toBe(0);
  });

  it("reduces number of cars when switching to smaller container", () => {
    const initial = {
      ...baseState(),
      carPrices: [8000, 9000, 10000],
      numberOfCars: 3,
      containerType: "40ft" as const,
    };

    const next = calculatorReducer(initial, { type: "setContainerType", value: "20ft" });

    expect(next.containerType).toBe("20ft");
    expect(next.numberOfCars).toBe(2);
    expect(next.carPrices).toEqual([8000, 9000]);
  });

  it("ensures car prices are non-negative via updater", () => {
    const initial = {
      ...baseState(),
      carPrices: [5000, 6000],
      numberOfCars: 2,
    };

    const next = calculatorReducer(initial, {
      type: "setCarPricesWithUpdater",
      updater: () => [1000, -500],
    });

    expect(next.carPrices).toEqual([1000, 0]);
  });

  it("replaces state on reset", () => {
    const initial = {
      ...baseState(),
      carPrices: [5000],
    };
    const resetTo = { ...initial, carPrices: [1, 2], numberOfCars: 2 };

    const next = calculatorReducer(initial, { type: "reset", value: resetTo as any });

    expect(next.carPrices).toEqual([1, 2]);
    expect(next.numberOfCars).toBe(2);
  });
});
