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
import type { Language } from "@/types/language";
import { getContainerConfig } from "@/lib/carImport";

interface ResultsBottomSheetProps {
  language: Language;
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
  language,
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
  const isRu = language === "ru";
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat("ru-RU", options).format(value).replace(/\u00A0/g, " ");
  const formatEUR = (value: number) => formatNumber(Math.round(value));
  const formatEURWithCents = (value: number) =>
    formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const carsWithPrices = results.carResults.filter(car => car.carPrice > 0);
  const containerInfo = getContainerConfig(containerType);
  const carsCount = Math.max(1, results.carResults.length);
  const mneExpenses = Math.max(0, results.totalFinalCost - results.totalCarPrices);

  const avgFinalCost = carsWithPrices.length > 0 
    ? results.totalFinalCost / carsWithPrices.length 
    : 0;

  const physicalTotal = results.totalFinalCost;
  const vatRefundTotal = results.totalVATRefund || 0;
  const companyNet = results.totalNetCostForCompany || results.totalFinalCost;
  const eurPerUsdRate = usdPerEurRate > 0 ? 1 / usdPerEurRate : 0;
  const avgCarPurchase = carsWithPrices.length
    ? results.totalCarPrices / carsWithPrices.length
    : 0;
  const totalPortAgent = results.portAgentFeePerCar * numberOfCars;
  const totalSpeditor = results.speditorFee * numberOfCars;
  const totalTranslation = results.translationPerCar * numberOfCars;
  const perCarHomologation = results.carResults[0]?.homologationFee || 0;
  const totalHomologation = perCarHomologation * numberOfCars;
  const perCarMisc = results.carResults[0]?.miscellaneous || 0;
  const totalMisc = perCarMisc * numberOfCars;
  const formatKrwPerUsd = (value: number) =>
    value > 0
      ? `₩${formatNumber(Math.round(value))}`
      : "—";
  const formatUsdPerEur = (value: number) =>
    value > 0
      ? `$${formatNumber(value, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
      : "—";
  const formatEurPerUsd = (value: number) =>
    value > 0
      ? `€${formatNumber(value, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
      : "—";

  const handleExportPDF = () => {
    try {
      exportCalculationPDF({
        language,
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
        title: isRu ? "PDF сохранен" : "PDF Exported",
        description: isRu ? "Отчет по расчету скачан." : "Calculation report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: isRu ? "Не удалось сохранить" : "Export Failed",
        description: isRu ? "Попробуйте еще раз." : "Could not generate PDF. Please try again.",
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
            <h2 className="text-lg font-bold text-foreground truncate">
              {isRu ? "Анализ стоимости импорта" : "Import Cost Analysis"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {containerType} {isRu ? "контейнер" : "Container"} • {carsWithPrices.length} {isRu ? "авто" : `vehicle${carsWithPrices.length !== 1 ? "s" : ""}`}
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
                <h3 className="text-sm font-semibold text-foreground">
                  {isRu ? "Физлицо и компания" : "Physical vs Company"}
                </h3>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={scenario === "physical" ? "default" : "outline"}
                  onClick={() => onScenarioChange("physical")}
                  className="h-8"
                >
                  {isRu ? "Физ. лицо" : "Physical"}
                </Button>
                <Button
                  size="sm"
                  variant={scenario === "company" ? "default" : "outline"}
                  onClick={() => onScenarioChange("company")}
                  className="h-8"
                >
                  {isRu ? "Компания" : "Company"}
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  key: "scenario-physical",
                  title: isRu ? "Физ. лицо" : "Physical",
                  colorClasses: "bg-muted/40 border border-border/50",
                  value: `€${formatEUR(physicalTotal)}`,
                  note: isRu ? "С учетом НДС" : "With VAT",
                  tip: isRu
                    ? `${carsWithPrices.length} авто × €${formatEURWithCents(avgFinalCost)} = €${formatEURWithCents(physicalTotal)}`
                    : `${carsWithPrices.length} cars × €${formatEURWithCents(avgFinalCost)} avg = €${formatEURWithCents(physicalTotal)}`,
                },
                {
                  key: "scenario-company",
                  title: isRu ? "Компания" : "Company",
                  colorClasses: "bg-green-500/10 border border-green-500/30",
                  value: `€${formatEUR(companyNet)}`,
                  note: isRu ? "С возвратом НДС" : "VAT refund applied",
                  tip: isRu
                    ? `Физлицо €${formatEURWithCents(physicalTotal)} − возврат НДС €${formatEURWithCents(vatRefundTotal)} = €${formatEURWithCents(companyNet)}`
                    : `Physical €${formatEURWithCents(physicalTotal)} − VAT refund €${formatEURWithCents(vatRefundTotal)} = €${formatEURWithCents(companyNet)}`,
                },
                {
                  key: "scenario-savings",
                  title: isRu ? "Экономия" : "Savings",
                  colorClasses: "bg-primary/5 border border-primary/30",
                  value: `€${formatEUR(Math.max(0, vatRefundTotal))}`,
                  note: isRu ? "Возврат НДС" : "Refunded VAT",
                  tip: isRu
                    ? `Возврат НДС за авто €${formatEURWithCents(carsWithPrices.length ? vatRefundTotal / carsWithPrices.length : 0)} × ${carsWithPrices.length} = €${formatEURWithCents(vatRefundTotal)}`
                    : `VAT refund per car €${formatEURWithCents(carsWithPrices.length ? vatRefundTotal / carsWithPrices.length : 0)} × ${carsWithPrices.length} = €${formatEURWithCents(vatRefundTotal)}`,
                },
              ].map((item) => {
                const isOpen = openInfoKey === item.key;
                const content = (
                  <div>
                    <p className="font-semibold mb-1">
                      {isRu ? `Расчет: ${item.title}` : `${item.title} calculation`}
                    </p>
                    <p className="text-muted-foreground leading-snug">{item.tip}</p>
                  </div>
                );

                return (
                  <Tooltip key={item.key} delayDuration={150}>
                    <Popover open={isOpen} onOpenChange={(open) => setOpenInfoKey(open ? item.key : null)}>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`p-3 rounded-lg text-left w-full cursor-help transition-colors ${item.colorClasses}`}
                            onClick={() => setOpenInfoKey(isOpen ? null : item.key)}
                            aria-label={
                              isRu ? `${item.title}: детали расчета` : `${item.title} calculation details`
                            }
                          >
                            <p className={`text-[11px] uppercase tracking-wide mb-1 ${item.key === "scenario-company" ? "text-green-700 dark:text-green-400" : item.key === "scenario-savings" ? "text-primary" : "text-muted-foreground"}`}>
                              {item.title}
                            </p>
                            <p className={`text-xl font-bold ${item.key === "scenario-company" ? "text-green-700 dark:text-green-400" : item.key === "scenario-savings" ? "text-primary" : "text-foreground"}`}>
                              {item.value}
                            </p>
                            <p className={`text-[11px] ${item.key === "scenario-company" ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                              {item.note}
                            </p>
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[240px] text-xs hidden sm:block">
                        {content}
                      </TooltipContent>
                      <PopoverContent side="top" className="max-w-xs text-xs sm:hidden">
                        {content}
                      </PopoverContent>
                    </Popover>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
          
          {/* SECTION 1: EXECUTIVE SUMMARY */}
          <Card className="overflow-hidden border-2 border-primary/30">
            <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-4 text-primary-foreground">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium opacity-90 uppercase tracking-wider">
                    {isRu ? "ИТОГО ИМПОРТ" : "Total Import Cost"}
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
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    {isRu ? "Авто" : "Vehicles"}
                  </p>
                  <p className="text-base font-bold text-foreground">{carsWithPrices.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-background/80">
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    {isRu ? "Среднее/авто" : "Avg/Car"}
                  </p>
                  <p className="text-base font-bold text-foreground">€{formatEUR(avgFinalCost)}</p>
                </div>
                <div className="p-2 rounded-lg bg-background/80">
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    {isRu ? "Налоги" : "Taxes"}
                  </p>
                  <p className="text-base font-bold text-foreground">€{formatEUR(results.totalCustoms + results.totalVAT)}</p>
                </div>
              </div>

              {scenario === "company" && (
                <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {isRu ? "Компания" : "Company"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isRu ? "Возврат НДС" : "VAT refund"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        €{formatEUR(results.totalNetCostForCompany)}
                      </p>
                      <p className="text-[10px] text-green-600 dark:text-green-400">
                        {isRu ? "Экономия" : "Save"} €{formatEUR(results.totalVATRefund)}
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
                {isRu ? "Структура расходов" : "Cost Breakdown"}
              </h3>
            </div>
            
            <Card className="overflow-hidden">
              <div className="divide-y divide-border/50">
                {[
                  {
                    key: "breakdown-vehicles",
                    label: `${isRu ? "Авто" : "Vehicles"} (${carsWithPrices.length}×)`,
                    icon: <Car className="w-4 h-4 text-muted-foreground shrink-0" />,
                    value: `€${formatEUR(results.totalCarPrices)}`,
                    hint: isRu
                      ? `${carsWithPrices.length} авто × €${formatEURWithCents(avgCarPurchase)} = €${formatEURWithCents(results.totalCarPrices)}`
                      : `${carsWithPrices.length} cars × €${formatEURWithCents(avgCarPurchase)} avg = €${formatEURWithCents(results.totalCarPrices)}`,
                  },
                  {
                    key: "breakdown-freight",
                    label: `${isRu ? "Фрахт" : "Freight"} (${containerType})`,
                    icon: <Ship className="w-4 h-4 text-muted-foreground shrink-0" />,
                    value: `€${formatEUR(results.freightPerContainerEUR)}`,
                    sub: `$${formatNumber(containerInfo.freightUSD)}`,
                    hint: isRu
                      ? `$${formatNumber(containerInfo.freightUSD)} ÷ ${formatNumber(usdPerEurRate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USD/EUR = €${formatEURWithCents(results.freightPerContainerEUR)}`
                      : `$${formatNumber(containerInfo.freightUSD)} ÷ ${formatNumber(usdPerEurRate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USD/EUR = €${formatEURWithCents(results.freightPerContainerEUR)}`,
                  },
                ].map((item) => {
                  const isOpen = openInfoKey === item.key;
                  const content = (
                    <div>
                      <p className="font-semibold mb-1">
                        {isRu ? `Расчет: ${item.label}` : `${item.label} calculation`}
                      </p>
                      <p className="text-muted-foreground leading-snug">{item.hint}</p>
                    </div>
                  );

                  return (
                    <Tooltip key={item.key} delayDuration={150}>
                      <Popover open={isOpen} onOpenChange={(open) => setOpenInfoKey(open ? item.key : null)}>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <button
                            type="button"
                            className="p-3 flex items-center justify-between gap-2 w-full text-left cursor-help"
                            onClick={() => setOpenInfoKey(isOpen ? null : item.key)}
                            aria-label={
                              isRu ? `${item.label}: детали расчета` : `${item.label} calculation details`
                            }
                          >
                              <div className="flex items-center gap-2 min-w-0">
                                {item.icon}
                                <div className="min-w-0">
                                  <span className="text-sm block truncate">{item.label}</span>
                                  {item.sub && (
                                    <p className="text-[10px] text-muted-foreground">
                                      {item.sub}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="font-semibold shrink-0">{item.value}</span>
                            </button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] text-xs hidden sm:block">
                          {content}
                        </TooltipContent>
                        <PopoverContent side="top" className="max-w-xs text-xs sm:hidden">
                          {content}
                        </PopoverContent>
                      </Popover>
                    </Tooltip>
                  );
                })}

                {[
                  {
                    key: "breakdown-cif",
                    label: isRu ? "CIF стоимость" : "CIF Value",
                    highlight: true,
                    value: `€${formatEUR(results.totalCIF)}`,
                    tip: isRu
                      ? `Авто €${formatEURWithCents(results.totalCarPrices)} + Фрахт €${formatEURWithCents(results.freightPerContainerEUR)} = €${formatEURWithCents(results.totalCIF)}`
                      : `Vehicles €${formatEURWithCents(results.totalCarPrices)} + Freight €${formatEURWithCents(results.freightPerContainerEUR)} = €${formatEURWithCents(results.totalCIF)}`,
                  },
                  {
                    key: "breakdown-customs",
                    label: `${isRu ? "Пошлина" : "Customs"} ${customsDuty}%`,
                    icon: <Banknote className="w-4 h-4 text-muted-foreground shrink-0" />,
                    value: `€${formatEUR(results.totalCustoms)}`,
                    tip: isRu
                      ? `CIF €${formatEURWithCents(results.totalCIF)} × ${customsDuty}% = €${formatEURWithCents(results.totalCustoms)}`
                      : `CIF €${formatEURWithCents(results.totalCIF)} × ${customsDuty}% = €${formatEURWithCents(results.totalCustoms)}`,
                  },
                  {
                    key: "breakdown-vat",
                    label: `${isRu ? "НДС" : "VAT"} ${vat}%`,
                    icon: <Banknote className="w-4 h-4 text-muted-foreground shrink-0" />,
                    value: `€${formatEUR(results.totalVAT)}`,
                    tip: isRu
                      ? `(CIF €${formatEURWithCents(results.totalCIF)} + Пошлина €${formatEURWithCents(results.totalCustoms)}) × ${vat}% = €${formatEURWithCents(results.totalVAT)}`
                      : `(CIF €${formatEURWithCents(results.totalCIF)} + Customs €${formatEURWithCents(results.totalCustoms)}) × ${vat}% = €${formatEURWithCents(results.totalVAT)}`,
                  },
                ].map((item) => {
                  const isOpen = openInfoKey === item.key;
                  const content = (
                    <div>
                      <p className="font-semibold mb-1">
                        {isRu ? `Расчет: ${item.label}` : `${item.label} calculation`}
                      </p>
                      <p className="text-muted-foreground leading-snug">{item.tip}</p>
                    </div>
                  );

                  return (
                    <div key={item.key}>
                      <Tooltip delayDuration={150}>
                        <Popover open={isOpen} onOpenChange={(open) => setOpenInfoKey(open ? item.key : null)}>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={`p-3 flex items-center justify-between gap-2 w-full text-left ${item.highlight ? "bg-muted/30 font-medium" : ""}`}
                                onClick={() => setOpenInfoKey(isOpen ? null : item.key)}
                                aria-label={
                                  isRu ? `${item.label}: детали расчета` : `${item.label} calculation details`
                                }
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {item.icon}
                                  <span className={`text-sm truncate ${item.highlight ? "font-medium" : ""}`}>{item.label}</span>
                                </div>
                                <span className={`${item.highlight ? "font-bold text-primary" : "font-semibold"} shrink-0`}>
                                  {item.value}
                                </span>
                              </button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs hidden sm:block">
                            {content}
                          </TooltipContent>
                          <PopoverContent side="top" className="max-w-xs text-xs sm:hidden">
                            {content}
                          </PopoverContent>
                        </Popover>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>

              {/* Services Section */}
              <div className="border-t border-dashed border-border">
                <div className="p-2 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {isRu ? "Сервисы и сборы" : "Services & Fees"}
                </div>
                <div className="grid grid-cols-2 gap-px bg-border/30">
                  {([
                    {
                      key: "service-port",
                      label: isRu ? "Порт и агент" : "Port & Agent",
                      perCar: results.portAgentFeePerCar,
                      total: totalPortAgent,
                    },
                    {
                      key: "service-speditor",
                      label: isRu ? "Экспедитор" : "Speditor",
                      perCar: results.speditorFee,
                      total: totalSpeditor,
                    },
                    {
                      key: "service-translation",
                      label: isRu ? "Перевод" : "Translation",
                      perCar: results.translationPerCar,
                      total: totalTranslation,
                    },
                    {
                      key: "service-homologation",
                      label: isRu ? "Гомологация" : "Homologation",
                      perCar: perCarHomologation,
                      total: totalHomologation,
                    },
                    results.carResults[0]?.miscellaneous > 0
                      ? ({
                          key: "service-misc",
                          label: isRu ? "Прочее" : "Miscellaneous",
                          perCar: perCarMisc,
                          total: totalMisc,
                          fullRow: true,
                        } as const)
                      : null,
                  ] as const)
                    .filter(
                      (item): item is {
                        key: string;
                        label: string;
                        perCar: number;
                        total: number;
                        fullRow?: boolean;
                      } => Boolean(item),
                    )
                    .map((service) => {
                    const isOpen = openInfoKey === service.key;
                    const content = (
                      <div>
                        <p className="font-semibold mb-1">
                          {isRu ? `${service.label}: расчет` : `${service.label} calculation`}
                        </p>
                        <p className="text-muted-foreground leading-snug">
                          {isRu
                            ? `€${formatEURWithCents(service.perCar)} × ${numberOfCars} авто = €${formatEURWithCents(service.total)}`
                            : `€${formatEURWithCents(service.perCar)} × ${numberOfCars} cars = €${formatEURWithCents(service.total)}`}
                        </p>
                      </div>
                    );

                    return (
                      <Tooltip key={service.key} delayDuration={150}>
                        <Popover open={isOpen} onOpenChange={(open) => setOpenInfoKey(open ? service.key : null)}>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={`p-2 bg-background flex justify-between items-center text-xs cursor-help w-full text-left ${service.fullRow ? "col-span-2" : ""}`}
                                onClick={() => setOpenInfoKey(isOpen ? null : service.key)}
                                aria-label={
                                  isRu
                                    ? `${service.label}: детали расчета`
                                    : `${service.label} calculation details`
                                }
                              >
                                <span className="text-muted-foreground truncate">{service.label}</span>
                                <span className="shrink-0 ml-1">€{formatEUR(service.total)}</span>
                              </button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-xs hidden sm:block">
                            {content}
                          </TooltipContent>
                          <PopoverContent side="top" className="max-w-xs text-xs sm:hidden">
                            {content}
                          </PopoverContent>
                        </Popover>
                      </Tooltip>
                    );
                  })}
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
                          aria-label={isRu ? "Расходы в ЧГ: детали" : "MNE expenses calculation details"}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Info className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {isRu ? "Расходы в ЧГ" : "MNE expenses"}
                            </span>
                          </div>
                          <span className="font-bold text-primary shrink-0">€{formatEUR(mneExpenses)}</span>
                        </button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs hidden sm:block">
                      <p className="font-semibold mb-1">
                        {isRu ? "Расчет расходов в ЧГ" : "MNE expenses calculation"}
                      </p>
                      <p className="text-muted-foreground leading-snug">
                        {isRu
                          ? `Итого €${formatEURWithCents(results.totalFinalCost)} − Авто €${formatEURWithCents(results.totalCarPrices)} = €${formatEURWithCents(mneExpenses)}`
                          : `Total €${formatEURWithCents(results.totalFinalCost)} − Vehicles €${formatEURWithCents(results.totalCarPrices)} = €${formatEURWithCents(mneExpenses)}`}
                      </p>
                    </TooltipContent>
                    <PopoverContent side="top" className="max-w-xs text-xs sm:hidden">
                      <p className="font-semibold mb-1">
                        {isRu ? "Расчет расходов в ЧГ" : "MNE expenses calculation"}
                      </p>
                      <p className="text-muted-foreground leading-snug">
                        {isRu
                          ? `Итого €${formatEURWithCents(results.totalFinalCost)} − Авто €${formatEURWithCents(results.totalCarPrices)} = €${formatEURWithCents(mneExpenses)}`
                          : `Total €${formatEURWithCents(results.totalFinalCost)} − Vehicles €${formatEURWithCents(results.totalCarPrices)} = €${formatEURWithCents(mneExpenses)}`}
                      </p>
                    </PopoverContent>
                  </Popover>
                </Tooltip>
              </div>

              {/* Grand Total */}
              <div className="p-3 bg-primary/10 border-t-2 border-primary/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold text-base">{isRu ? "ИТОГО" : "TOTAL"}</span>
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
                {isRu ? "По каждому авто" : "Per Vehicle"}
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
                        <p className="font-semibold text-sm text-foreground">
                          {isRu ? `Авто №${car.carIndex}` : `Car #${car.carIndex}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {isRu ? "Покупка" : "Purchase"}: €{formatEUR(car.carPrice)}
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
                          label: isRu ? "Фрахт" : "Freight",
                          value: car.freightPerCar,
                          tip: isRu
                            ? `($${formatNumber(containerInfo.freightUSD)} ÷ ${formatNumber(usdPerEurRate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USD/EUR) ÷ ${carsCount} авто = €${formatEURWithCents(car.freightPerCar)}`
                            : `($${formatNumber(containerInfo.freightUSD)} ÷ ${formatNumber(usdPerEurRate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USD/EUR) ÷ ${carsCount} cars = €${formatEURWithCents(car.freightPerCar)}`,
                        },
                        {
                          key: "customs",
                          label: isRu ? "Пошлина" : "Customs",
                          value: car.customs,
                          tip: isRu
                            ? `CIF €${formatEURWithCents(car.cif)} × ${customsDuty}% = €${formatEURWithCents(car.customs)}`
                            : `CIF €${formatEURWithCents(car.cif)} × ${customsDuty}% duty = €${formatEURWithCents(car.customs)}`,
                        },
                        {
                          key: "vat",
                          label: isRu ? "НДС" : "VAT",
                          value: car.vatAmount,
                          tip: isRu
                            ? `(CIF €${formatEURWithCents(car.cif)} + Пошлина €${formatEURWithCents(car.customs)}) × ${vat}% НДС = €${formatEURWithCents(car.vatAmount)}`
                            : `(CIF €${formatEURWithCents(car.cif)} + Customs €${formatEURWithCents(car.customs)}) × ${vat}% VAT = €${formatEURWithCents(car.vatAmount)}`,
                        },
                        {
                          key: "services",
                          label: isRu ? "Сервисы" : "Services",
                          value: car.portAgentFeePerCar + car.translationPerCar + car.speditorFee,
                          tip: isRu
                            ? `Порт и агент €${formatEURWithCents(car.portAgentFeePerCar)} + Перевод €${formatEURWithCents(car.translationPerCar)} + Экспедитор €${formatEURWithCents(car.speditorFee)}`
                            : `Port & agent €${formatEURWithCents(car.portAgentFeePerCar)} + Translation €${formatEURWithCents(car.translationPerCar)} + Speditor €${formatEURWithCents(car.speditorFee)}`,
                        },
                        {
                          key: "homologation",
                          label: isRu ? "Гомол." : "Homolog.",
                          value: car.homologationFee,
                          tip: isRu
                            ? `Гомологация за авто: €${formatEURWithCents(car.homologationFee)}`
                            : `Homologation fee per car: €${formatEURWithCents(car.homologationFee)}`,
                        },
                        {
                          key: "misc",
                          label: isRu ? "Прочее" : "Misc",
                          value: car.miscellaneous,
                          tip: isRu
                            ? `Дополнительные расходы: €${formatEURWithCents(car.miscellaneous)}`
                            : `Additional per-car costs you entered: €${formatEURWithCents(car.miscellaneous)}`,
                        },
                      ].map((item) => {
                        const infoKey = `${car.carIndex}-${item.key}`;
                        const isOpen = openInfoKey === infoKey;
                        const explanation = (
                          <div>
                            <p className="font-semibold mb-1">
                              {isRu ? `Расчет: ${item.label}` : `${item.label} calculation`}
                            </p>
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
                                    aria-label={
                                      isRu
                                        ? `${item.label}: детали расчета`
                                        : `${item.label} calculation details`
                                    }
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
                          {isRu ? "Возврат НДС" : "VAT Refund"}: €{formatEUR(car.vatRefund)}
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {isRu ? "Итог" : "Net"}: €{formatEUR(car.netCostForCompany)}
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
                {isRu ? "Параметры" : "Parameters"}
              </h3>
            </div>
            
            <Card className="p-3 bg-muted/20 border-border/50">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="text-[10px] text-muted-foreground">
                    {isRu ? "Контейнер" : "Container"}
                  </p>
                  <p className="font-semibold">{containerType}</p>
                </div>
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="text-[10px] text-muted-foreground">
                    {isRu ? "Пошлина" : "Customs"}
                  </p>
                  <p className="font-semibold">{customsDuty}%</p>
                </div>
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="text-[10px] text-muted-foreground">
                    {isRu ? "НДС" : "VAT"}
                  </p>
                  <p className="font-semibold">{vat}%</p>
                </div>
                <div className="p-1.5 bg-background/60 rounded">
                  <p className="text-[10px] text-muted-foreground">
                    {isRu ? "Тип" : "Type"}
                  </p>
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
            {isRu ? "Изменить" : "Edit"}
          </Button>
          <Button 
            onClick={handleExportPDF}
            className="flex-1 h-11 gap-2 bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4" />
            {isRu ? "Скачать PDF" : "Export PDF"}
          </Button>
        </div>
      </BottomSheetFooter>
    </BottomSheet>
  );
};
