import { useState } from "react";
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
  Banknote,
  FileText,
  Ship,
  Building2,
  Calculator,
  CheckCircle2,
  Info,
  TrendingUp
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { exportCalculationPDF } from "@/utils/pdfExport";
import { toast } from "@/hooks/use-toast";

interface ResultsBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: Results;
  numberOfCars: number;
  scenario: "physical" | "company";
  customsDuty: number;
  vat: number;
  krwPerUsdRate: number;
  usdPerEurRate: number;
  containerType: "20ft" | "40ft";
  onRecalculate: () => void;
  onScenarioChange: (scenario: "physical" | "company") => void;
}

export const ResultsBottomSheet = ({
  open,
  onOpenChange,
  results,
  numberOfCars,
  scenario,
  customsDuty,
  vat,
  krwPerUsdRate,
  usdPerEurRate,
  containerType,
  onRecalculate,
  onScenarioChange,
}: ResultsBottomSheetProps) => {
  const [openInfoKey, setOpenInfoKey] = useState<string | null>(null);
  const formatEUR = (value: number) => Math.round(value).toLocaleString('de-DE');
  const formatEURWithCents = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const carsWithPrices = results.carResults.filter(car => car.carPrice > 0);
  const containerInfo = containerType === "20ft" 
    ? { freightUSD: 3150, localEUR: 350 }
    : { freightUSD: 4150, localEUR: 420 };
  const carsCount = Math.max(1, results.carResults.length);
  const mneExpenses = Math.max(0, results.totalFinalCost - results.totalCarPrices);

  const avgFinalCost = carsWithPrices.length > 0 
    ? results.totalFinalCost / carsWithPrices.length 
    : 0;

  const physicalTotal = results.totalFinalCost;
  const companyNet = results.totalFinalCost - results.totalVAT;
  const vatRefundTotal = results.totalVAT;
  const eurPerUsdRate = usdPerEurRate > 0 ? 1 / usdPerEurRate : 0;
  const formatKrwPerUsd = (value: number) =>
    value > 0
      ? `₩${Math.round(value).toLocaleString("en-US")}`
      : "—";
  const formatUsdPerEur = (value: number) =>
    value > 0
      ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
      : "—";
  const formatEurPerUsd = (value: number) =>
    value > 0
      ? `€${value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
      : "—";

  const handleExportPDF = () => {
    try {
      exportCalculationPDF({
        results,
        numberOfCars,
        scenario,
        customsDuty,
        vat,
        krwPerUsdRate,
        usdPerEurRate,
        containerType,
      });
      toast({
        title: "PDF Exported",
        description: "Calculation report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetHeader className="pb-0">
        <div className="flex items-center gap-3 pr-10 sm:pr-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Receipt className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">Import Cost Analysis</h2>
            <p className="text-xs text-muted-foreground">
              {containerType} Container • {carsWithPrices.length} vehicle{carsWithPrices.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </BottomSheetHeader>

      <BottomSheetBody className="pt-4">
        <div className="space-y-5">
          {/* SECTION 0: SCENARIO COMPARE */}
          <Card className="p-4 border-primary/30">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Physical vs Company</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={scenario === "physical" ? "default" : "outline"}
                  onClick={() => onScenarioChange("physical")}
                  className="h-8"
                >
                  Physical
                </Button>
                <Button
                  size="sm"
                  variant={scenario === "company" ? "default" : "outline"}
                  onClick={() => onScenarioChange("company")}
                  className="h-8"
                >
                  Company
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Physical</p>
                <p className="text-xl font-bold text-foreground">€{formatEUR(physicalTotal)}</p>
                <p className="text-[11px] text-muted-foreground">With VAT</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-[11px] text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">Company</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">€{formatEUR(companyNet)}</p>
                <p className="text-[11px] text-green-700 dark:text-green-400">VAT refund applied</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/30">
                <p className="text-[11px] text-primary uppercase tracking-wide mb-1">Savings</p>
                <p className="text-xl font-bold text-primary">€{formatEUR(Math.max(0, vatRefundTotal))}</p>
                <p className="text-[11px] text-muted-foreground">Refunded VAT</p>
              </div>
            </div>
          </Card>
          
          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <Card className="overflow-hidden border-2 border-primary/30">
            <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-4 text-primary-foreground">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium opacity-90 uppercase tracking-wider">
                    Total Import Cost
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold mt-1 truncate">
                    €{formatEUR(results.totalFinalCost)}
                  </p>
                </div>
                <Calculator className="w-10 h-10 opacity-30 shrink-0" />
              </div>
            </div>
            
            <div className="p-3 bg-gradient-to-b from-primary/5 to-transparent">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-background/80">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Vehicles</p>
                  <p className="text-base font-bold text-foreground">{carsWithPrices.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-background/80">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Avg/Car</p>
                  <p className="text-base font-bold text-foreground">€{formatEUR(avgFinalCost)}</p>
                </div>
                <div className="p-2 rounded-lg bg-background/80">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Taxes</p>
                  <p className="text-base font-bold text-foreground">€{formatEUR(results.totalCustoms + results.totalVAT)}</p>
                </div>
              </div>

              {scenario === "company" && (
                <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">Company</p>
                        <p className="text-[10px] text-muted-foreground">VAT refund</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        €{formatEUR(results.totalNetCostForCompany)}
                      </p>
                      <p className="text-[10px] text-green-600 dark:text-green-400">
                        Save €{formatEUR(results.totalVATRefund)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* SECTION 2: COST BREAKDOWN */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Cost Breakdown
              </h3>
            </div>
            
            <Card className="overflow-hidden">
              <div className="divide-y divide-border/50">
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">Vehicles ({carsWithPrices.length}×)</span>
                  </div>
                  <span className="font-semibold shrink-0">€{formatEUR(results.totalCarPrices)}</span>
                </div>
                
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Ship className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm block truncate">Freight ({containerType})</span>
                      <p className="text-[10px] text-muted-foreground">
                        ${containerInfo.freightUSD.toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold shrink-0">€{formatEUR(results.freightPerContainerEUR)}</span>
                </div>

                <div className="p-3 bg-muted/30 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">CIF Value</span>
                  <span className="font-bold text-primary shrink-0">€{formatEUR(results.totalCIF)}</span>
                </div>

                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Banknote className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">Customs {customsDuty}%</span>
                  </div>
                  <span className="font-semibold shrink-0">€{formatEUR(results.totalCustoms)}</span>
                </div>

                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Banknote className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">VAT {vat}%</span>
                  </div>
                  <span className="font-semibold shrink-0">€{formatEUR(results.totalVAT)}</span>
                </div>
              </div>

              {/* Services Section */}
              <div className="border-t border-dashed border-border">
                <div className="p-2 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Services & Fees
                </div>
                <div className="grid grid-cols-2 gap-px bg-border/30">
                  <div className="p-2 bg-background flex justify-between text-xs">
                    <span className="text-muted-foreground truncate">Port & Agent</span>
                    <span className="shrink-0 ml-1">€{formatEUR(results.portAgentFeePerCar * numberOfCars)}</span>
                  </div>
                  <div className="p-2 bg-background flex justify-between text-xs">
                    <span className="text-muted-foreground truncate">Speditor</span>
                    <span className="shrink-0 ml-1">€{formatEUR(results.speditorFee * numberOfCars)}</span>
                  </div>
                  <div className="p-2 bg-background flex justify-between text-xs">
                    <span className="text-muted-foreground truncate">Translation</span>
                    <span className="shrink-0 ml-1">€{formatEUR(results.translationPerCar * numberOfCars)}</span>
                  </div>
                  <div className="p-2 bg-background flex justify-between text-xs">
                    <span className="text-muted-foreground truncate">Homologation</span>
                    <span className="shrink-0 ml-1">€{formatEUR((results.carResults[0]?.homologationFee || 0) * numberOfCars)}</span>
                  </div>
                  {results.carResults[0]?.miscellaneous > 0 && (
                    <div className="p-2 bg-background flex justify-between text-xs col-span-2">
                      <span className="text-muted-foreground">Miscellaneous</span>
                      <span>€{formatEUR(results.carResults[0].miscellaneous * numberOfCars)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MNE Expenses */}
              <div className="border-t border-border/60">
                <Tooltip delayDuration={150}>
                  <Popover
                    open={openInfoKey === "mne-expenses"}
                    onOpenChange={(open) => setOpenInfoKey(open ? "mne-expenses" : null)}
                  >
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left p-3 flex items-center justify-between gap-2 bg-primary/5 hover:bg-primary/10 transition-colors cursor-help"
                          onClick={() => setOpenInfoKey(openInfoKey === "mne-expenses" ? null : "mne-expenses")}
                          aria-label="MNE expenses calculation details"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Info className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm font-medium truncate">MNE expenses</span>
                          </div>
                          <span className="font-bold text-primary shrink-0">€{formatEUR(mneExpenses)}</span>
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs hidden sm:block">
                      <p className="font-semibold mb-1">MNE expenses calculation</p>
                      <p className="text-muted-foreground leading-snug">
                        Total €{formatEURWithCents(results.totalFinalCost)} − Vehicles €{formatEURWithCents(results.totalCarPrices)} = €{formatEURWithCents(mneExpenses)}
                      </p>
                    </TooltipContent>
                    <PopoverContent side="top" className="max-w-xs text-xs sm:hidden">
                      <p className="font-semibold mb-1">MNE expenses calculation</p>
                      <p className="text-muted-foreground leading-snug">
                        Total €{formatEURWithCents(results.totalFinalCost)} − Vehicles €{formatEURWithCents(results.totalCarPrices)} = €{formatEURWithCents(mneExpenses)}
                      </p>
                    </PopoverContent>
                  </Popover>
                </Tooltip>
              </div>

              {/* Grand Total */}
              <div className="p-3 bg-primary/10 border-t-2 border-primary/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold text-base">TOTAL</span>
                </div>
                <span className="text-xl font-bold text-primary">€{formatEUR(results.totalFinalCost)}</span>
              </div>
            </Card>
          </section>

          {/* SECTION 3: PER VEHICLE ANALYSIS */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Per Vehicle
              </h3>
            </div>

            <div className="space-y-2">
              {carsWithPrices.map((car) => (
                <Card key={car.carIndex} className="overflow-hidden border-primary/20">
                  <div className="p-3 bg-primary/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground shrink-0">
                        {car.carIndex}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground">Car #{car.carIndex}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Purchase: €{formatEUR(car.carPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-primary">€{formatEUR(car.finalCost)}</p>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        {
                          key: "freight",
                          label: "Freight",
                          value: car.freightPerCar,
                          tip: `(${containerInfo.freightUSD} USD × ${formatEurPerUsd(eurPerUsdRate)} EUR/USD) ÷ ${carsCount} cars = €${formatEURWithCents(car.freightPerCar)}`,
                        },
                        {
                          key: "customs",
                          label: "Customs",
                          value: car.customs,
                          tip: `CIF €${formatEURWithCents(car.cif)} × ${customsDuty}% duty = €${formatEURWithCents(car.customs)}`,
                        },
                        {
                          key: "vat",
                          label: "VAT",
                          value: car.vatAmount,
                          tip: `(CIF €${formatEURWithCents(car.cif)} + Customs €${formatEURWithCents(car.customs)}) × ${vat}% VAT = €${formatEURWithCents(car.vatAmount)}`,
                        },
                        {
                          key: "services",
                          label: "Services",
                          value: car.portAgentFeePerCar + car.translationPerCar + car.speditorFee,
                          tip: `Port & agent €${formatEURWithCents(car.portAgentFeePerCar)} + Translation €${formatEURWithCents(car.translationPerCar)} + Speditor €${formatEURWithCents(car.speditorFee)}`,
                        },
                        {
                          key: "homologation",
                          label: "Homolog.",
                          value: car.homologationFee,
                          tip: `Homologation fee per car: €${formatEURWithCents(car.homologationFee)}`,
                        },
                        {
                          key: "misc",
                          label: "Misc",
                          value: car.miscellaneous,
                          tip: `Additional per-car costs you entered: €${formatEURWithCents(car.miscellaneous)}`,
                        },
                      ].map((item) => {
                        const infoKey = `${car.carIndex}-${item.key}`;
                        const isOpen = openInfoKey === infoKey;
                        const explanation = (
                          <div>
                            <p className="font-semibold mb-1">{item.label} calculation</p>
                            <p className="text-muted-foreground leading-snug">{item.tip}</p>
                          </div>
                        );

                        return (
                          <Tooltip key={infoKey} delayDuration={150}>
                            <Popover
                              open={isOpen}
                              onOpenChange={(open) => setOpenInfoKey(open ? infoKey : null)}
                            >
                              <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-2 rounded bg-muted/30 text-center cursor-help w-full h-full"
                                    onClick={() => setOpenInfoKey(isOpen ? null : infoKey)}
                                    aria-label={`${item.label} calculation details`}
                                  >
                                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                                    <p className="font-semibold">€{formatEUR(item.value)}</p>
                                  </button>
                                </PopoverTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[240px] text-xs hidden sm:block">
                                {explanation}
                              </TooltipContent>
                              <PopoverContent side="top" className="max-w-xs text-xs sm:hidden">
                                {explanation}
                              </PopoverContent>
                            </Popover>
                          </Tooltip>
                        );
                      })}
                    </div>

                    {scenario === "company" && (
                      <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-between text-xs">
                        <span className="text-green-700 dark:text-green-400 font-medium">
                          VAT Refund: €{formatEUR(car.vatRefund)}
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          Net: €{formatEUR(car.netCostForCompany)}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* SECTION 4: PARAMETERS */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Parameters
              </h3>
            </div>
            
            <Card className="p-3 bg-muted/20 border-border/50">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="text-[10px] text-muted-foreground">Container</p>
                  <p className="font-semibold">{containerType}</p>
                </div>
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="text-[10px] text-muted-foreground">Customs</p>
                  <p className="font-semibold">{customsDuty}%</p>
                </div>
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="text-[10px] text-muted-foreground">VAT</p>
                  <p className="font-semibold">{vat}%</p>
                </div>
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="text-[10px] text-muted-foreground">Type</p>
                  <p className="font-semibold capitalize">{scenario}</p>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <span>$1 = {formatKrwPerUsd(krwPerUsdRate)} KRW</span>
                <span>€1 = {formatUsdPerEur(usdPerEurRate)}</span>
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
            className="flex-1 h-11 gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Edit
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="flex-1 h-11 gap-2 bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </BottomSheetFooter>
    </BottomSheet>
  );
};
