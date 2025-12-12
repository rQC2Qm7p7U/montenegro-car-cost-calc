import { useMemo } from "react";
import type { CalculationResults } from "@/types/calculator";
import { calculateCarImport } from "@/lib/carImport";

interface UseCarImportCalculationsProps {
  carPrices: number[];
  usdToEurRate: number;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: "20ft" | "40ft";
}

export const useCarImportCalculations = (
  props: UseCarImportCalculationsProps,
): CalculationResults => {
  const {
    carPrices,
    containerType,
    customsDuty,
    homologationFee,
    miscellaneous,
    numberOfCars,
    scenario,
    translationPages,
    usdToEurRate,
    vat,
  } = props;

  return useMemo(
    () =>
      calculateCarImport({
        carPrices,
        containerType,
        customsDuty,
        homologationFee,
        miscellaneous,
        numberOfCars,
        scenario,
        translationPages,
        usdToEurRate,
        vat,
      }),
    [
      carPrices,
      containerType,
      customsDuty,
      homologationFee,
      miscellaneous,
      numberOfCars,
      scenario,
      translationPages,
      usdToEurRate,
      vat,
    ],
  );
};
