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
  const formatEUR = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Calculation Results</h2>
        <span className="text-sm text-muted-foreground">{numberOfCars} car{numberOfCars > 1 ? 's' : ''}</span>
      </div>

      {/* Per Car Details */}
      <Card className="p-4 bg-secondary/50 animate-scale-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">Per Car Details</h3>
        <div className="space-y-4">
          {results.carResults.map((car) => (
            <div key={car.carIndex} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">
                  Car #{car.carIndex}
                </span>
                <span className="text-lg font-bold text-primary">
                  {car.carPrice > 0 ? `€${formatEUR(car.carPrice)}` : 'No price set'}
                </span>
              </div>
              
              {car.carPrice > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div className="bg-background/50 rounded p-2">
                    <span className="text-muted-foreground block text-xs">CIF</span>
                    <span className="font-medium">€{formatEUR(car.cif)}</span>
                  </div>
                  <div className="bg-background/50 rounded p-2">
                    <span className="text-muted-foreground block text-xs">Customs ({customsDuty}%)</span>
                    <span className="font-medium">€{formatEUR(car.customs)}</span>
                  </div>
                  <div className="bg-background/50 rounded p-2">
                    <span className="text-muted-foreground block text-xs">VAT ({vat}%)</span>
                    <span className="font-medium">€{formatEUR(car.vatAmount)}</span>
                  </div>
                  <div className="bg-primary/10 rounded p-2">
                    <span className="text-muted-foreground block text-xs">Total per car</span>
                    <span className="font-bold text-primary">€{formatEUR(car.finalCost)}</span>
                  </div>
                </div>
              )}

              {car.carPrice > 0 && scenario === "company" && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-500/10 rounded p-2">
                    <span className="text-muted-foreground block text-xs">VAT Refund</span>
                    <span className="font-medium text-green-600">€{formatEUR(car.vatRefund)}</span>
                  </div>
                  <div className="bg-green-500/10 rounded p-2">
                    <span className="text-muted-foreground block text-xs">Net Cost (after refund)</span>
                    <span className="font-bold text-green-600">€{formatEUR(car.netCostForCompany)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Container Totals */}
      <Card className="p-4 bg-primary/5 border-primary/20 animate-scale-in" style={{ animationDelay: "0.1s" }}>
        <h3 className="text-lg font-semibold text-primary mb-3">
          Total Container ({numberOfCars} car{numberOfCars > 1 ? 's' : ''})
        </h3>
        <div className="space-y-2">
          <ResultCard 
            label="Total Car Prices" 
            value={results.totalCarPrices} 
            description={`Sum of all ${numberOfCars} car prices`} 
          />
          <ResultCard 
            label="Total CIF Value" 
            value={results.totalCIF} 
            description="All cars + freight" 
          />
          <ResultCard
            label="Total Customs"
            value={results.totalCustoms}
            description={`${customsDuty}% of each CIF`}
          />
          <ResultCard 
            label="Total VAT" 
            value={results.totalVAT} 
            description={`${vat}% of (CIF + Customs)`} 
          />
          <ResultCard
            label="Total Costs (without cars)"
            value={results.totalCostWithoutCars}
            description="All fees and taxes"
            highlight
          />
          <ResultCard 
            label="Total Final Cost" 
            value={results.totalFinalCost} 
            description="Grand total for all cars" 
            highlight 
          />

          {scenario === "company" && (
            <>
              <ResultCard
                label="Total VAT Refund"
                value={results.totalVATRefund}
                description="Total refundable VAT"
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

      {/* Fee Breakdown */}
      <Card className="p-4 bg-muted/30 animate-scale-in" style={{ animationDelay: "0.15s" }}>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Shared Costs per Car
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-background rounded p-2">
            <span className="text-muted-foreground block">Freight</span>
            <span className="font-medium">€{formatEUR(results.freightPerCar)}</span>
          </div>
          <div className="bg-background rounded p-2">
            <span className="text-muted-foreground block">Port & Agent</span>
            <span className="font-medium">€{formatEUR(results.portAgentFeePerCar)}</span>
          </div>
          <div className="bg-background rounded p-2">
            <span className="text-muted-foreground block">Translation</span>
            <span className="font-medium">€{formatEUR(results.translationPerCar)}</span>
          </div>
          <div className="bg-background rounded p-2">
            <span className="text-muted-foreground block">Speditor</span>
            <span className="font-medium">€{formatEUR(results.speditorFee)}</span>
          </div>
        </div>
      </Card>

      <div className="text-xs text-muted-foreground text-center pt-4 border-t">
        Rates used: 1 EUR = {(1 / krwToEurRate).toFixed(2)} KRW | 1 USD = {usdToEurRate.toFixed(4)} EUR
      </div>
    </div>
  );
};
