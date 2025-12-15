import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useFxController } from "./useFxController";

const mockSetFxSource = vi.fn();
const mockHandleFetchRates = vi.fn();
const mockSetLastValidRates = vi.fn();
const mockSetLastUpdatedAt = vi.fn();
const mockToast = vi.fn();
const fxUpdateSourceRef = { current: "none" as "none" | "fallback" | "live" | "restored" };

vi.mock("./useExchangeRates", () => ({
  useExchangeRates: vi.fn(() => ({
    fxSource: "fallback",
    setFxSource: mockSetFxSource,
    fxUpdateSourceRef,
    handleFetchRates: mockHandleFetchRates,
    isLoadingRates: false,
  })),
}));

const baseProps = {
  autoUpdateFX: false,
  lastValidRates: null,
  language: "en" as const,
  copy: {
    ratesFallbackDescription: "fallback",
    ratesFallbackTitle: "fallback title",
    ratesUpdatedDescription: () => "updated",
    ratesUpdatedTitle: "updated title",
  },
  applyRates: vi.fn(),
  setLastValidRates: mockSetLastValidRates,
  setLastUpdatedAt: mockSetLastUpdatedAt,
  toast: mockToast,
  krwPerUsdRate: 1200,
  usdPerEurRate: 1.1,
  hasMountedRef: { current: true },
};

describe("useFxController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fxUpdateSourceRef.current = "none";
  });

  it("marks manual rate updates as valid when in range", () => {
    renderHook(() => useFxController(baseProps));

    expect(mockSetLastValidRates).toHaveBeenCalledWith({
      krwPerUsd: 1200,
      usdPerEur: 1.1,
    });
    expect(mockSetFxSource).toHaveBeenCalledWith("manual");
  });

  it("respects fxUpdateSourceRef to set source", () => {
    fxUpdateSourceRef.current = "live";
    renderHook(() => useFxController(baseProps));
    expect(mockSetFxSource).toHaveBeenCalledWith("live");
    expect(fxUpdateSourceRef.current).toBe("none");
  });
});
