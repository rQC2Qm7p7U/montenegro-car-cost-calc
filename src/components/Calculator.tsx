import { useState, useEffect, useRef, useCallback } from "react";
import { Ship, Calculator as CalcIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "./ThemeToggle";
import { fetchExchangeRates, FX_VALID_RANGES } from "@/utils/currency";
import { useCarImportCalculations } from "@/hooks/useCarImportCalculations";
import { CurrencyRatesSection } from "./calculator/CurrencyRatesSection";
import { VehicleDetailsSection } from "./calculator/VehicleDetailsSection";
import { CarPricesSection } from "./calculator/CarPricesSection";
import { ResultsBottomSheet } from "./calculator/ResultsBottomSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PERSIST_KEY = "car-import-state-v1";
const FX_LAST_SUCCESS_KEY = "car-import-last-fx-v1";
const FX_REFRESH_MS = 10 * 60 * 1000; // 10 minutes

const DEFAULTS = {
  customsDuty: 5,
  vat: 21,
  translationPages: 3,
  homologationFee: 250,
  miscellaneous: 0,
};

const Calculator = () => {
  const { toast } = useToast();
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const formChangeRef = useRef(false);
  const isHydratedRef = useRef(false);
  const initialRatesFetchedRef = useRef(false);

  // Car prices (array of EUR values)
  const [carPrices, setCarPrices] = useState<number[]>([0]);

  // Currency rates
  const [krwToEurRate, setKrwToEurRate] = useState<number>(0.00068);
  const [usdToEurRate, setUsdToEurRate] = useState<number>(0.93);
  const [autoUpdateFX, setAutoUpdateFX] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [lastValidRates, setLastValidRates] = useState<{ krwToEur: number; usdToEur: number } | null>(null);

  // Other costs
  const [customsDuty, setCustomsDuty] = useState<number>(DEFAULTS.customsDuty);
  const [vat, setVat] = useState<number>(DEFAULTS.vat);
  const [translationPages, setTranslationPages] = useState<number>(DEFAULTS.translationPages);
  const [homologationFee, setHomologationFee] = useState<number>(DEFAULTS.homologationFee);
  const [miscellaneous, setMiscellaneous] = useState<number>(DEFAULTS.miscellaneous);

  // Other settings
  const [scenario, setScenario] = useState<"physical" | "company">("physical");
  const [numberOfCars, setNumberOfCars] = useState<number>(1);
  const [containerType, setContainerType] = useState<"20ft" | "40ft">("40ft");

  // Hydrate state from URL/localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const storedRaw = localStorage.getItem(PERSIST_KEY);
      const stored = storedRaw ? JSON.parse(storedRaw) : {};
      const storedFX = localStorage.getItem(FX_LAST_SUCCESS_KEY);
      const lastFx = storedFX ? JSON.parse(storedFX) : null;

      const parseNumber = (value: unknown, fallback: number) => {
        if (value === null || value === undefined || value === "") return fallback;
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
      };

      const parseBool = (value: unknown, fallback: boolean) => {
        if (value === "true" || value === true) return true;
        if (value === "false" || value === false) return false;
        return fallback;
      };

      const parseArray = (value: unknown) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") return value.split(",");
        return [];
      };

      const urlState = {
        carPrices: params.get("carPrices"),
        krwToEurRate: params.get("krwToEurRate"),
        usdToEurRate: params.get("usdToEurRate"),
        customsDuty: params.get("customsDuty"),
        vat: params.get("vat"),
        translationPages: params.get("translationPages"),
        homologationFee: params.get("homologationFee"),
        miscellaneous: params.get("miscellaneous"),
        scenario: params.get("scenario"),
        numberOfCars: params.get("numberOfCars"),
        containerType: params.get("containerType"),
        autoUpdateFX: params.get("autoUpdateFX"),
      };

      const merged = { ...stored, ...urlState };

      const resolvedNumberOfCars = Math.min(
        4,
        Math.max(1, parseNumber(merged.numberOfCars, numberOfCars)),
      );

      const resolvedContainer =
        merged.containerType === "20ft" || merged.containerType === "40ft"
          ? merged.containerType
          : containerType;

      const parsedCarPrices = parseArray(
        merged.carPrices ?? merged.carPrices === 0 ? merged.carPrices : undefined,
      )
        .map((price) => parseNumber(price, 0))
        .slice(0, resolvedNumberOfCars);

      if (parsedCarPrices.length > 0) {
        setCarPrices((prev) => {
          const next = [...prev];
          parsedCarPrices.forEach((price, index) => {
            next[index] = price;
          });
          return next.slice(0, resolvedNumberOfCars);
        });
      }

      setKrwToEurRate(parseNumber(merged.krwToEurRate, krwToEurRate));
      setUsdToEurRate(parseNumber(merged.usdToEurRate, usdToEurRate));
      setCustomsDuty(parseNumber(merged.customsDuty, DEFAULTS.customsDuty));
      setVat(parseNumber(merged.vat, DEFAULTS.vat));
      setTranslationPages(
        Math.max(0, parseNumber(merged.translationPages, DEFAULTS.translationPages)),
      );
      setHomologationFee(
        Math.max(0, parseNumber(merged.homologationFee, DEFAULTS.homologationFee)),
      );
      setMiscellaneous(Math.max(0, parseNumber(merged.miscellaneous, DEFAULTS.miscellaneous)));

      if (merged.scenario === "physical" || merged.scenario === "company") {
        setScenario(merged.scenario);
      }

      setNumberOfCars(resolvedNumberOfCars);
      setContainerType(resolvedContainer);
      setAutoUpdateFX(parseBool(merged.autoUpdateFX, autoUpdateFX));

      if (lastFx && Number.isFinite(lastFx.krwToEur) && Number.isFinite(lastFx.usdToEur)) {
        setLastValidRates({ krwToEur: lastFx.krwToEur, usdToEur: lastFx.usdToEur });
        setLastUpdatedAt(Number.isFinite(lastFx.fetchedAt) ? lastFx.fetchedAt : Date.now());
      }

      isHydratedRef.current = true;
      formChangeRef.current = false;
    } catch (error) {
      console.warn("Failed to hydrate calculator state", error);
      isHydratedRef.current = true;
    }
    // We only want to hydrate once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close modal when any input changes
  useEffect(() => {
    if (formChangeRef.current && isResultsOpen) {
      setIsResultsOpen(false);
    }
    formChangeRef.current = true;
  }, [carPrices, krwToEurRate, usdToEurRate, customsDuty, vat, translationPages, homologationFee, miscellaneous, scenario, numberOfCars, containerType, isResultsOpen]);

  // Update carPrices array when numberOfCars changes
  useEffect(() => {
    setCarPrices((prev) => {
      if (prev.length < numberOfCars) {
        return [...prev, ...Array(numberOfCars - prev.length).fill(0)];
      } else if (prev.length > numberOfCars) {
        return prev.slice(0, numberOfCars);
      }
      return prev;
    });
  }, [numberOfCars]);

  // Persist state to localStorage and URL
  useEffect(() => {
    if (!isHydratedRef.current) return;

    const payload = {
      carPrices,
      krwToEurRate,
      usdToEurRate,
      customsDuty,
      vat,
      translationPages,
      homologationFee,
      miscellaneous,
      scenario,
      numberOfCars,
      containerType,
      autoUpdateFX,
    };

    localStorage.setItem(PERSIST_KEY, JSON.stringify(payload));

    const params = new URLSearchParams(window.location.search);
    params.set("carPrices", carPrices.join(","));
    params.set("krwToEurRate", String(krwToEurRate));
    params.set("usdToEurRate", String(usdToEurRate));
    params.set("customsDuty", String(customsDuty));
    params.set("vat", String(vat));
    params.set("translationPages", String(translationPages));
    params.set("homologationFee", String(homologationFee));
    params.set("miscellaneous", String(miscellaneous));
    params.set("scenario", scenario);
    params.set("numberOfCars", String(numberOfCars));
    params.set("containerType", containerType);
    params.set("autoUpdateFX", String(autoUpdateFX));

    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [
    autoUpdateFX,
    carPrices,
    containerType,
    customsDuty,
    homologationFee,
    krwToEurRate,
    miscellaneous,
    numberOfCars,
    scenario,
    translationPages,
    usdToEurRate,
    vat,
  ]);

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
  });

  // Fetch exchange rates
  const handleFetchRates = useCallback(async () => {
    setIsLoadingRates(true);
    const rates = await fetchExchangeRates();
    setKrwToEurRate(rates.krwToEur);
    setUsdToEurRate(rates.usdToEur);
    if (!rates.isFallback) {
      setLastValidRates({ krwToEur: rates.krwToEur, usdToEur: rates.usdToEur });
      setLastUpdatedAt(rates.fetchedAt || Date.now());
      localStorage.setItem(
        FX_LAST_SUCCESS_KEY,
        JSON.stringify({
          krwToEur: rates.krwToEur,
          usdToEur: rates.usdToEur,
          fetchedAt: rates.fetchedAt || Date.now(),
        }),
      );
    }

    toast({
      title: rates.isFallback ? "Using fallback rates" : "Rates updated",
      description: rates.isFallback
        ? "Live rates were unavailable or invalid; using safe defaults."
        : `1 EUR = ${(1 / rates.krwToEur).toFixed(2)} KRW | 1 USD = ${rates.usdToEur.toFixed(4)} EUR`,
      variant: rates.isFallback ? "destructive" : "default",
    });
    setIsLoadingRates(false);
  }, [toast]);

  // Fetch latest exchange rates on initial load
  useEffect(() => {
    if (initialRatesFetchedRef.current) return;
    initialRatesFetchedRef.current = true;
    handleFetchRates();
  }, [handleFetchRates]);

  // Auto-update exchange rates when toggle is enabled
  useEffect(() => {
    if (autoUpdateFX) {
      handleFetchRates();
    }
  }, [autoUpdateFX, handleFetchRates]);

  // Auto-refresh rates on an interval when enabled
  useEffect(() => {
    if (!autoUpdateFX) return;
    const id = setInterval(() => {
      handleFetchRates();
    }, FX_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoUpdateFX, handleFetchRates]);

  // Track last valid rates from manual edits within acceptable ranges
  useEffect(() => {
    if (!isHydratedRef.current) return;
    const krwValid =
      krwToEurRate >= FX_VALID_RANGES.krwToEur.min &&
      krwToEurRate <= FX_VALID_RANGES.krwToEur.max;
    const usdValid =
      usdToEurRate >= FX_VALID_RANGES.usdToEur.min &&
      usdToEurRate <= FX_VALID_RANGES.usdToEur.max;

    if (krwValid && usdValid) {
      setLastValidRates({ krwToEur: krwToEurRate, usdToEur: usdToEurRate });
      const now = Date.now();
      setLastUpdatedAt(now);
      localStorage.setItem(
        FX_LAST_SUCCESS_KEY,
        JSON.stringify({ krwToEur: krwToEurRate, usdToEur: usdToEurRate, fetchedAt: now }),
      );
    }
  }, [krwToEurRate, usdToEurRate]);

  // Check if all car prices are filled
  const completedCars = carPrices.filter(p => p > 0).length;
  const allPricesFilled = completedCars === numberOfCars;
  const completionPercent = Math.round((completedCars / numberOfCars) * 100);

  // Handle calculate button click
  const handleCalculate = () => {
    formChangeRef.current = false;
    setIsResultsOpen(true);
  };

  // Handle recalculate (close modal to edit)
  const handleRecalculate = () => {
    setIsResultsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300">
                <Ship className="w-7 h-7 text-primary-foreground" />
              </div>
              <ThemeToggle />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
              Montenegro Car Import
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Calculate import costs for vehicles from Korea
            </p>
            
            {/* Quick status badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {containerType} Container
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                {numberOfCars} {numberOfCars === 1 ? 'Car' : 'Cars'}
              </Badge>
              {completedCars > 0 && (
                <Badge variant="secondary" className="gap-1.5 badge-success">
                  {completedCars}/{numberOfCars} priced
                </Badge>
              )}
            </div>
          </header>

          {/* Input Form - Single column layout */}
          <div className="space-y-5">
            <CurrencyRatesSection
              autoUpdateFX={autoUpdateFX}
              setAutoUpdateFX={setAutoUpdateFX}
              isLoadingRates={isLoadingRates}
              onRefreshRates={handleFetchRates}
              krwToEurRate={krwToEurRate}
              setKrwToEurRate={setKrwToEurRate}
              usdToEurRate={usdToEurRate}
              setUsdToEurRate={setUsdToEurRate}
              lastUpdatedAt={lastUpdatedAt}
              lastValidRates={lastValidRates}
              onRevertToLastValid={() => {
                if (lastValidRates) {
                  setKrwToEurRate(lastValidRates.krwToEur);
                  setUsdToEurRate(lastValidRates.usdToEur);
                }
              }}
            />

            <VehicleDetailsSection
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
              numberOfCars={numberOfCars}
              carPrices={carPrices}
              setCarPrices={setCarPrices}
              krwToEurRate={krwToEurRate}
            />
          </div>
        </div>
      </div>

      {/* Sticky Calculate Button Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 z-40">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleCalculate}
            disabled={!allPricesFilled}
            size="lg"
            className="w-full sm:w-auto sm:min-w-[200px] sm:mx-auto sm:flex h-14 text-lg font-semibold gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <CalcIcon className="w-5 h-5" />
            {allPricesFilled ? 'Calculate' : `Enter ${numberOfCars - completedCars} more price${numberOfCars - completedCars > 1 ? 's' : ''}`}
          </Button>
          {!allPricesFilled && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Fill all car prices to calculate
            </p>
          )}
        </div>
      </div>

      {/* Results Bottom Sheet */}
      <ResultsBottomSheet
        open={isResultsOpen}
        onOpenChange={setIsResultsOpen}
        results={results}
        numberOfCars={numberOfCars}
        scenario={scenario}
        customsDuty={customsDuty}
        vat={vat}
        krwToEurRate={krwToEurRate}
        usdToEurRate={usdToEurRate}
        containerType={containerType}
        onRecalculate={handleRecalculate}
        onScenarioChange={setScenario}
      />
    </div>
  );
};

export default Calculator;
