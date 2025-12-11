import { Card } from "@/components/ui/card";
import ResultCard from "@/components/ResultCard";
import type { CalculationResults as Results } from "@/types/calculator";
import { Receipt, TrendingUp, Wallet } from "lucide-react";

interface CalculationResultsProps {
  results: Results;
  numberOfCars: number;
  scenario: "physical" | "company";
  customsDuty: number;
  vat: number;
  krwToEurRate: number;
  usdToEurRate: number;
  completionPercent?: number;
}

export const CalculationResults = ({
  results,
  numberOfCars,
  scenario,
  customsDuty,
  vat,
  krwToEurRate,
  usdToEurRate,
  completionPercent = 0,
}: CalculationResultsProps) => {
  const formatEUR = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hasAnyPrice = results.carResults.some(car => car.carPrice > 0);

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      {/* Header with completion indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Results</h2>
          <p className="text-xs text-muted-foreground">
            {hasAnyPrice ? `${numberOfCars} vehicle${numberOfCars > 1 ? 's' : ''} calculated` : 'Enter car prices to see results'}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {!hasAnyPrice && (
        <Card className="p-8 text-center glass-card">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Enter vehicle prices to see the cost breakdown
          </p>
        </Card>
      )}

      {/* Per Car Details */}
      {hasAnyPrice && (
        <Card className="p-4 glass-card animate-scale-in overflow-hidden">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Per Car Breakdown
          </h3>
          <div className="space-y-3">
            {results.carResults.map((car) => (
              <div 
                key={car.carIndex} 
                className={`rounded-xl p-3 transition-all ${
                  car.carPrice > 0 
                    ? 'bg-gradient-to-r from-primary/5 to-transparent border border-primary/10' 
                    : 'bg-muted/30 border border-border/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                      {car.carIndex}
                    </span>
                    Car #{car.carIndex}
                  </span>
                  <span className={`text-base font-bold ${car.carPrice > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {car.carPrice > 0 ? `€${formatEUR(car.carPrice)}` : '—'}
                  </span>
                </div>
                
                {car.carPrice > 0 && (
                  <>
                    <div className="grid grid-cols-4 gap-1.5 text-xs">
                      <div className="bg-background/60 rounded-lg p-2 text-center">
                        <span className="text-muted-foreground block mb-0.5">CIF</span>
                        <span className="font-semibold">€{formatEUR(car.cif)}</span>
                      </div>
                      <div className="bg-background/60 rounded-lg p-2 text-center">
                        <span className="text-muted-foreground block mb-0.5">Customs</span>
                        <span className="font-semibold">€{formatEUR(car.customs)}</span>
                      </div>
                      <div className="bg-background/60 rounded-lg p-2 text-center">
                        <span className="text-muted-foreground block mb-0.5">VAT</span>
                        <span className="font-semibold">€{formatEUR(car.vatAmount)}</span>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-2 text-center">
                        <span className="text-muted-foreground block mb-0.5">Total</span>
                        <span className="font-bold text-primary">€{formatEUR(car.finalCost)}</span>
                      </div>
                    </div>

                    {scenario === "company" && (
                      <div className="mt-2 flex gap-1.5 text-xs">
                        <div className="flex-1 bg-green-500/10 rounded-lg p-2 text-center">
                          <span className="text-muted-foreground block mb-0.5">VAT Refund</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">+€{formatEUR(car.vatRefund)}</span>
                        </div>
                        <div className="flex-1 bg-green-500/10 rounded-lg p-2 text-center">
                          <span className="text-muted-foreground block mb-0.5">Net Cost</span>
                          <span className="font-bold text-green-600 dark:text-green-400">€{formatEUR(car.netCostForCompany)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Container Totals */}
      {hasAnyPrice && (
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-scale-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
              Container Total
            </h3>
          </div>
          <div className="space-y-2">
            <ResultCard 
              label="Car Prices" 
              value={results.totalCarPrices} 
              description={`${numberOfCars} vehicle${numberOfCars > 1 ? 's' : ''}`} 
            />
            <ResultCard 
              label="Total CIF" 
              value={results.totalCIF} 
              description="Cars + freight" 
            />
            <ResultCard
              label="Customs Duty"
              value={results.totalCustoms}
              description={`${customsDuty}%`}
            />
            <ResultCard 
              label="VAT" 
              value={results.totalVAT} 
              description={`${vat}%`} 
            />
            <div className="my-3 border-t border-primary/20" />
            <ResultCard 
              label="Grand Total" 
              value={results.totalFinalCost} 
              description="All costs included" 
              highlight 
            />

            {scenario === "company" && (
              <>
                <div className="my-3 border-t border-green-500/20" />
                <ResultCard
                  label="VAT Refund"
                  value={results.totalVATRefund}
                  description="Claimable"
                  positive
                />
                <ResultCard
                  label="Net Cost (Company)"
                  value={results.totalNetCostForCompany}
                  description="After refund"
                  highlight
                />
              </>
            )}
          </div>
        </Card>
      )}

      {/* Fee Breakdown - always visible */}
      <Card className="p-4 bg-muted/20 border-border/50 animate-scale-in" style={{ animationDelay: "0.15s" }}>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Fixed Costs per Car
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
            <span className="text-muted-foreground">Freight</span>
            <span className="font-semibold">€{formatEUR(results.freightPerCar)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
            <span className="text-muted-foreground">Port & Agent</span>
            <span className="font-semibold">€{formatEUR(results.portAgentFeePerCar)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
            <span className="text-muted-foreground">Translation</span>
            <span className="font-semibold">€{formatEUR(results.translationPerCar)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
            <span className="text-muted-foreground">Speditor</span>
            <span className="font-semibold">€{formatEUR(results.speditorFee)}</span>
          </div>
        </div>
      </Card>

      {/* Exchange rates footer */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
        <span>1 EUR = {(1 / krwToEurRate).toFixed(0)} KRW</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
        <span>1 USD = {usdToEurRate.toFixed(4)} EUR</span>
      </div>
    </div>
  );
};
