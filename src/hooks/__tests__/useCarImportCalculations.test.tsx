import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useCarImportCalculations } from "../useCarImportCalculations";
import type { CalculationResults } from "@/types/calculator";

type HookProps = Parameters<typeof useCarImportCalculations>[0];

const baseProps: HookProps = {
  carPrices: [10000, 12000, 8000, 7000],
  usdToEurRate: 1, // simplify math
  customsDuty: 5,
  vat: 21,
  translationPages: 3,
  homologationFee: 250,
  miscellaneous: 50,
  scenario: "physical",
  numberOfCars: 4,
  containerType: "40ft",
};

const runHook = (override: Partial<HookProps> = {}): CalculationResults => {
  let result: CalculationResults | null = null;
  const props = { ...baseProps, ...override };

  const TestComponent = () => {
    result = useCarImportCalculations(props);
    return null;
  };

  renderToString(<TestComponent />);

  if (!result) {
    throw new Error("Hook did not return a result");
  }
  return result;
};

describe("useCarImportCalculations", () => {
  it("calculates fees for 20ft container with 1 car (physical)", () => {
    const result = runHook({
      numberOfCars: 1,
      containerType: "20ft",
      carPrices: [10000],
      scenario: "physical",
    });

    expect(result.freightPerContainerEUR).toBeCloseTo(3150);
    expect(result.freightPerCar).toBeCloseTo(3150);
    expect(result.translationPerCar).toBeCloseTo(105); // 3 pages * 35
    expect(result.portAgentFeePerCar).toBeCloseTo(600); // 350/1 + 250

    const firstCar = result.carResults[0];
    expect(firstCar.customs).toBeCloseTo(657.5);
    expect(firstCar.vatAmount).toBeCloseTo(2899.575, 3);
    expect(firstCar.finalCost).toBeCloseTo(17893.575, 3);
    expect(result.totalFinalCost).toBeCloseTo(firstCar.finalCost);
  });

  it("splits freight correctly for 20ft container with 2 cars", () => {
    const result = runHook({
      numberOfCars: 2,
      containerType: "20ft",
      carPrices: [15000, 5000],
      scenario: "physical",
    });

    expect(result.freightPerContainerEUR).toBeCloseTo(3150);
    expect(result.freightPerCar).toBeCloseTo(1575);
    expect(result.portAgentFeePerCar).toBeCloseTo(425); // 350/2 + 250

    const [car1, car2] = result.carResults;
    expect(car1.finalCost).toBeCloseTo(22070.04, 2);
    expect(car2.finalCost).toBeCloseTo(9365.04, 2);
    expect(result.totalFinalCost).toBeCloseTo(car1.finalCost + car2.finalCost, 2);
  });

  it("handles 40ft container with 4 cars and company VAT refund", () => {
    const result = runHook({
      numberOfCars: 4,
      containerType: "40ft",
      carPrices: [10000, 12000, 8000, 7000],
      scenario: "company",
    });

    expect(result.freightPerContainerEUR).toBeCloseTo(4150);
    expect(result.freightPerCar).toBeCloseTo(1037.5);
    expect(result.portAgentFeePerCar).toBeCloseTo(355); // 420/4 + 250
    expect(result.totalVAT).toBeGreaterThan(0);

    const firstCar = result.carResults[0];
    expect(firstCar.vatRefund).toBeCloseTo(firstCar.vatAmount);
    expect(result.totalVATRefund).toBeCloseTo(result.totalVAT);
    expect(result.totalNetCostForCompany).toBeCloseTo(
      result.totalFinalCost - result.totalVAT,
      2,
    );
  });

  it("clamps number of cars to container capacity", () => {
    const result = runHook({
      numberOfCars: 4,
      containerType: "20ft",
      carPrices: [15000, 12000, 8000, 7000],
      usdToEurRate: 1,
    });

    expect(result.carResults).toHaveLength(2);
    expect(result.freightPerCar).toBeCloseTo(1575); // 3150 / 2
    expect(result.totalCarPrices).toBeCloseTo(27000);
  });

  it("normalizes negative car prices to zero", () => {
    const result = runHook({
      numberOfCars: 1,
      containerType: "20ft",
      carPrices: [-5000],
      usdToEurRate: 1,
    });

    const [car] = result.carResults;
    expect(car.carPrice).toBe(0);
    expect(result.totalCarPrices).toBe(0);
    expect(car.cif).toBeCloseTo(result.freightPerCar);
    expect(car.finalCost).toBeCloseTo(5188.575, 3);
  });
});
