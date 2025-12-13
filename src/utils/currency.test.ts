import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FX_VALID_RANGES,
  convertKRWToEUR,
  convertKRWToUSD,
  convertUSDToEUR,
  fetchExchangeRates,
  formatEUR,
  formatKRW,
  parseKRWInput,
} from "./currency";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("currency formatting and parsing", () => {
  it("formats KRW and EUR values using spaces instead of nbsp", () => {
    expect(formatKRW(1234)).toBe("1 234");
    expect(formatEUR(98765.4)).toBe("98 765");
  });

  it("formats zero and negative values safely", () => {
    expect(formatEUR(0)).toBe("0");
    expect(formatEUR(-100)).toBe("-100");
  });

  it("returns zero for empty or invalid inputs", () => {
    expect(parseKRWInput("")).toBe(0);
    // @ts-expect-error allow undefined in test
    expect(parseKRWInput(undefined)).toBe(0);
    expect(parseKRWInput("abc")).toBe(0);
  });

  it("parses KRW inputs with mixed separators and symbols", () => {
    expect(parseKRWInput("1 234 567,89")).toBeCloseTo(1_234_567.89, 3);
    expect(parseKRWInput("   9.99  ")).toBeCloseTo(9.99, 3);
    expect(parseKRWInput("abc-99,50р")).toBeCloseTo(99.5, 3);
    expect(parseKRWInput("12.34.56")).toBeCloseTo(12.3456, 4);
    expect(parseKRWInput("1..2")).toBeCloseTo(1.2, 3);
  });
});

describe("conversion helpers", () => {
  it("returns zero when rates are missing or invalid", () => {
    expect(convertKRWToUSD(1000, 0)).toBe(0);
    expect(convertUSDToEUR(500, 0)).toBe(0);
    expect(convertKRWToEUR(10_000, -1, 0)).toBe(0);
    expect(convertKRWToUSD(1000, Number.POSITIVE_INFINITY)).toBe(0);
    expect(convertUSDToEUR(500, Number.NaN)).toBe(0);
  });

  it("converts KRW → USD → EUR using provided rates", () => {
    const krw = 1_350_000;
    const krwPerUsd = 1350;
    const usdPerEur = 1.08;

    const usd = convertKRWToUSD(krw, krwPerUsd);
    const eur = convertUSDToEUR(usd, usdPerEur);
    const chained = convertKRWToEUR(krw, krwPerUsd, usdPerEur);

    expect(usd).toBeCloseTo(1000, 5);
    expect(eur).toBeCloseTo(925.9259, 4);
    expect(chained).toBeCloseTo(eur, 5);
  });
});

describe("fetchExchangeRates", () => {
  it("returns live rates when API responds with valid data", async () => {
    const mockFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          rates: { KRW: 1400, USD: 1.1 },
        }),
      } as Response);

    const result = await fetchExchangeRates();

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result.isFallback).toBe(false);
    expect(result.krwPerUsd).toBeCloseTo(1400 / 1.1, 5);
    expect(result.usdPerEur).toBeCloseTo(1.1, 3);
    expect(typeof result.fetchedAt).toBe("number");
  });

  it("falls back when API misses expected fields", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { JPY: 1 } }),
    } as Response);

    const result = await fetchExchangeRates();

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(result.isFallback).toBe(true);
    expect(result.krwPerUsd).toBe(1350);
    expect(result.usdPerEur).toBeCloseTo(1.08);
  });

  it("falls back when fetch throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const result = await fetchExchangeRates();

    expect(result.isFallback).toBe(true);
    expect(result.krwPerUsd).toBe(1350);
    expect(result.usdPerEur).toBeCloseTo(1.08);
  });

  it("falls back when API returns out-of-range rates", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        rates: { KRW: FX_VALID_RANGES.krwPerUsd.max * FX_VALID_RANGES.usdPerEur.max * 10, USD: 0.2 },
      }),
    } as Response);

    const result = await fetchExchangeRates();

    expect(result.isFallback).toBe(true);
    expect(result.krwPerUsd).toBe(1350);
    expect(result.usdPerEur).toBeCloseTo(1.08);
  });

  it("falls back on abort errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const abortError = new DOMException("aborted", "AbortError");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(abortError);

    const result = await fetchExchangeRates();

    expect(result.isFallback).toBe(true);
  });
});
