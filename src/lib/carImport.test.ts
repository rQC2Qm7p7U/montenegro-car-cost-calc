import { describe, expect, it } from "vitest";
import { calculateCarImport } from "./carImport";
import { convertKRWToEUR } from "@/utils/currency";

const baseParams = {
  carPrices: [10000],
  usdToEurRate: 1,
  customsDuty: 5,
  vat: 21,
  translationPages: 3,
  homologationFee: 250,
  miscellaneous: 0,
  scenario: "physical" as const,
  numberOfCars: 1,
  containerType: "40ft" as const,
  speditorFee: 181.5,
};

describe("calculateCarImport", () => {
  it("calculates physical person totals for a single car in 40ft container", () => {
    const result = calculateCarImport(baseParams);

    expect(result.freightPerCar).toBeCloseTo(4150, 3);
    expect(result.portAgentFeePerCar).toBeCloseTo(670, 3);
    expect(result.translationPerCar).toBeCloseTo(105, 3);

    const car = result.carResults[0];
    expect(car.cif).toBeCloseTo(14150, 3);
    expect(car.customs).toBeCloseTo(707.5, 3);
    expect(car.vatAmount).toBeCloseTo(3120.075, 3);
    expect(car.finalCost).toBeCloseTo(19184.075, 3);

    expect(result.totalVATRefund).toBe(0);
    expect(result.totalNetCostForCompany).toBeCloseTo(result.totalFinalCost, 3);
  });

  it("handles company scenario and VAT refund correctly", () => {
    const result = calculateCarImport({
      ...baseParams,
      scenario: "company",
    });

    expect(result.totalVAT).toBeCloseTo(result.totalVATRefund, 3);
    expect(result.totalNetCostForCompany).toBeCloseTo(
      result.totalFinalCost - result.totalVAT,
      3,
    );
  });

  it("splits container and local costs across multiple cars (20ft, 2 cars)", () => {
    const result = calculateCarImport({
      carPrices: [8000, 9000],
      usdToEurRate: 1,
      customsDuty: 5,
      vat: 21,
      translationPages: 1,
      homologationFee: 250,
      miscellaneous: 0,
      scenario: "physical",
      numberOfCars: 2,
      containerType: "20ft",
      speditorFee: 181.5,
    });

    expect(result.freightPerContainerEUR).toBeCloseTo(3150, 3);
    expect(result.freightPerCar).toBeCloseTo(1575, 3);
    expect(result.portAgentFeePerCar).toBeCloseTo(425, 3);
    expect(result.translationPerCar).toBeCloseTo(35, 3);

    expect(result.carResults[0].finalCost).toBeCloseTo(13056.5375, 3);
    expect(result.carResults[1].finalCost).toBeCloseTo(14327.0375, 3);
    expect(result.totalFinalCost).toBeCloseTo(
      result.carResults[0].finalCost + result.carResults[1].finalCost,
      5,
    );
  });

  it("supports zero customs/VAT edge cases", () => {
    const result = calculateCarImport({
      ...baseParams,
      customsDuty: 0,
      vat: 0,
    });

    expect(result.totalCustoms).toBe(0);
    expect(result.totalVAT).toBe(0);
    expect(result.totalVATRefund).toBe(0);
  });
});

describe("currency conversion helpers", () => {
  it("converts KRW to EUR with provided rate", () => {
    const eur = convertKRWToEUR(1_000_000, 0.001);
    expect(eur).toBe(1000);
  });
});
