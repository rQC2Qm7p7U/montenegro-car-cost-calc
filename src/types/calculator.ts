export interface CalculatorState {
  carPriceEUR: number;
  carPriceKRW: string;
  useKRW: boolean;
  krwToEurRate: number;
  usdToEurRate: number;
  autoUpdateFX: boolean;
  isLoadingRates: boolean;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: "20ft" | "40ft";
}

export interface CalculationResults {
  carPrice: number;
  freight: number;
  freightPerContainerEUR: number;
  portAgentFee: number;
  translation: number;
  speditorFee: number;
  cif: number;
  customs: number;
  vatAmount: number;
  totalCostWithoutCar: number;
  finalCost: number;
  vatRefund: number;
  netCostForCompany: number;
  totalCIF: number;
  totalCustoms: number;
  totalVAT: number;
  totalCostWithoutCarAll: number;
  totalFinalCost: number;
  totalVATRefund: number;
  totalNetCostForCompany: number;
}
