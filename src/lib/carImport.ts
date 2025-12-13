import type { CalculationResults, CarCalculationResult } from "@/types/calculator";

export type ContainerType = "20ft" | "40ft";

interface ContainerConfig {
  freightUSD: number;
  localEUR: number;
  maxCars: number;
}

export interface CarImportParams {
  carPrices: number[];
  usdToEurRate: number;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: ContainerType;
  speditorFee: number;
}

export const getContainerConfig = (type: ContainerType): ContainerConfig =>
  type === "20ft"
    ? { maxCars: 2, freightUSD: 3150, localEUR: 350 }
    : { maxCars: 4, freightUSD: 4150, localEUR: 420 };

export const calculateCarImport = (params: CarImportParams): CalculationResults => {
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
  speditorFee,
} = params;

  const containerConfig = getContainerConfig(containerType);
  const carsCount = Math.min(containerConfig.maxCars, Math.max(1, numberOfCars));

  const freightPerContainerEUR = containerConfig.freightUSD * usdToEurRate;
  const freightPerCar = freightPerContainerEUR / carsCount;
  const portAgentFeePerCar = containerConfig.localEUR / carsCount + 250;
  const translationPerCar = translationPages * 35;
  const carResults: CarCalculationResult[] = [];

  for (let i = 0; i < carsCount; i += 1) {
    const carPrice = Math.max(0, carPrices[i] ?? 0);
    const cif = carPrice + freightPerCar;
    const customs = (cif * customsDuty) / 100;
    const vatAmount = ((cif + customs) * vat) / 100;
    const totalCostWithoutCar =
      freightPerCar +
      customs +
      vatAmount +
      speditorFee +
      homologationFee +
      translationPerCar +
      portAgentFeePerCar +
      miscellaneous;
    const finalCost = carPrice + totalCostWithoutCar;
    const vatRefund = scenario === "company" ? vatAmount : 0;
    const netCostForCompany =
      scenario === "company" ? finalCost - vatRefund : finalCost;

    carResults.push({
      carIndex: i + 1,
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
    });
  }

  const totalCarPrices = carResults.reduce((sum, car) => sum + car.carPrice, 0);
  const totalCIF = carResults.reduce((sum, car) => sum + car.cif, 0);
  const totalCustoms = carResults.reduce((sum, car) => sum + car.customs, 0);
  const totalVAT = carResults.reduce((sum, car) => sum + car.vatAmount, 0);
  const totalCostWithoutCars = carResults.reduce(
    (sum, car) => sum + car.totalCostWithoutCar,
    0,
  );
  const totalFinalCost = carResults.reduce((sum, car) => sum + car.finalCost, 0);
  const totalVATRefund = carResults.reduce((sum, car) => sum + car.vatRefund, 0);
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
};
