import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, expect, it, afterEach } from "vitest";
import type { CalculationResults, CarCalculationResult } from "@/types/calculator";
import { convertKRWToEUR } from "@/utils/currency";

vi.mock("@/components/ui/select", () => {
  const Select = ({
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (value: string) => void;
  }) => {
    return (
      <select
        aria-label="currency-select"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="eur">EUR €</option>
        <option value="krw">KRW ₩</option>
      </select>
    );
  };

  const SelectItem = () => null;
  const SelectContent = () => null;
  const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const SelectValue = () => null;

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

import { CarPricesSection } from "./CarPricesSection";
const makeResults = (carPrices: number[]): CalculationResults => {
  const carResults: CarCalculationResult[] = carPrices.map((price, index) => ({
    carIndex: index + 1,
    carPrice: price,
    freightPerCar: 1000,
    cif: price + 1000,
    customs: 100,
    vatAmount: 200,
    portAgentFeePerCar: 50,
    translationPerCar: 35,
    speditorFee: 0,
    homologationFee: 0,
    miscellaneous: 0,
    totalCostWithoutCar: 1385,
    finalCost: price + 1385,
    vatRefund: 0,
    netCostForCompany: price + 1385,
  }));

  const totals = carResults.reduce(
    (acc, car) => {
      acc.totalCarPrices += car.carPrice;
      acc.totalCIF += car.cif;
      acc.totalCustoms += car.customs;
      acc.totalVAT += car.vatAmount;
      acc.totalCostWithoutCars += car.totalCostWithoutCar;
      acc.totalFinalCost += car.finalCost;
      acc.totalVATRefund += car.vatRefund;
      acc.totalNetCostForCompany += car.netCostForCompany;
      return acc;
    },
    {
      totalCarPrices: 0,
      totalCIF: 0,
      totalCustoms: 0,
      totalVAT: 0,
      totalCostWithoutCars: 0,
      totalFinalCost: 0,
      totalVATRefund: 0,
      totalNetCostForCompany: 0,
    },
  );

  return {
    freightPerContainerEUR: 2000,
    freightPerCar: 1000,
    portAgentFeePerCar: 50,
    translationPerCar: 35,
    speditorFee: 0,
    carResults,
    ...totals,
  };
};

const baseProps = {
  language: "en" as const,
  numberOfCars: 2,
  carPrices: [0, 0],
  krwPerUsdRate: 1300,
  usdPerEurRate: 1.1,
};

const renderSection = (override: Partial<typeof baseProps> = {}) => {
  const merged = { ...baseProps, ...override };
  const setCarPrices = vi.fn();
  const results = makeResults(merged.carPrices);
  const utils = render(
    <CarPricesSection
      {...merged}
      setCarPrices={setCarPrices}
      results={results}
    />,
  );
  return { setCarPrices, ...utils, props: merged };
};

describe("CarPricesSection (RTL)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the correct number of inputs and updates on car count change", () => {
    const { rerender, props } = renderSection();
    expect(screen.getAllByPlaceholderText(/12 500/i)).toHaveLength(2);

    const nextProps = { ...props, numberOfCars: 3, carPrices: [0, 0, 0] };
    rerender(
      <CarPricesSection
        {...nextProps}
        setCarPrices={vi.fn()}
        results={makeResults(nextProps.carPrices)}
      />,
    );

    expect(screen.getAllByPlaceholderText(/12 500/i)).toHaveLength(3);
  });

  it("applies typed EUR price to state", async () => {
    const { setCarPrices } = renderSection();
    const user = userEvent.setup();

    const firstInput = screen.getAllByPlaceholderText(/12 500/i)[0];
    await user.type(firstInput, "12 345");

    await waitFor(() => expect(setCarPrices).toHaveBeenCalled());
    const updater = setCarPrices.mock.calls.at(-1)?.[0];
    const next = typeof updater === "function" ? updater([0, 0]) : updater;
    expect(next[0]).toBe(12345);
  });

  it("converts KRW input to EUR when in KRW mode", async () => {
    const { setCarPrices } = renderSection();
    const user = userEvent.setup();

    const currencySelect = screen.getByLabelText("currency-select");
    await user.selectOptions(currencySelect, "krw");

    const krwInput = screen.getAllByPlaceholderText(/2 280/i)[0];
    await user.type(krwInput, "2 280");

    await waitFor(() => expect(setCarPrices).toHaveBeenCalled());
    const updater = setCarPrices.mock.calls.at(-1)?.[0];
    const next = typeof updater === "function" ? updater([0, 0]) : updater;

    const expectedEUR = convertKRWToEUR(2_280 * 10_000, baseProps.krwPerUsdRate, baseProps.usdPerEurRate);
    expect(next[0]).toBeCloseTo(expectedEUR, 2);
  });

  it("applies first price to all cars via copy button", async () => {
    const setCarPrices = vi.fn();
    const props = { ...baseProps, carPrices: [10000, 0] };
    const user = userEvent.setup();
    render(
      <CarPricesSection
        {...props}
        setCarPrices={setCarPrices}
        results={makeResults(props.carPrices)}
      />,
    );

    const applyButtons = screen.getAllByRole("button", { name: /apply car #1 price to all/i });
    await user.click(applyButtons[0]);

    const next = setCarPrices.mock.calls.at(-1)?.[0];
    expect(next).toEqual([10000, 10000]);
  });
});
