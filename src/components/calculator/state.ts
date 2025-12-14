import type { SetStateAction } from "react";
import { FX_VALID_RANGES } from "@/utils/currency";
import type { Language } from "@/types/language";

export const PERSIST_KEY = "car-import-state-v1";
export const FX_LAST_SUCCESS_KEY = "car-import-last-fx-v1";
export const FX_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
export const LANGUAGE_STORAGE_KEY = "car-import-language";
export const STATE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const FX_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const MAX_CAR_PRICE_EUR = 500_000;
export const MAX_HOMOLOGATION_EUR = 10_000;
export const MAX_TRANSLATION_PAGES = 300;
export const MAX_MISC_EUR = 50_000;

export const DEFAULTS = {
  customsDuty: 5,
  vat: 21,
  translationPages: 3,
  homologationFee: 250,
  miscellaneous: 0,
};

export const getContainerMaxCars = (containerType: "20ft" | "40ft") =>
  containerType === "20ft" ? 2 : 4;

export const clampToRange = (
  value: number,
  range: { min: number; max: number },
  fallback: number,
) => {
  const safe = Number.isFinite(value) ? value : fallback;
  return Math.min(range.max, Math.max(range.min, safe));
};

export const clampPositive = (value: number, max: number, fallback: number) =>
  Math.min(max, Math.max(0, Number.isFinite(value) ? value : fallback));

export type CalculatorState = {
  carPrices: number[];
  krwPerUsdRate: number;
  usdPerEurRate: number;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: "20ft" | "40ft";
  autoUpdateFX: boolean;
  lastValidRates: { krwPerUsd: number; usdPerEur: number } | null;
  lastUpdatedAt: number | null;
};

export type Action =
  | { type: "setCarPrices"; value: number[] }
  | { type: "setCarPricesWithUpdater"; updater: SetStateAction<number[]> }
  | { type: "updateCarPrice"; index: number; value: number }
  | { type: "setNumberOfCars"; value: number }
  | { type: "setScenario"; value: "physical" | "company" }
  | { type: "setContainerType"; value: "20ft" | "40ft" }
  | { type: "setCustomsDuty"; value: number }
  | { type: "setVat"; value: number }
  | { type: "setTranslationPages"; value: number }
  | { type: "setHomologationFee"; value: number }
  | { type: "setMiscellaneous"; value: number }
  | { type: "setAutoUpdateFX"; value: boolean }
  | { type: "setRates"; krwPerUsdRate?: number; usdPerEurRate?: number }
  | { type: "setLastValidRates"; value: CalculatorState["lastValidRates"] }
  | { type: "setLastUpdatedAt"; value: number | null }
  | { type: "reset"; value: CalculatorState };

export const clampCars = (value: number, containerType: "20ft" | "40ft") =>
  Math.min(getContainerMaxCars(containerType), Math.max(1, value));

export const ensureCarPriceLength = (
  prices: number[],
  numberOfCars: number,
  containerType: "20ft" | "40ft",
) => {
  const target = clampCars(numberOfCars, containerType);
  const sanitized = prices
    .slice(0, target)
    .map((price) => {
      const safe = !Number.isFinite(price) || price < 0 ? 0 : price;
      return Math.min(MAX_CAR_PRICE_EUR, safe);
    });

  if (sanitized.length < target) {
    return [...sanitized, ...Array(target - sanitized.length).fill(0)];
  }
  return sanitized;
};

export const calculatorReducer = (
  state: CalculatorState,
  action: Action,
): CalculatorState => {
  switch (action.type) {
    case "setCarPrices":
      return {
        ...state,
        carPrices: ensureCarPriceLength(
          action.value,
          state.numberOfCars,
          state.containerType,
        ),
      };
    case "setCarPricesWithUpdater": {
      const nextValue =
        typeof action.updater === "function"
          ? action.updater(state.carPrices)
          : action.updater;
      return {
        ...state,
        carPrices: ensureCarPriceLength(
          nextValue,
          state.numberOfCars,
          state.containerType,
        ),
      };
    }
    case "updateCarPrice": {
      const next = ensureCarPriceLength(
        [...state.carPrices],
        state.numberOfCars,
        state.containerType,
      );
      next[action.index] =
        !Number.isFinite(action.value) || action.value < 0 ? 0 : action.value;
      return { ...state, carPrices: next };
    }
    case "setNumberOfCars": {
      const nextCount = clampCars(action.value, state.containerType);
      const base = state.carPrices.slice(0, nextCount);
      const nextPrices = ensureCarPriceLength(
        base,
        nextCount,
        state.containerType,
      );
      return {
        ...state,
        numberOfCars: nextCount,
        carPrices: nextPrices,
      };
    }
    case "setScenario":
      return { ...state, scenario: action.value };
    case "setContainerType": {
      const nextCount = clampCars(state.numberOfCars, action.value);
      const base = state.carPrices.slice(0, nextCount);
      return {
        ...state,
        containerType: action.value,
        numberOfCars: nextCount,
        carPrices: ensureCarPriceLength(base, nextCount, action.value),
      };
    }
    case "setCustomsDuty":
      return { ...state, customsDuty: action.value };
    case "setVat":
      return { ...state, vat: action.value };
    case "setTranslationPages":
      return {
        ...state,
        translationPages: clampPositive(
          action.value,
          MAX_TRANSLATION_PAGES,
          state.translationPages,
        ),
      };
    case "setHomologationFee":
      return {
        ...state,
        homologationFee: clampPositive(
          action.value,
          MAX_HOMOLOGATION_EUR,
          state.homologationFee,
        ),
      };
    case "setMiscellaneous":
      return {
        ...state,
        miscellaneous: clampPositive(
          action.value,
          MAX_MISC_EUR,
          state.miscellaneous,
        ),
      };
    case "setAutoUpdateFX":
      return { ...state, autoUpdateFX: action.value };
    case "setRates":
      return {
        ...state,
        krwPerUsdRate: action.krwPerUsdRate ?? state.krwPerUsdRate,
        usdPerEurRate: action.usdPerEurRate ?? state.usdPerEurRate,
      };
    case "setLastValidRates":
      return { ...state, lastValidRates: action.value };
    case "setLastUpdatedAt":
      return { ...state, lastUpdatedAt: action.value };
    case "reset":
      return { ...action.value };
    default:
      return state;
  }
};

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

export type InitialState = {
  carPrices: number[];
  krwPerUsdRate: number;
  usdPerEurRate: number;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: "20ft" | "40ft";
  autoUpdateFX: boolean;
  lastValidRates: { krwPerUsd: number; usdPerEur: number } | null;
  lastUpdatedAt: number | null;
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
      const normalized = String(value).replace(/\s+/g, "").replace(/\u00A0/g, "").replace(",", ".");
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

    if (!isStateFresh) {
      localStorage.removeItem(PERSIST_KEY);
    }

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
        ? Array.from(
            { length: resolvedNumberOfCars },
            (_, index) => {
              const value = parsedCarPrices[index] ?? 0;
              return Math.min(MAX_CAR_PRICE_EUR, value);
            },
          )
        : Array.from({ length: resolvedNumberOfCars }, () => 0);

    const legacyStoredRates = deriveLegacyRates(
      parseNumber((merged as Record<string, unknown>).krwToEurRate, NaN),
      parseNumber((merged as Record<string, unknown>).usdToEurRate, NaN),
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

    return {
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
