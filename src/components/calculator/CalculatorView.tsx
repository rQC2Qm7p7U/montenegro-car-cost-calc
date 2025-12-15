import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  Calculator as CalcIcon,
  RefreshCcw,
  Ship,
  X,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { useCalculatorContext } from "./CalculatorContext";
import { CurrencyRatesSection } from "./CurrencyRatesSection";
import { VehicleDetailsSection } from "./VehicleDetailsSection";
import { CarPricesSection } from "./CarPricesSection";
import { ResultsBottomSheet } from "./ResultsBottomSheet";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetHeader,
} from "@/components/ui/bottom-sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CalculatorView = () => {
  const {
    language,
    setLanguage,
    t,
    state,
    results,
    fxSource,
    isLoadingRates,
    handleFetchRates,
    fxUpdateSourceRef,
    setKrwPerUsdRate,
    setUsdPerEurRate,
    setAutoUpdateFX,
    lastValidRates,
    lastUpdatedAt,
    allPricesFilled,
    completedCars,
    handleCalculate,
    handleRecalculate,
    isResultsOpen,
    setIsResultsOpen,
    setScenario,
  } = useCalculatorContext();
  const {
    carPrices,
    krwPerUsdRate,
    usdPerEurRate,
    autoUpdateFX,
    customsDuty,
    vat,
    containerType,
    numberOfCars,
    scenario,
  } = state;

  const [isRatesSheetOpen, setIsRatesSheetOpen] = useState(false);
  const ratesSheetTouchStart = useRef<number | null>(null);

  const controlButtonClasses =
    "h-10 w-10 rounded-lg border border-border/60 bg-background/70 hover:border-primary/60 hover:bg-primary/10 active:scale-95 transition-colors transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  const handleRatesTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    ratesSheetTouchStart.current = e.touches[0]?.clientX ?? null;
  };

  const handleRatesTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (ratesSheetTouchStart.current === null) return;
    const deltaX =
      (e.changedTouches[0]?.clientX ?? 0) - ratesSheetTouchStart.current;
    if (deltaX < -40) setIsRatesSheetOpen(false);
    ratesSheetTouchStart.current = null;
  };

  const handleRevertRates = useCallback(() => {
    if (!lastValidRates) return;
    fxUpdateSourceRef.current = "restored";
    setKrwPerUsdRate(lastValidRates.krwPerUsd);
    setUsdPerEurRate(lastValidRates.usdPerEur);
  }, [fxUpdateSourceRef, lastValidRates, setKrwPerUsdRate, setUsdPerEurRate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <header className="animate-fade-in mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                <Ship className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground leading-tight break-words">
                  {t.title}
                </h1>
                <p className="text-xs text-muted-foreground">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`${controlButtonClasses} text-xs font-semibold`}
                        onClick={() =>
                          setLanguage((prev) => (prev === "en" ? "ru" : "en"))
                        }
                        aria-label="Toggle language RU/EN"
                      >
                        {language === "en" ? "RU" : "EN"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {language === "en"
                        ? "Switch to Russian"
                        : "Переключить на английский"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ThemeToggle className={controlButtonClasses} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {language === "en" ? "Toggle theme" : "Сменить тему"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRatesSheetOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">$1</span>
                  <span className="font-medium text-foreground">
                    = ₩
                    {new Intl.NumberFormat("ru-RU")
                      .format(Math.round(krwPerUsdRate))
                      .replace(/\u00A0/g, " ")}
                  </span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">€1</span>
                  <span className="font-medium text-foreground">
                    = $
                    {usdPerEurRate
                      .toLocaleString("ru-RU", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })
                      .replace(/\u00A0/g, " ")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {fxSource === "fallback" && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <RefreshCcw
                  className={`w-3.5 h-3.5 ${
                    isLoadingRates ? "animate-spin" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFetchRates();
                  }}
                />
              </div>
            </button>
          </header>

          <div className="space-y-5">
            <VehicleDetailsSection />
            <CarPricesSection />

            <Button
              onClick={handleCalculate}
              disabled={!allPricesFilled}
              className="
                w-full h-14 mt-2 rounded-xl
                shadow-lg shadow-primary/20
                bg-gradient-to-r from-primary to-primary/80
                hover:from-primary/90 hover:to-primary/70
                hover:shadow-primary/30 hover:shadow-xl
                active:scale-[0.98]
                transition-all duration-200 ease-out
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-3
                text-primary-foreground font-semibold text-base
              "
            >
              <CalcIcon className="w-5 h-5" />
              <span>
                {allPricesFilled
                  ? t.calculateReady
                  : t.calculateMissing(numberOfCars - completedCars)}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <ResultsBottomSheet
        language={language}
        open={isResultsOpen}
        onOpenChange={setIsResultsOpen}
        results={results}
        numberOfCars={numberOfCars}
        scenario={scenario}
        customsDuty={customsDuty}
        vat={vat}
        krwPerUsdRate={krwPerUsdRate}
        usdPerEurRate={usdPerEurRate}
        containerType={containerType}
        onRecalculate={handleRecalculate}
        onScenarioChange={setScenario}
      />

      <BottomSheet
        open={isRatesSheetOpen}
        onOpenChange={setIsRatesSheetOpen}
        ariaTitle={language === "ru" ? "Настройки курсов" : "Exchange rate settings"}
        ariaDescription={
          language === "ru"
            ? "Обновление и ввод курсов валют для расчета"
            : "Update or enter exchange rates for the calculation"
        }
      >
        <BottomSheetHeader className="flex items-center justify-between pb-3">
          <div>
            <p className="text-xs text-muted-foreground">{t.ratesSheetTitle}</p>
            <h3 className="text-lg font-semibold text-foreground">
              {t.ratesSheetSubtitle}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRatesSheetOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </BottomSheetHeader>
        <BottomSheetBody className="pt-2">
          <div
            onTouchStart={handleRatesTouchStart}
            onTouchEnd={handleRatesTouchEnd}
          >
            <CurrencyRatesSection
              language={language}
              autoUpdateFX={autoUpdateFX}
              setAutoUpdateFX={setAutoUpdateFX}
              isLoadingRates={isLoadingRates}
              onRefreshRates={handleFetchRates}
              krwPerUsdRate={krwPerUsdRate}
              setKrwPerUsdRate={setKrwPerUsdRate}
              usdPerEurRate={usdPerEurRate}
              setUsdPerEurRate={setUsdPerEurRate}
              lastUpdatedAt={lastUpdatedAt}
              lastValidRates={lastValidRates}
              onRevertToLastValid={handleRevertRates}
            />
          </div>
        </BottomSheetBody>
      </BottomSheet>
    </div>
  );
};
