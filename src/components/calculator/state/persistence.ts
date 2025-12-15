import { FX_VALID_RANGES } from "@/utils/currency";
import type { Language } from "@/types/language";
import {
  DEFAULTS,
  FX_LAST_SUCCESS_KEY,
  FX_TTL_MS,
  LANGUAGE_STORAGE_KEY,
  MAX_CAR_PRICE_EUR,
  MAX_HOMOLOGATION_EUR,
  MAX_MISC_EUR,
  MAX_TRANSLATION_PAGES,
  PERSIST_KEY,
  STATE_TTL_MS,
} from "./constants";
import {
  clampCars,
  clampPositive,
  clampToRange,
  getContainerMaxCars,
  type CalculatorState,
} from "./reducer";

export type InitialState = CalculatorState;

export const resolveInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "ru";
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "ru") return stored;
    const browserLang = navigator.language?.toLowerCase();
    return browserLang?.startsWith("ru") ? "ru" : "en";
  } catch (error) {
    console.warn("Failed to resolve language, defaulting to RU", error);
    return "ru";
  }
};

export const readInitialState = (): InitialState => {
  if (typeof window === "undefined") {
    return {
      carPrices: [0],
      krwPerUsdRate: 1350,
      usdPerEurRate: 1.08,
      customsDuty: DEFAULTS.customsDuty,
      vat: DEFAULTS.vat,
      translationPages: DEFAULTS.translationPages,
      homologationFee: DEFAULTS.homologationFee,
      miscellaneous: DEFAULTS.miscellaneous,
      scenario: "physical",
      numberOfCars: 1,
      containerType: "40ft",
      autoUpdateFX: false,
      lastValidRates: null,
      lastUpdatedAt: null,
    };
  }

  try {
    const storedRaw = localStorage.getItem(PERSIST_KEY);
    const stored: Record<string, unknown> = storedRaw ? JSON.parse(storedRaw) : {};
    const storedFX = localStorage.getItem(FX_LAST_SUCCESS_KEY);
    const lastFx = storedFX ? JSON.parse(storedFX) : null;
    const now = Date.now();

    const parseNumber = (value: unknown, fallback: number) => {
      if (value === null || value === undefined || value === "") return fallback;
      const normalized = String(value)
        .replace(/\s+/g, "")
        .replace(/\u00A0/g, "")
        .replace(",", ".");
      const num = Number(normalized);
      return Number.isFinite(num) ? num : fallback;
    };

    const parseBool = (value: unknown, fallback: boolean) => {
      if (value === "true" || value === true) return true;
      if (value === "false" || value === false) return false;
      return fallback;
    };

    const parseArray = (value: unknown) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return value.split(",");
      return [];
    };

    const preferStored = <T,>(key: string, fallbackValue: T): T => {
      return (stored as Record<string, T | undefined>)[key] ?? fallbackValue;
    };

    const deriveLegacyRates = (krwToEur: number, usdToEur: number) => {
      if (!krwToEur || !usdToEur || krwToEur <= 0 || usdToEur <= 0) return null;
      const krwPerEur = 1 / krwToEur;
      const usdPerEur = 1 / usdToEur;
      const krwPerUsd = krwPerEur / usdPerEur;
      return Number.isFinite(krwPerUsd) && Number.isFinite(usdPerEur)
        ? { krwPerUsd, usdPerEur }
        : null;
    };

    const merged = {
      carPrices: preferStored("carPrices", stored.carPrices),
      krwPerUsdRate: preferStored("krwPerUsdRate", stored.krwPerUsdRate),
      usdPerEurRate: preferStored("usdPerEurRate", stored.usdPerEurRate),
      customsDuty: preferStored("customsDuty", stored.customsDuty),
      vat: preferStored("vat", stored.vat),
      translationPages: preferStored("translationPages", stored.translationPages),
      homologationFee: preferStored("homologationFee", stored.homologationFee),
      miscellaneous: preferStored("miscellaneous", stored.miscellaneous),
      scenario: preferStored("scenario", stored.scenario),
      numberOfCars: preferStored("numberOfCars", stored.numberOfCars),
      containerType: preferStored("containerType", stored.containerType),
      autoUpdateFX: preferStored("autoUpdateFX", stored.autoUpdateFX),
    };
    const persistedAt = parseNumber(
      (stored as Record<string, unknown>).persistedAt,
      NaN,
    );
    const isStateFresh =
      Number.isFinite(persistedAt) && now - persistedAt <= STATE_TTL_MS;

    const resolvedContainer =
      merged.containerType === "20ft" || merged.containerType === "40ft"
        ? merged.containerType
        : "40ft";
    const resolvedNumberOfCars = Math.min(
      getContainerMaxCars(resolvedContainer),
      Math.max(1, parseNumber(merged.numberOfCars, 1)),
    );

    const parsedCarPrices = parseArray(
      merged.carPrices ?? merged.carPrices === 0 ? merged.carPrices : undefined,
    )
      .map((price) => Math.max(0, parseNumber(price, 0)))
      .slice(0, resolvedNumberOfCars);

    const normalizedCarPrices =
      parsedCarPrices.length > 0
        ? Array.from({ length: resolvedNumberOfCars }, (_, index) => {
            const value = parsedCarPrices[index] ?? 0;
            return Math.min(MAX_CAR_PRICE_EUR, value);
          })
        : Array.from({ length: resolvedNumberOfCars }, () => 0);

    const legacyStoredRates = deriveLegacyRates(
      parseNumber((stored as Record<string, unknown>).krwToEurRate, NaN),
      parseNumber((stored as Record<string, unknown>).usdToEurRate, NaN),
    );

    const fxFresh =
      lastFx &&
      Number.isFinite(lastFx.krwPerUsd) &&
      Number.isFinite(lastFx.usdPerEur) &&
      Number.isFinite(lastFx.fetchedAt) &&
      now - lastFx.fetchedAt <= FX_TTL_MS;

    if (lastFx && !fxFresh) {
      localStorage.removeItem(FX_LAST_SUCCESS_KEY);
    }

    const lastValidRates = fxFresh
      ? { krwPerUsd: lastFx.krwPerUsd, usdPerEur: lastFx.usdPerEur }
      : deriveLegacyRates(lastFx?.krwToEur, lastFx?.usdToEur);

    const baseState: InitialState = {
      carPrices: normalizedCarPrices,
      krwPerUsdRate: clampToRange(
        parseNumber(merged.krwPerUsdRate ?? legacyStoredRates?.krwPerUsd, 1350),
        FX_VALID_RANGES.krwPerUsd,
        1350,
      ),
      usdPerEurRate: clampToRange(
        parseNumber(merged.usdPerEurRate ?? legacyStoredRates?.usdPerEur, 1.08),
        FX_VALID_RANGES.usdPerEur,
        1.08,
      ),
      customsDuty: clampToRange(
        parseNumber(merged.customsDuty, DEFAULTS.customsDuty),
        { min: 0, max: 30 },
        DEFAULTS.customsDuty,
      ),
      vat: clampToRange(
        parseNumber(merged.vat, DEFAULTS.vat),
        { min: 0, max: 25 },
        DEFAULTS.vat,
      ),
      translationPages: Math.max(
        0,
        clampPositive(
          parseNumber(merged.translationPages, DEFAULTS.translationPages),
          MAX_TRANSLATION_PAGES,
          DEFAULTS.translationPages,
        ),
      ),
      homologationFee: Math.max(
        0,
        clampPositive(
          parseNumber(merged.homologationFee, DEFAULTS.homologationFee),
          MAX_HOMOLOGATION_EUR,
          DEFAULTS.homologationFee,
        ),
      ),
      miscellaneous: Math.max(
        0,
        clampPositive(
          parseNumber(merged.miscellaneous, DEFAULTS.miscellaneous),
          MAX_MISC_EUR,
          DEFAULTS.miscellaneous,
        ),
      ),
      scenario: merged.scenario === "company" ? "company" : "physical",
      numberOfCars: resolvedNumberOfCars,
      containerType: resolvedContainer,
      autoUpdateFX: parseBool(merged.autoUpdateFX, false),
      lastValidRates: lastValidRates ?? null,
      lastUpdatedAt:
        Number.isFinite(lastFx?.fetchedAt) &&
        now - (lastFx?.fetchedAt ?? 0) <= FX_TTL_MS
          ? lastFx?.fetchedAt
          : null,
    };

    if (!isStateFresh) {
      localStorage.removeItem(PERSIST_KEY);
      return {
        ...baseState,
        carPrices: Array.from({ length: baseState.numberOfCars }, () => 0),
        customsDuty: DEFAULTS.customsDuty,
        vat: DEFAULTS.vat,
        translationPages: DEFAULTS.translationPages,
        homologationFee: DEFAULTS.homologationFee,
        miscellaneous: DEFAULTS.miscellaneous,
        scenario: "physical",
      };
    }

    return baseState;
  } catch (error) {
    console.warn("Failed to hydrate calculator state", error);
  }

  return {
    carPrices: [0],
    krwPerUsdRate: 1350,
    usdPerEurRate: 1.08,
    customsDuty: DEFAULTS.customsDuty,
    vat: DEFAULTS.vat,
    translationPages: DEFAULTS.translationPages,
    homologationFee: DEFAULTS.homologationFee,
    miscellaneous: DEFAULTS.miscellaneous,
    scenario: "physical",
    numberOfCars: 1,
    containerType: "40ft",
    autoUpdateFX: false,
    lastValidRates: null,
    lastUpdatedAt: null,
  };
};
