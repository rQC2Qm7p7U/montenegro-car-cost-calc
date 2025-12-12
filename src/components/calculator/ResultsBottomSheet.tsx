import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CalculationResults as Results } from "@/types/calculator";
import { 
  BottomSheet, 
  BottomSheetHeader, 
  BottomSheetBody, 
  BottomSheetFooter 
} from "@/components/ui/bottom-sheet";
import { 
  Receipt, 
  RefreshCcw, 
  Download, 
  Car,
  Container,
  Banknote,
  FileText,
  Ship,
  Building2,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Info
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
  containerType: "20ft" | "40ft";
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
  containerType,
  onRecalculate,
  onDownloadPDF,
}: ResultsBottomSheetProps) => {
  const formatEUR = (value: number) => 
    new Intl.NumberFormat('de-DE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(value);

  const carsWithPrices = results.carResults.filter(car => car.carPrice > 0);
  const containerInfo = containerType === "20ft" 
    ? { freightUSD: 3150, localEUR: 350 }
    : { freightUSD: 4150, localEUR: 420 };

  // Calculate averages
  const avgCarPrice = carsWithPrices.length > 0 
    ? results.totalCarPrices / carsWithPrices.length 
    : 0;
  const avgFinalCost = carsWithPrices.length > 0 
    ? results.totalFinalCost / carsWithPrices.length 
    : 0;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetHeader className="pb-0">
        <div className="flex items-center gap-3 pr-10 sm:pr-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Receipt className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Import Cost Analysis</h2>
            <p className="text-sm text-muted-foreground">
              {containerType} Container • {carsWithPrices.length} vehicle{carsWithPrices.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </BottomSheetHeader>

      <BottomSheetBody className="pt-4">
        <div className="space-y-6">
          
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: EXECUTIVE SUMMARY */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <section>
            <Card className="overflow-hidden border-2 border-primary/30">
              {/* Grand Total Header */}
              <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-5 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wider">
                      Total Import Cost
                    </p>
                    <p className="text-4xl font-bold mt-1">
                      €{formatEUR(results.totalFinalCost)}
                    </p>
                  </div>
                  <Calculator className="w-12 h-12 opacity-30" />
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="p-4 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-background/80">
                    <p className="text-xs text-muted-foreground mb-1">Vehicles</p>
                    <p className="text-xl font-bold text-foreground">{carsWithPrices.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80">
                    <p className="text-xs text-muted-foreground mb-1">Avg. per Car</p>
                    <p className="text-xl font-bold text-foreground">€{formatEUR(avgFinalCost)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/80">
                    <p className="text-xs text-muted-foreground mb-1">Taxes & Duties</p>
                    <p className="text-xl font-bold text-foreground">€{formatEUR(results.totalCustoms + results.totalVAT)}</p>
                  </div>
                </div>

                {scenario === "company" && (
                  <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Company Scenario</p>
                          <p className="text-xs text-muted-foreground">With VAT refund</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Net Cost</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          €{formatEUR(results.totalNetCostForCompany)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Save €{formatEUR(results.totalVATRefund)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: COST BREAKDOWN TABLE */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Cost Breakdown
              </h3>
            </div>
            
            <Card className="overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>Description</span>
                <span className="text-right">Amount</span>
              </div>
              
              {/* Vehicle Costs */}
              <div className="divide-y divide-border/50">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Vehicle Purchase ({carsWithPrices.length}×)</span>
                  </div>
                  <span className="font-semibold">€{formatEUR(results.totalCarPrices)}</span>
                </div>
                
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm">Sea Freight ({containerType})</span>
                      <p className="text-xs text-muted-foreground">
                        ${containerInfo.freightUSD} + €{containerInfo.localEUR}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">€{formatEUR(results.freightPerContainerEUR)}</span>
                </div>

                <div className="p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CIF Value (Cost + Insurance + Freight)</span>
                    <span className="font-bold text-primary">€{formatEUR(results.totalCIF)}</span>
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm">Customs Duty</span>
                      <p className="text-xs text-muted-foreground">{customsDuty}% of CIF</p>
                    </div>
                  </div>
                  <span className="font-semibold">€{formatEUR(results.totalCustoms)}</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm">VAT</span>
                      <p className="text-xs text-muted-foreground">{vat}% of (CIF + Duty)</p>
                    </div>
                  </div>
                  <span className="font-semibold">€{formatEUR(results.totalVAT)}</span>
                </div>
              </div>

              {/* Services Section */}
              <div className="border-t-2 border-dashed border-border">
                <div className="p-3 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Services & Fees (per container)
                </div>
                <div className="divide-y divide-border/50">
                  <div className="p-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Port & Agent Fee</span>
                    <span>€{formatEUR(results.portAgentFeePerCar * numberOfCars)}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Speditor Fee ({numberOfCars}×)</span>
                    <span>€{formatEUR(results.speditorFee * numberOfCars)}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Translation</span>
                    <span>€{formatEUR(results.translationPerCar * numberOfCars)}</span>
                  </div>
                  <div className="p-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Homologation ({numberOfCars}×)</span>
                    <span>€{formatEUR(results.carResults[0]?.homologationFee * numberOfCars || 0)}</span>
                  </div>
                  {results.carResults[0]?.miscellaneous > 0 && (
                    <div className="p-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Miscellaneous ({numberOfCars}×)</span>
                      <span>€{formatEUR(results.carResults[0].miscellaneous * numberOfCars)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grand Total */}
              <div className="p-4 bg-primary/10 border-t-2 border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-bold text-lg">GRAND TOTAL</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">€{formatEUR(results.totalFinalCost)}</span>
                </div>
              </div>
            </Card>
          </section>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: PER VEHICLE ANALYSIS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Per Vehicle Analysis
              </h3>
            </div>

            <div className="space-y-3">
              {results.carResults.map((car) => (
                <Card 
                  key={car.carIndex} 
                  className={`overflow-hidden transition-all ${
                    car.carPrice > 0 
                      ? 'border-primary/20' 
                      : 'opacity-40 border-dashed'
                  }`}
                >
                  {/* Car Header */}
                  <div className={`p-3 flex items-center justify-between ${
                    car.carPrice > 0 ? 'bg-primary/5' : 'bg-muted/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        car.carPrice > 0 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {car.carIndex}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Vehicle #{car.carIndex}</p>
                        <p className="text-xs text-muted-foreground">
                          {car.carPrice > 0 ? `Purchase: €${formatEUR(car.carPrice)}` : 'No price entered'}
                        </p>
                      </div>
                    </div>
                    {car.carPrice > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Cost</p>
                        <p className="text-xl font-bold text-primary">€{formatEUR(car.finalCost)}</p>
                      </div>
                    )}
                  </div>
                  
                  {car.carPrice > 0 && (
                    <div className="p-3">
                      {/* Cost Flow */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 overflow-x-auto pb-1">
                        <span className="whitespace-nowrap bg-muted/50 px-2 py-1 rounded">€{formatEUR(car.carPrice)}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap bg-muted/50 px-2 py-1 rounded">+Freight</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap bg-primary/10 px-2 py-1 rounded font-medium">CIF €{formatEUR(car.cif)}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap bg-muted/50 px-2 py-1 rounded">+Tax</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap bg-primary/20 px-2 py-1 rounded font-semibold">€{formatEUR(car.finalCost)}</span>
                      </div>

                      {/* Detailed Breakdown */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">CIF Value</span>
                          <span className="font-medium">€{formatEUR(car.cif)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">Customs ({customsDuty}%)</span>
                          <span className="font-medium">€{formatEUR(car.customs)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">VAT ({vat}%)</span>
                          <span className="font-medium">€{formatEUR(car.vatAmount)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">Freight Share</span>
                          <span className="font-medium">€{formatEUR(car.freightPerCar)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">Services</span>
                          <span className="font-medium">€{formatEUR(car.portAgentFeePerCar + car.translationPerCar + car.speditorFee)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-muted-foreground">Homologation</span>
                          <span className="font-medium">€{formatEUR(car.homologationFee)}</span>
                        </div>
                      </div>

                      {scenario === "company" && (
                        <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="text-green-700 dark:text-green-400 font-medium">VAT Refund</span>
                              <span className="text-muted-foreground ml-2">+€{formatEUR(car.vatRefund)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground">Net: </span>
                              <span className="font-bold text-green-600 dark:text-green-400">€{formatEUR(car.netCostForCompany)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: CALCULATION PARAMETERS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Calculation Parameters
              </h3>
            </div>
            
            <Card className="p-4 bg-muted/20 border-border/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="text-center p-2 bg-background/60 rounded-lg">
                  <p className="text-muted-foreground mb-1">Container</p>
                  <p className="font-semibold">{containerType}</p>
                </div>
                <div className="text-center p-2 bg-background/60 rounded-lg">
                  <p className="text-muted-foreground mb-1">Customs</p>
                  <p className="font-semibold">{customsDuty}%</p>
                </div>
                <div className="text-center p-2 bg-background/60 rounded-lg">
                  <p className="text-muted-foreground mb-1">VAT</p>
                  <p className="font-semibold">{vat}%</p>
                </div>
                <div className="text-center p-2 bg-background/60 rounded-lg">
                  <p className="text-muted-foreground mb-1">Scenario</p>
                  <p className="font-semibold capitalize">{scenario}</p>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/50" />
                  <span>1 EUR = {(1 / krwToEurRate).toLocaleString('de-DE', { maximumFractionDigits: 0 })} KRW</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/50" />
                  <span>1 USD = {usdToEurRate.toFixed(4)} EUR</span>
                </div>
              </div>
            </Card>
          </section>

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
            Edit Data
          </Button>
          <Button 
            onClick={onDownloadPDF}
            className="flex-1 h-12 gap-2 bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </BottomSheetFooter>
    </BottomSheet>
  );
};
