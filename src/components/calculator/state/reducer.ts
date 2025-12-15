import type { SetStateAction } from "react";
import { CONTAINER_CONFIGS } from "@/config/costs";
import {
  MAX_CAR_PRICE_EUR,
  MAX_HOMOLOGATION_EUR,
  MAX_MISC_EUR,
  MAX_TRANSLATION_PAGES,
} from "./constants";

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

export const getContainerMaxCars = (containerType: "20ft" | "40ft") =>
  CONTAINER_CONFIGS[containerType].maxCars;

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
