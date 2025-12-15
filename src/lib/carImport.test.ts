import { describe, expect, it } from "vitest";
import { calculateCarImport } from "./carImport";

describe("calculateCarImport", () => {
  it("computes per-car and totals for a 20ft container", () => {
    const results = calculateCarImport({
      carPrices: [10_000, 20_000],
      usdToEurRate: 1,
      customsDuty: 5,
      vat: 21,
      translationPages: 2,
      homologationFee: 100,
      miscellaneous: 50,
      scenario: "company",
      numberOfCars: 2,
      containerType: "20ft",
      speditorFee: 200,
      speditorVatRate: 0.21,
    });

    expect(results.freightPerContainerEUR).toBe(3150);
    expect(results.freightPerCar).toBeCloseTo(1575);
    expect(results.portAgentFeePerCar).toBeCloseTo(425);
    expect(results.translationPerCar).toBe(70);

    // Car #1 checks
    const first = results.carResults[0];
    expect(first.cif).toBeCloseTo(11_575);
    expect(first.customs).toBeCloseTo(578.75);
    expect(first.vatAmount).toBeCloseTo(2552.29, 2);
    expect(first.totalCostWithoutCar).toBeCloseTo(5551.04, 2);
    expect(first.finalCost).toBeCloseTo(15_551.04, 2);
    expect(first.vatRefund).toBeCloseTo(2587.0, 1);
    expect(first.netCostForCompany).toBeCloseTo(12_964.04, 2);

    // Aggregates
    expect(results.totalCarPrices).toBe(30_000);
    expect(results.totalCustoms).toBeCloseTo(1657.5);
    expect(results.totalVAT).toBeCloseTo(7309.58, 2);
    expect(results.totalCostWithoutCars).toBeCloseTo(13_807.075, 3);
    expect(results.totalFinalCost).toBeCloseTo(43_807.075, 3);
    expect(results.totalVATRefund).toBeCloseTo(7379.0, 1);
    expect(results.totalNetCostForCompany).toBeCloseTo(36_428.1, 1);
  });
});
