import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useExchangeRates } from "./useExchangeRates";

const mockFetchExchangeRates = vi.fn();

vi.mock("@/utils/currency", () => ({
  fetchExchangeRates: (...args: unknown[]) => mockFetchExchangeRates(...args),
  FX_VALID_RANGES: {
    krwPerUsd: { min: 500, max: 2000 },
    usdPerEur: { min: 0.5, max: 2 },
  },
}));

const baseCopy = {
  ratesFallbackTitle: "Fallback",
  ratesUpdatedTitle: "Updated",
  ratesFallbackDescription: "Using fallback",
  ratesUpdatedDescription: () => "Updated desc",
};

const makeHook = (overrides?: Partial<Parameters<typeof useExchangeRates>[0]>) => {
  const applyRates = vi.fn();
  const setLastValidRates = vi.fn();
  const setLastUpdatedAt = vi.fn();
  const toast = vi.fn();

  const hook = renderHook(() =>
    useExchangeRates({
      autoUpdateFX: false,
      lastValidRates: null,
      language: "en",
      copy: baseCopy,
      applyRates,
      setLastValidRates,
      setLastUpdatedAt,
      toast,
      ...(overrides ?? {}),
    }),
  );

  return { hook, applyRates, setLastValidRates, setLastUpdatedAt, toast };
};

describe("useExchangeRates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies live rates and saves snapshot", async () => {
    mockFetchExchangeRates.mockResolvedValueOnce({
      krwPerUsd: 1200,
      usdPerEur: 1.1,
      isFallback: false,
      fetchedAt: 1234,
    });

    const { hook, applyRates, setLastValidRates, setLastUpdatedAt, toast } = makeHook();

    await waitFor(() => expect(applyRates).toHaveBeenCalledWith(1200, 1.1));
    expect(setLastValidRates).toHaveBeenCalledWith({ krwPerUsd: 1200, usdPerEur: 1.1 });
    expect(setLastUpdatedAt).toHaveBeenCalledWith(1234);
    expect(toast).toHaveBeenCalled();
  });

  it("handles fallback rates without storing snapshot", async () => {
    mockFetchExchangeRates.mockResolvedValueOnce({
      krwPerUsd: 1300,
      usdPerEur: 1.05,
      isFallback: true,
      fetchedAt: 555,
    });

    const { applyRates, setLastValidRates, setLastUpdatedAt } = makeHook();

    await waitFor(() => expect(applyRates).toHaveBeenCalledWith(1300, 1.05));
    expect(setLastValidRates).not.toHaveBeenCalled();
    expect(setLastUpdatedAt).toHaveBeenCalledWith(555);
  });

  it("bails out when offline", async () => {
    const originalNavigator = global.navigator;
    // @ts-expect-error overriding for test
    Object.defineProperty(global, "navigator", {
      value: { onLine: false },
      configurable: true,
    });
    const { hook, toast } = makeHook();

    await act(async () => {
      const result = await hook.result.current.handleFetchRates();
      expect(result).toBe(false);
    });

    expect(mockFetchExchangeRates).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalled();

    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
  });
});
