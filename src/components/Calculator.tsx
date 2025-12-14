import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import {
  Ship,
  Calculator as CalcIcon,
  X,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "./ThemeToggle";
import { useCarImportCalculations } from "@/hooks/useCarImportCalculations";
import { useCalculatorPersistence } from "@/hooks/useCalculatorPersistence";
import { CurrencyRatesSection } from "./calculator/CurrencyRatesSection";
import { VehicleDetailsSection } from "./calculator/VehicleDetailsSection";
import { CarPricesSection } from "./calculator/CarPricesSection";
import { ResultsBottomSheet } from "./calculator/ResultsBottomSheet";
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
import type { Language } from "@/types/language";
import { FX_VALID_RANGES } from "@/utils/currency";
import {
  CONTAINER_CONFIGS,
  COST_CONFIG,
  SPEDITOR_GROSS_FEE,
} from "@/config/costs";
import {
  Action,
  CalculatorState,
  LANGUAGE_STORAGE_KEY,
  PERSIST_KEY,
  calculatorReducer,
  type InitialState,
  readInitialState,
  resolveInitialLanguage,
} from "./calculator/state";
import { calculatorCopy } from "./calculator/i18n";
import { useExchangeRates } from "./calculator/useExchangeRates";
import { useCalculatorDispatchers } from "./calculator/useCalculatorDispatchers";

const SPEDITOR_VAT_RATE = COST_CONFIG.speditor.vatRate;
const SPEDITOR_FEE = SPEDITOR_GROSS_FEE;

const Calculator = () => {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>(resolveInitialLanguage);
  const initialStateRef = useRef<InitialState | null>(null);
  if (!initialStateRef.current) {
    initialStateRef.current = readInitialState();
  }
  const initialState = initialStateRef.current;

  const hasMountedRef = useRef(false);
  const [isResultsOpenState, setIsResultsOpenState] = useState(false);
  const isResultsOpenRef = useRef(false);

  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const {
    carPrices,
    krwPerUsdRate,
    usdPerEurRate,
    autoUpdateFX,
    customsDuty,
    vat,
    translationPages,
    homologationFee,
    miscellaneous,
    scenario,
    numberOfCars,
    containerType,
    lastValidRates,
    lastUpdatedAt,
  } = state;
  const t = calculatorCopy[language];
  const controlButtonClasses =
    "h-10 w-10 rounded-lg border border-border/60 bg-background/70 hover:border-primary/60 hover:bg-primary/10 active:scale-95 transition-colors transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
  // Other costs and toggles handled in reducer above
  const [isRatesSheetOpen, setIsRatesSheetOpen] = useState(false);
  const ratesSheetTouchStart = useRef<number | null>(null);

  const setIsResultsOpen = useCallback((open: boolean) => {
    isResultsOpenRef.current = open;
    setIsResultsOpenState(open);
  }, []);
  const isResultsOpen = isResultsOpenState;
  const markFormChanged = useCallback(() => {
    if (isResultsOpenRef.current) {
      setIsResultsOpen(false);
    }
  }, [setIsResultsOpen]);

  const dispatchTracked = useCallback(
    (action: Action, options?: { skipDirty?: boolean }) => {
      if (!options?.skipDirty) {
        markFormChanged();
      }
      dispatch(action);
    },
    [dispatch, markFormChanged]
  );

  const {
    setCarPrices,
    setKrwPerUsdRate,
    setUsdPerEurRate,
    setCustomsDuty,
    setVat,
    setTranslationPages,
    setHomologationFee,
    setMiscellaneous,
    setScenario,
    setNumberOfCars,
    setContainerType,
    setAutoUpdateFX,
  } = useCalculatorDispatchers({ state, initialState, dispatchTracked });

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn("Failed to persist language", error);
    }
  }, [language]);

  // Persist state to localStorage and URL
  useCalculatorPersistence({
    persistKey: PERSIST_KEY,
    hasMountedRef,
    state: {
      carPrices,
      krwPerUsdRate,
      usdPerEurRate,
      customsDuty,
      vat,
      translationPages,
      homologationFee,
      miscellaneous,
      scenario,
      numberOfCars,
      containerType,
      autoUpdateFX,
    },
  });

  const setLastValidRatesState = useCallback(
    (value: CalculatorState["lastValidRates"]) => {
      dispatch({ type: "setLastValidRates", value });
    },
    [dispatch]
  );

  const setLastUpdatedAtState = useCallback(
    (value: number | null) => {
      dispatch({ type: "setLastUpdatedAt", value });
    },
    [dispatch]
  );

  const applyRates = useCallback(
    (krwRate: number, usdRate: number) => {
      dispatchTracked(
        {
          type: "setRates",
          krwPerUsdRate: krwRate,
          usdPerEurRate: usdRate,
        },
        { skipDirty: true }
      );
    },
    [dispatchTracked]
  );

  const {
    fxSource: fxSourceState,
    setFxSource,
    fxUpdateSourceRef,
    handleFetchRates,
    isLoadingRates,
  } = useExchangeRates({
    autoUpdateFX,
    lastValidRates,
    language,
    copy: {
      ratesFallbackDescription: t.ratesFallbackDescription,
      ratesFallbackTitle: t.ratesFallbackTitle,
      ratesUpdatedDescription: t.ratesUpdatedDescription,
      ratesUpdatedTitle: t.ratesUpdatedTitle,
    },
    applyRates,
    setLastValidRates: setLastValidRatesState,
    setLastUpdatedAt: setLastUpdatedAtState,
    toast,
  });
  const fxSource = fxSourceState;

  const usdToEurRate = usdPerEurRate > 0 ? 1 / usdPerEurRate : 0;

  // Calculate all results using custom hook
  const results = useCarImportCalculations({
    carPrices,
    usdToEurRate,
    customsDuty,
    vat,
    translationPages,
    homologationFee,
    miscellaneous,
    scenario,
    numberOfCars,
    containerType,
    speditorFee: SPEDITOR_FEE,
    speditorVatRate: SPEDITOR_VAT_RATE,
  });

  // Track last valid rates from manual edits within acceptable ranges
  useEffect(() => {
    if (!hasMountedRef.current) return;
    const krwValid =
      krwPerUsdRate >= FX_VALID_RANGES.krwPerUsd.min &&
      krwPerUsdRate <= FX_VALID_RANGES.krwPerUsd.max;
    const usdValid =
      usdPerEurRate >= FX_VALID_RANGES.usdPerEur.min &&
      usdPerEurRate <= FX_VALID_RANGES.usdPerEur.max;

    if (krwValid && usdValid) {
      const source = fxUpdateSourceRef.current;
      if (source !== "none") {
        setFxSource(
          source === "fallback"
            ? "fallback"
            : source === "live"
            ? "live"
            : "restored"
        );
        fxUpdateSourceRef.current = "none";
      } else {
        setFxSource("manual");
      }

      setLastValidRatesState({
        krwPerUsd: krwPerUsdRate,
        usdPerEur: usdPerEurRate,
      });
    }
  }, [fxUpdateSourceRef, krwPerUsdRate, setLastValidRatesState, setFxSource, usdPerEurRate]);

  // Check if all car prices are filled
  const completedCars = carPrices.filter((p) => p > 0).length;
  const allPricesFilled = completedCars === numberOfCars;

  // Handle calculate button click
  const handleCalculate = () => {
    setIsResultsOpen(true);
  };

  // Handle recalculate (close modal to edit)
  const handleRecalculate = () => {
    setIsResultsOpen(false);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Compact Header */}
          <header className="animate-fade-in mb-4">
            {/* Top row: Logo + Title + Actions */}
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
                      {language === "en" ? "Switch to Russian" : "Переключить на английский"}
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

            {/* Rates bar - inline compact */}
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

          {/* Input Form - Single column layout */}
          <div className="space-y-5">
            <VehicleDetailsSection
              language={language}
              scenario={scenario}
              setScenario={setScenario}
              numberOfCars={numberOfCars}
              setNumberOfCars={setNumberOfCars}
              containerType={containerType}
              setContainerType={setContainerType}
              freightPerCar={results.freightPerCar}
              freightPerContainerEUR={results.freightPerContainerEUR}
              customsDuty={customsDuty}
              setCustomsDuty={setCustomsDuty}
              vat={vat}
              setVat={setVat}
              speditorFee={results.speditorFee}
              homologationFee={homologationFee}
              setHomologationFee={setHomologationFee}
              translationPages={translationPages}
              setTranslationPages={setTranslationPages}
              translationPerCar={results.translationPerCar}
              portAgentFeePerCar={results.portAgentFeePerCar}
              miscellaneous={miscellaneous}
              setMiscellaneous={setMiscellaneous}
            />

            <CarPricesSection
              language={language}
              numberOfCars={numberOfCars}
              carPrices={carPrices}
              setCarPrices={setCarPrices}
              krwPerUsdRate={krwPerUsdRate}
              usdPerEurRate={usdPerEurRate}
              results={results}
            />

            {/* Calculate Button */}
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

      {/* Results Bottom Sheet */}
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
              onRevertToLastValid={() => {
                if (lastValidRates) {
                  fxUpdateSourceRef.current = "restored";
                  setKrwPerUsdRate(lastValidRates.krwPerUsd);
                  setUsdPerEurRate(lastValidRates.usdPerEur);
                }
              }}
            />
          </div>
        </BottomSheetBody>
      </BottomSheet>

    </div>
  );
};

export default Calculator;
