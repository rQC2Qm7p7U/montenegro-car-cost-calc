import React from "react";
import { render, act } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { useCalculatorPersistence } from "./useCalculatorPersistence";

const persistKey = "car-import-state-v1";

const createState = () => ({
  carPrices: [1000],
  krwPerUsdRate: 1350,
  usdPerEurRate: 1.08,
  customsDuty: 5,
  vat: 21,
  translationPages: 3,
  homologationFee: 250,
  miscellaneous: 0,
  scenario: "physical" as const,
  numberOfCars: 1,
  containerType: "40ft" as const,
  autoUpdateFX: false,
});

const renderHookWithState = (
  stateOverrides: Record<string, unknown> = {},
  options?: { alreadyMounted?: boolean },
) => {
  const hasMountedRef = { current: options?.alreadyMounted ?? false };
  const state = { ...createState(), ...stateOverrides };

  const TestComponent = () => {
    useCalculatorPersistence({
      persistKey,
      state,
      hasMountedRef,
    });
    return null;
  };

  render(<TestComponent />);
};

describe("useCalculatorPersistence", () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    const mockStorage = {
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
      value: mockStorage,
      configurable: true,
    });
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("persists state after debounce window", () => {
    renderHookWithState({ carPrices: [12345, 999] }, { alreadyMounted: true });

    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(localStorage.getItem(persistKey)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(2);
    });

    const saved = JSON.parse(localStorage.getItem(persistKey) || "{}");
    expect(saved.carPrices).toEqual([12345, 999]);
    expect(typeof saved.persistedAt).toBe("number");
  });

  it("does not throw when localStorage.setItem fails", () => {
    const setItemMock = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => renderHookWithState({}, { alreadyMounted: true })).not.toThrow();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(warnSpy).toHaveBeenCalled();
    setItemMock.mockRestore();
    warnSpy.mockRestore();
  });
});
