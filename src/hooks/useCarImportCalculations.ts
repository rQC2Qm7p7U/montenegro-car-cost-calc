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
  return useMemo(
    () =>
      calculateCarImport({
        ...props,
      }),
    [
      props.carPrices,
      props.containerType,
      props.customsDuty,
      props.homologationFee,
      props.miscellaneous,
      props.numberOfCars,
      props.scenario,
      props.translationPages,
      props.usdToEurRate,
      props.vat,
    ],
  );
};
