export interface CalculatorState {
  carPrices: number[]; // Array of car prices in EUR
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

export interface CarCalculationResult {
  carIndex: number;
  carPrice: number;
  freightPerCar: number;
  cif: number;
  customs: number;
  vatAmount: number;
  portAgentFeePerCar: number;
  translationPerCar: number;
  speditorFee: number;
  homologationFee: number;
  miscellaneous: number;
  totalCostWithoutCar: number;
  finalCost: number;
  vatRefund: number;
  netCostForCompany: number;
}

export interface CalculationResults {
  // Container-level calculations
  freightPerContainerEUR: number;
  freightPerCar: number;
  portAgentFeePerCar: number;
  translationPerCar: number;
  speditorFee: number;

  // Per-car breakdown
  carResults: CarCalculationResult[];

  // Container totals
  totalCarPrices: number;
  totalCIF: number;
  totalCustoms: number;
  totalVAT: number;
  totalCostWithoutCars: number;
  totalFinalCost: number;
  totalVATRefund: number;
  totalNetCostForCompany: number;
}
