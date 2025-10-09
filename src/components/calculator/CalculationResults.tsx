import { Card } from "@/components/ui/card";
import ResultCard from "@/components/ResultCard";
import type { CalculationResults as Results } from "@/types/calculator";

interface CalculationResultsProps {
  results: Results;
  numberOfCars: number;
  scenario: "physical" | "company";
  customsDuty: number;
  vat: number;
  krwToEurRate: number;
  usdToEurRate: number;
}

export const CalculationResults = ({
  results,
  numberOfCars,
  scenario,
  customsDuty,
  vat,
  krwToEurRate,
  usdToEurRate,
}: CalculationResultsProps) => {
  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Calculation Results</h2>
        {numberOfCars > 1 && <span className="text-sm text-muted-foreground">{numberOfCars} cars</span>}
      </div>

      {numberOfCars === 1 ? (
        <div className="space-y-3">
          <ResultCard label="CIF Value" value={results.cif} description="Car price + Freight" />
          <ResultCard label="Customs Duty" value={results.customs} description={`${customsDuty}% of CIF`} />
          <ResultCard label="VAT" value={results.vatAmount} description={`${vat}% of (CIF + Customs)`} />
          <ResultCard
            label="Total Cost (without car)"
            value={results.totalCostWithoutCar}
            description="All fees and taxes"
            highlight
          />
          <ResultCard
            label="Final Cost"
            value={results.finalCost}
            description="Total amount including car"
            highlight
          />

          {scenario === "company" && (
            <>
              <ResultCard
                label="VAT Refund"
                value={results.vatRefund}
                description="Refundable for companies"
                positive
              />
              <ResultCard
                label="Net Cost for Company"
                value={results.netCostForCompany}
                description="Final cost after VAT refund"
                highlight
              />
            </>
          )}
        </div>
      ) : (
        <>
          <Card className="p-4 bg-secondary/50 animate-scale-in">
            <h3 className="text-lg font-semibold text-foreground mb-3">Per Car</h3>
            <div className="space-y-2">
              <ResultCard label="CIF Value" value={results.cif} description="Car price + Freight" />
              <ResultCard label="Customs Duty" value={results.customs} description={`${customsDuty}% of CIF`} />
              <ResultCard label="VAT" value={results.vatAmount} description={`${vat}% of (CIF + Customs)`} />
              <ResultCard
                label="Total Cost (without car)"
                value={results.totalCostWithoutCar}
                description="All fees and taxes"
                highlight
              />
              <ResultCard
                label="Final Cost"
                value={results.finalCost}
                description="Total amount including car"
                highlight
              />

              {scenario === "company" && (
                <>
                  <ResultCard
                    label="VAT Refund"
                    value={results.vatRefund}
                    description="Refundable for companies"
                    positive
                  />
                  <ResultCard
                    label="Net Cost for Company"
                    value={results.netCostForCompany}
                    description="Final cost after VAT refund"
                    highlight
                  />
                </>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20 animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-lg font-semibold text-primary mb-3">
              Total Container ({numberOfCars} cars)
            </h3>
            <div className="space-y-2">
              <ResultCard label="Total CIF Value" value={results.totalCIF} description={`${numberOfCars} × CIF`} />
              <ResultCard
                label="Total Customs"
                value={results.totalCustoms}
                description={`${numberOfCars} × Customs`}
              />
              <ResultCard label="Total VAT" value={results.totalVAT} description={`${numberOfCars} × VAT`} />
              <ResultCard
                label="Total Cost (without cars)"
                value={results.totalCostWithoutCarAll}
                description="All fees and taxes"
                highlight
              />
              <ResultCard label="Total Final Cost" value={results.totalFinalCost} description="Grand total" highlight />

              {scenario === "company" && (
                <>
                  <ResultCard
                    label="Total VAT Refund"
                    value={results.totalVATRefund}
                    description="Total refundable"
                    positive
                  />
                  <ResultCard
                    label="Total Net Cost"
                    value={results.totalNetCostForCompany}
                    description="After VAT refund"
                    highlight
                  />
                </>
              )}
            </div>
          </Card>
        </>
      )}

      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        Rates used: 1 EUR = {(1 / krwToEurRate).toFixed(2)} KRW | 1 USD = {usdToEurRate.toFixed(4)} EUR
      </div>
    </div>
  );
};
