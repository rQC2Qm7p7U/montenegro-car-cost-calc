import { useState, useEffect, useRef, useCallback } from "react";
import { Ship, Calculator as CalcIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "./ThemeToggle";
import { fetchExchangeRates } from "@/utils/currency";
import { useCarImportCalculations } from "@/hooks/useCarImportCalculations";
import { CurrencyRatesSection } from "./calculator/CurrencyRatesSection";
import { VehicleDetailsSection } from "./calculator/VehicleDetailsSection";
import { CarPricesSection } from "./calculator/CarPricesSection";
import { ResultsBottomSheet } from "./calculator/ResultsBottomSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Calculator = () => {
  const { toast } = useToast();
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const formChangeRef = useRef(false);

  // Car prices (array of EUR values)
  const [carPrices, setCarPrices] = useState<number[]>([0]);

  // Currency rates
  const [krwToEurRate, setKrwToEurRate] = useState<number>(0.00068);
  const [usdToEurRate, setUsdToEurRate] = useState<number>(0.93);
  const [autoUpdateFX, setAutoUpdateFX] = useState<boolean>(false);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);

  // Other costs
  const [customsDuty, setCustomsDuty] = useState<number>(5);
  const [vat, setVat] = useState<number>(21);
  const [translationPages, setTranslationPages] = useState<number>(3);
  const [homologationFee, setHomologationFee] = useState<number>(250);
  const [miscellaneous, setMiscellaneous] = useState<number>(0);

  // Other settings
  const [scenario, setScenario] = useState<"physical" | "company">("physical");
  const [numberOfCars, setNumberOfCars] = useState<number>(1);
  const [containerType, setContainerType] = useState<"20ft" | "40ft">("40ft");

  // Close modal when any input changes
  useEffect(() => {
    if (formChangeRef.current && isResultsOpen) {
      setIsResultsOpen(false);
    }
    formChangeRef.current = true;
  }, [carPrices, krwToEurRate, usdToEurRate, customsDuty, vat, translationPages, homologationFee, miscellaneous, scenario, numberOfCars, containerType]);

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

    toast({
      title: rates.isFallback ? "Using fallback rates" : "Rates updated",
      description: rates.isFallback
        ? "Live rates were unavailable or invalid; using safe defaults."
        : `1 EUR = ${(1 / rates.krwToEur).toFixed(2)} KRW | 1 USD = ${rates.usdToEur.toFixed(4)} EUR`,
      variant: rates.isFallback ? "destructive" : "default",
    });
    setIsLoadingRates(false);
  }, [toast]);

  // Auto-update exchange rates on load or when toggle is enabled
  useEffect(() => {
    if (autoUpdateFX) {
      handleFetchRates();
    }
  }, [autoUpdateFX, handleFetchRates]);

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
      />
    </div>
  );
};

export default Calculator;
