import { useCallback } from "react";
import type { SetStateAction } from "react";
import { FX_VALID_RANGES } from "@/utils/currency";
import {
  clampToRange,
  type InitialState,
  type CalculatorState,
  MAX_MISC_EUR,
  MAX_HOMOLOGATION_EUR,
  MAX_TRANSLATION_PAGES,
} from "./state";
import type { Action } from "./state";

interface UseDispatchersProps {
  state: CalculatorState;
  initialState: InitialState;
  dispatchTracked: (action: Action, options?: { skipDirty?: boolean }) => void;
}

export const useCalculatorDispatchers = ({
  state,
  initialState,
  dispatchTracked,
}: UseDispatchersProps) => {
  const {
    carPrices,
    krwPerUsdRate,
    usdPerEurRate,
    customsDuty,
    vat,
    translationPages,
    homologationFee,
    miscellaneous,
    numberOfCars,
  } = state;

  const setCarPrices = useCallback(
    (updater: SetStateAction<number[]>, options?: { skipDirty?: boolean }) => {
      dispatchTracked({ type: "setCarPricesWithUpdater", updater }, options);
    },
    [dispatchTracked],
  );

  const setKrwPerUsdRate = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(krwPerUsdRate) : updater;
      const clamped = clampToRange(
        next,
        FX_VALID_RANGES.krwPerUsd,
        initialState.krwPerUsdRate,
      );
      dispatchTracked({ type: "setRates", krwPerUsdRate: clamped });
    },
    [dispatchTracked, initialState.krwPerUsdRate, krwPerUsdRate],
  );

  const setUsdPerEurRate = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(usdPerEurRate) : updater;
      const clamped = clampToRange(
        next,
        FX_VALID_RANGES.usdPerEur,
        initialState.usdPerEurRate,
      );
      dispatchTracked({ type: "setRates", usdPerEurRate: clamped });
    },
    [dispatchTracked, initialState.usdPerEurRate, usdPerEurRate],
  );

  const setCustomsDuty = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(customsDuty) : updater;
      dispatchTracked({ type: "setCustomsDuty", value: next });
    },
    [customsDuty, dispatchTracked],
  );

  const setVat = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(vat) : updater;
      dispatchTracked({ type: "setVat", value: next });
    },
    [dispatchTracked, vat],
  );

  const setTranslationPages = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(translationPages) : updater;
      dispatchTracked({ type: "setTranslationPages", value: next });
    },
    [dispatchTracked, translationPages],
  );

  const setHomologationFee = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(homologationFee) : updater;
      dispatchTracked({ type: "setHomologationFee", value: next });
    },
    [dispatchTracked, homologationFee],
  );

  const setMiscellaneous = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(miscellaneous) : updater;
      dispatchTracked({ type: "setMiscellaneous", value: next });
    },
    [dispatchTracked, miscellaneous],
  );

  const setScenario = useCallback(
    (value: "physical" | "company") => {
      dispatchTracked({ type: "setScenario", value });
    },
    [dispatchTracked],
  );

  const setNumberOfCars = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(numberOfCars) : updater;
      dispatchTracked({ type: "setNumberOfCars", value: next });
    },
    [dispatchTracked, numberOfCars],
  );

  const setContainerType = useCallback(
    (value: "20ft" | "40ft") => {
      dispatchTracked({ type: "setContainerType", value });
    },
    [dispatchTracked],
  );

  const setAutoUpdateFX = useCallback(
    (updater: SetStateAction<boolean>) => {
      const next =
        typeof updater === "function" ? updater(state.autoUpdateFX) : updater;
      dispatchTracked({ type: "setAutoUpdateFX", value: next });
    },
    [dispatchTracked, state.autoUpdateFX],
  );

  return {
    setCarPrices,
    setKrwPerUsdRate,
    setUsdPerEurRate,
    setCustomsDuty,
    setVat,
    setTranslationPages,
    setHomologationFee,
    setMiscellaneous,
    setScenario,
    setNumberOfCars,
    setContainerType,
    setAutoUpdateFX,
  };
};
