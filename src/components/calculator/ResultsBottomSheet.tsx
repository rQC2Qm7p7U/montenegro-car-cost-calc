import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResultCard from "@/components/ResultCard";
import type { CalculationResults as Results } from "@/types/calculator";
import { 
  BottomSheet, 
  BottomSheetHeader, 
  BottomSheetBody, 
  BottomSheetFooter 
} from "@/components/ui/bottom-sheet";
import { 
  Receipt, 
  TrendingUp, 
  RefreshCcw, 
  Download, 
  Car,
  Coins
} from "lucide-react";

interface ResultsBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: Results;
  numberOfCars: number;
  scenario: "physical" | "company";
  customsDuty: number;
  vat: number;
  krwToEurRate: number;
  usdToEurRate: number;
  onRecalculate: () => void;
  onDownloadPDF: () => void;
}

export const ResultsBottomSheet = ({
  open,
  onOpenChange,
  results,
  numberOfCars,
  scenario,
  customsDuty,
  vat,
  krwToEurRate,
  usdToEurRate,
  onRecalculate,
  onDownloadPDF,
}: ResultsBottomSheetProps) => {
  const formatEUR = (value: number) => 
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const carsWithPrices = results.carResults.filter(car => car.carPrice > 0);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetHeader>
        <div className="flex items-center gap-3 pr-10 sm:pr-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Receipt className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Calculation Results</h2>
            <p className="text-sm text-muted-foreground">
              {carsWithPrices.length} vehicle{carsWithPrices.length !== 1 ? 's' : ''} • Total €{formatEUR(results.totalFinalCost)}
            </p>
          </div>
        </div>
      </BottomSheetHeader>

      <BottomSheetBody>
        <div className="space-y-5">
          {/* Grand Total Summary Card */}
          <Card className="p-6 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/30 shadow-lg">
            <div className="text-center">
              <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">
                Grand Total
              </p>
              <p className="text-4xl font-bold text-foreground mb-1">
                €{formatEUR(results.totalFinalCost)}
              </p>
              <p className="text-sm text-muted-foreground">
                All costs included
              </p>
              
              {scenario === "company" && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">VAT Refund</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        +€{formatEUR(results.totalVATRefund)}
                      </p>
                    </div>
                    <div className="w-px h-10 bg-primary/20" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Net Cost</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        €{formatEUR(results.totalNetCostForCompany)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Per Car Breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Per Car Breakdown
              </h3>
            </div>
            <div className="space-y-3">
              {results.carResults.map((car) => (
                <Card 
                  key={car.carIndex} 
                  className={`p-4 transition-all ${
                    car.carPrice > 0 
                      ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/15' 
                      : 'bg-muted/30 border-border/30 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-bold">
                        {car.carIndex}
                      </span>
                      Car #{car.carIndex}
                    </span>
                    <span className={`text-lg font-bold ${car.carPrice > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {car.carPrice > 0 ? `€${formatEUR(car.carPrice)}` : '—'}
                    </span>
                  </div>
                  
                  {car.carPrice > 0 && (
                    <>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="bg-background/80 rounded-xl p-3 text-center">
                          <span className="text-muted-foreground text-xs block mb-1">CIF</span>
                          <span className="font-semibold">€{formatEUR(car.cif)}</span>
                        </div>
                        <div className="bg-background/80 rounded-xl p-3 text-center">
                          <span className="text-muted-foreground text-xs block mb-1">Customs</span>
                          <span className="font-semibold">€{formatEUR(car.customs)}</span>
                        </div>
                        <div className="bg-background/80 rounded-xl p-3 text-center">
                          <span className="text-muted-foreground text-xs block mb-1">VAT</span>
                          <span className="font-semibold">€{formatEUR(car.vatAmount)}</span>
                        </div>
                        <div className="bg-primary/15 rounded-xl p-3 text-center">
                          <span className="text-muted-foreground text-xs block mb-1">Total</span>
                          <span className="font-bold text-primary">€{formatEUR(car.finalCost)}</span>
                        </div>
                      </div>

                      {scenario === "company" && (
                        <div className="mt-3 flex gap-2 text-sm">
                          <div className="flex-1 bg-green-500/10 rounded-xl p-3 text-center">
                            <span className="text-muted-foreground text-xs block mb-1">VAT Refund</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">+€{formatEUR(car.vatRefund)}</span>
                          </div>
                          <div className="flex-1 bg-green-500/15 rounded-xl p-3 text-center">
                            <span className="text-muted-foreground text-xs block mb-1">Net Cost</span>
                            <span className="font-bold text-green-600 dark:text-green-400">€{formatEUR(car.netCostForCompany)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Container Totals */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
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
                description={`${carsWithPrices.length} vehicle${carsWithPrices.length !== 1 ? 's' : ''}`} 
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

          {/* Fixed Costs Per Car */}
          <Card className="p-4 bg-muted/30 border-border/50">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Fixed Costs per Car
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between items-center p-3 bg-background/60 rounded-xl">
                <span className="text-muted-foreground">Freight</span>
                <span className="font-semibold">€{formatEUR(results.freightPerCar)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/60 rounded-xl">
                <span className="text-muted-foreground">Port & Agent</span>
                <span className="font-semibold">€{formatEUR(results.portAgentFeePerCar)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/60 rounded-xl">
                <span className="text-muted-foreground">Translation</span>
                <span className="font-semibold">€{formatEUR(results.translationPerCar)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-background/60 rounded-xl">
                <span className="text-muted-foreground">Speditor</span>
                <span className="font-semibold">€{formatEUR(results.speditorFee)}</span>
              </div>
            </div>
          </Card>

          {/* Exchange Rates Info */}
          <div className="flex items-center justify-center gap-3 p-3 bg-muted/20 rounded-xl">
            <Coins className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              1 EUR = {(1 / krwToEurRate).toFixed(0)} KRW
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">
              1 USD = {usdToEurRate.toFixed(4)} EUR
            </span>
          </div>
        </div>
      </BottomSheetBody>

      <BottomSheetFooter>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onRecalculate}
            className="flex-1 h-12 gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Recalculate
          </Button>
          <Button 
            onClick={onDownloadPDF}
            className="flex-1 h-12 gap-2 bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </BottomSheetFooter>
    </BottomSheet>
  );
};
