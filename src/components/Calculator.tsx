import { useState, useEffect } from "react";
import { Ship, Calculator as CalcIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "./ThemeToggle";
import { fetchExchangeRates } from "@/utils/currency";
import { useCarImportCalculations } from "@/hooks/useCarImportCalculations";
import { CurrencyRatesSection } from "./calculator/CurrencyRatesSection";
import { VehicleDetailsSection } from "./calculator/VehicleDetailsSection";
import { CarPricesSection } from "./calculator/CarPricesSection";
import { CalculationResults } from "./calculator/CalculationResults";
import { Badge } from "@/components/ui/badge";

const Calculator = () => {
  const { toast } = useToast();

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

  // Update carPrices array when numberOfCars changes
  useEffect(() => {
    setCarPrices((prev) => {
      if (prev.length < numberOfCars) {
        // Add new entries with 0 price
        return [...prev, ...Array(numberOfCars - prev.length).fill(0)];
      } else if (prev.length > numberOfCars) {
        // Trim excess entries
        return prev.slice(0, numberOfCars);
      }
      return prev;
    });
  }, [numberOfCars]);

  // Calculate all results using custom hook
  const results = useCarImportCalculations({
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
  });

  // Fetch exchange rates
  const handleFetchRates = async () => {
    setIsLoadingRates(true);
    const rates = await fetchExchangeRates();
    if (rates) {
      setKrwToEurRate(rates.krwToEur);
      setUsdToEurRate(rates.usdToEur);
      toast({
        title: "Rates updated",
        description: `1 EUR = ${(1 / rates.krwToEur).toFixed(2)} KRW | 1 USD = ${rates.usdToEur.toFixed(4)} EUR`,
      });
    } else {
      toast({
        title: "Failed to fetch rates",
        description: "Using manual rates",
        variant: "destructive",
      });
    }
    setIsLoadingRates(false);
  };

  // Calculate completion percentage for car prices
  const completedCars = carPrices.filter(p => p > 0).length;
  const completionPercent = Math.round((completedCars / numberOfCars) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Input Form */}
          <div className="space-y-5 order-2 lg:order-1">
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

          {/* Results - Sticky on desktop */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start">
            <CalculationResults
              results={results}
              numberOfCars={numberOfCars}
              scenario={scenario}
              customsDuty={customsDuty}
              vat={vat}
              krwToEurRate={krwToEurRate}
              usdToEurRate={usdToEurRate}
              completionPercent={completionPercent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
