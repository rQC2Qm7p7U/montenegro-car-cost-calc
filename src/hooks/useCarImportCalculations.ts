import { useMemo } from "react";
import { parseKRWInput, convertKRWToEUR } from "@/utils/currency";
import type { CalculationResults } from "@/types/calculator";

interface UseCarImportCalculationsProps {
  carPriceEUR: number;
  carPriceKRW: string;
  useKRW: boolean;
  krwToEurRate: number;
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
  props: UseCarImportCalculationsProps
): CalculationResults => {
  const {
    carPriceEUR,
    carPriceKRW,
    useKRW,
    krwToEurRate,
    usdToEurRate,
    customsDuty,
    vat,
    translationPages,
    homologationFee,
    miscellaneous,
    scenario,
    numberOfCars,
    containerType,
  } = props;

  return useMemo(() => {
    // Calculate car price in EUR
    const getCarPriceEUR = (): number => {
      if (useKRW && carPriceKRW) {
        const parsedInput = parseKRWInput(carPriceKRW);
        const actualKRW = parsedInput * 10000;
        return convertKRWToEUR(actualKRW, krwToEurRate);
      }
      return carPriceEUR;
    };

    const carPrice = getCarPriceEUR();

    // Freight: depends on container type
    // 20ft: USD 3150 + EUR 350 (max 2 cars)
    // 40ft: USD 4150 + EUR 420 (max 4 cars)
    const freightUSD = containerType === "20ft" ? 3150 : 4150;
    const localCostsEUR = containerType === "20ft" ? 350 : 420;
    const freightPerContainerEUR = freightUSD * usdToEurRate + localCostsEUR;
    const freight = freightPerContainerEUR / numberOfCars;

    // Port & Agent Fees (420 base + 250 per car)
    const portAgentFee = (420 + 250 * numberOfCars) / numberOfCars;

    // Documents & Services
    const translation = translationPages * 35;
    const speditorFee = 150 * 1.21; // 150 € + 21% VAT = 181.50 €

    // Taxes
    const cif = carPrice + freight;
    const customs = (cif * customsDuty) / 100;
    const vatAmount = ((cif + customs) * vat) / 100;

    // Totals (per car)
    const totalCostWithoutCar =
      freight + customs + vatAmount + speditorFee + homologationFee + translation + portAgentFee + miscellaneous;
    const finalCost = carPrice + totalCostWithoutCar;
    const vatRefund = scenario === "company" ? vatAmount : 0;
    const netCostForCompany = scenario === "company" ? finalCost - vatRefund : finalCost;

    // Total for all cars
    const totalCIF = cif * numberOfCars;
    const totalCustoms = customs * numberOfCars;
    const totalVAT = vatAmount * numberOfCars;
    const totalCostWithoutCarAll = totalCostWithoutCar * numberOfCars;
    const totalFinalCost = finalCost * numberOfCars;
    const totalVATRefund = vatRefund * numberOfCars;
    const totalNetCostForCompany = netCostForCompany * numberOfCars;

    return {
      carPrice,
      freight,
      freightPerContainerEUR,
      portAgentFee,
      translation,
      speditorFee,
      cif,
      customs,
      vatAmount,
      totalCostWithoutCar,
      finalCost,
      vatRefund,
      netCostForCompany,
      totalCIF,
      totalCustoms,
      totalVAT,
      totalCostWithoutCarAll,
      totalFinalCost,
      totalVATRefund,
      totalNetCostForCompany,
    };
  }, [
    carPriceEUR,
    carPriceKRW,
    useKRW,
    krwToEurRate,
    usdToEurRate,
    customsDuty,
    vat,
    translationPages,
    homologationFee,
    miscellaneous,
    scenario,
    numberOfCars,
    containerType,
  ]);
};
