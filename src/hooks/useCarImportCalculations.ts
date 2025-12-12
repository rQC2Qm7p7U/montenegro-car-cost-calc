import { useMemo } from "react";
import type {
  CalculationResults,
  CarCalculationResult,
} from "@/types/calculator";

interface UseCarImportCalculationsProps {
  carPrices: number[];
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
  props: UseCarImportCalculationsProps,
): CalculationResults => {
  const {
    carPrices,
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
    // Container freight calculation
    // 20ft: USD 3150 + EUR 350
    // 40ft: USD 4150 + EUR 420
    const freightUSD = containerType === "20ft" ? 3150 : 4150;
    const localCostsEUR = containerType === "20ft" ? 350 : 420;
    const freightPerContainerEUR = freightUSD * usdToEurRate;
    const freightPerCar = freightPerContainerEUR / numberOfCars;

    // Port & Agent Fee: (localCostsEUR ÷ numberOfCars) + 250 per car
    const portAgentFeePerCar = localCostsEUR / numberOfCars + 250;

    // Translation: translationPages × 35 per car
    const translationPerCar = translationPages * 35;

    // Speditor fee: 150 € + 21% VAT = 181.50 € per car
    const speditorFee = 150 * 1.21;

    // Calculate results for each car
    const carResults: CarCalculationResult[] = carPrices
      .slice(0, numberOfCars)
      .map((carPrice, index) => {
        // CIF = Car Price + Freight per car
        const cif = carPrice + freightPerCar;

        // Customs Duty = CIF × customsDuty%
        const customs = (cif * customsDuty) / 100;

        // VAT = (CIF + Customs) × vat%
        const vatAmount = ((cif + customs) * vat) / 100;

        // Total cost without car price
        const totalCostWithoutCar =
          freightPerCar +
          customs +
          vatAmount +
          speditorFee +
          homologationFee +
          translationPerCar +
          portAgentFeePerCar +
          miscellaneous;

        // Final cost including car
        const finalCost = carPrice + totalCostWithoutCar;

        // VAT refund for companies
        const vatRefund = scenario === "company" ? vatAmount : 0;
        const netCostForCompany =
          scenario === "company" ? finalCost - vatRefund : finalCost;

        return {
          carIndex: index + 1,
          carPrice,
          freightPerCar,
          cif,
          customs,
          vatAmount,
          portAgentFeePerCar,
          translationPerCar,
          speditorFee,
          homologationFee,
          miscellaneous,
          totalCostWithoutCar,
          finalCost,
          vatRefund,
          netCostForCompany,
        };
      });

    // Pad with empty results if not enough car prices
    while (carResults.length < numberOfCars) {
      const index = carResults.length;
      carResults.push({
        carIndex: index + 1,
        carPrice: 0,
        freightPerCar,
        cif: freightPerCar,
        customs: (freightPerCar * customsDuty) / 100,
        vatAmount:
          ((freightPerCar + (freightPerCar * customsDuty) / 100) * vat) / 100,
        portAgentFeePerCar,
        translationPerCar,
        speditorFee,
        homologationFee,
        miscellaneous,
        totalCostWithoutCar: 0,
        finalCost: 0,
        vatRefund: 0,
        netCostForCompany: 0,
      });
    }

    // Calculate container totals
    const totalCarPrices = carResults.reduce(
      (sum, car) => sum + car.carPrice,
      0,
    );
    const totalCIF = carResults.reduce((sum, car) => sum + car.cif, 0);
    const totalCustoms = carResults.reduce((sum, car) => sum + car.customs, 0);
    const totalVAT = carResults.reduce((sum, car) => sum + car.vatAmount, 0);
    const totalCostWithoutCars = carResults.reduce(
      (sum, car) => sum + car.totalCostWithoutCar,
      0,
    );
    const totalFinalCost = carResults.reduce(
      (sum, car) => sum + car.finalCost,
      0,
    );
    const totalVATRefund = carResults.reduce(
      (sum, car) => sum + car.vatRefund,
      0,
    );
    const totalNetCostForCompany = carResults.reduce(
      (sum, car) => sum + car.netCostForCompany,
      0,
    );

    return {
      freightPerContainerEUR,
      freightPerCar,
      portAgentFeePerCar,
      translationPerCar,
      speditorFee,
      carResults,
      totalCarPrices,
      totalCIF,
      totalCustoms,
      totalVAT,
      totalCostWithoutCars,
      totalFinalCost,
      totalVATRefund,
      totalNetCostForCompany,
    };
  }, [
    carPrices,
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
