import { useState, useEffect } from "react";
import { Calculator as CalcIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "./ThemeToggle";
import { fetchExchangeRates } from "@/utils/currency";
import { useCarImportCalculations } from "@/hooks/useCarImportCalculations";
import { CurrencyRatesSection } from "./calculator/CurrencyRatesSection";
import { VehicleDetailsSection } from "./calculator/VehicleDetailsSection";
import { CarPricesSection } from "./calculator/CarPricesSection";
import { CalculationResults } from "./calculator/CalculationResults";

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

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-card hover-scale">
              <CalcIcon className="w-8 h-8 text-primary-foreground" />
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Montenegro Car Import Calculator</h1>
          <p className="text-muted-foreground text-lg">
            Calculate the total cost of importing vehicles with different prices
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
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

          {/* Results */}
          <CalculationResults
            results={results}
            numberOfCars={numberOfCars}
            scenario={scenario}
            customsDuty={customsDuty}
            vat={vat}
            krwToEurRate={krwToEurRate}
            usdToEurRate={usdToEurRate}
          />
        </div>
      </div>
    </div>
  );
};

export default Calculator;
