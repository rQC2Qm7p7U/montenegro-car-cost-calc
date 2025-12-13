import { useEffect } from "react";
import type { MutableRefObject } from "react";

type PersistableState = {
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
};

interface UseCalculatorPersistenceProps {
  persistKey: string;
  state: PersistableState;
  hasMountedRef: MutableRefObject<boolean>;
}

export const useCalculatorPersistence = ({
  persistKey,
  state,
  hasMountedRef,
}: UseCalculatorPersistenceProps) => {
  const {
    carPrices,
    krwPerUsdRate,
    usdPerEurRate,
    customsDuty,
    vat,
    translationPages,
    homologationFee,
    miscellaneous,
    scenario,
    numberOfCars,
    containerType,
    autoUpdateFX,
  } = state;

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const id = window.setTimeout(() => {
      const payload = {
        carPrices,
        krwPerUsdRate,
        usdPerEurRate,
        customsDuty,
        vat,
        translationPages,
        homologationFee,
        miscellaneous,
        scenario,
        numberOfCars,
        containerType,
        autoUpdateFX,
        persistedAt: Date.now(),
      };

      try {
        localStorage.setItem(persistKey, JSON.stringify(payload));
      } catch (error) {
        console.warn("Failed to persist calculator state", error);
      }
    }, 400);

    return () => window.clearTimeout(id);
  }, [
    autoUpdateFX,
    carPrices,
    containerType,
    customsDuty,
    hasMountedRef,
    homologationFee,
    krwPerUsdRate,
    miscellaneous,
    numberOfCars,
    scenario,
    translationPages,
    usdPerEurRate,
    vat,
    persistKey,
  ]);
};
