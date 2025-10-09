import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calculator as CalcIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ResultCard from "./ResultCard";
import KRWInput from "./KRWInput";
import ThemeToggle from "./ThemeToggle";
import { parseKRWInput, convertKRWToEUR, fetchExchangeRates } from "@/utils/currency";
const Calculator = () => {
  const { toast } = useToast();
  
  // Price inputs
  const [carPriceEUR, setCarPriceEUR] = useState<number>(0);
  const [carPriceKRW, setCarPriceKRW] = useState<string>("");
  const [useKRW, setUseKRW] = useState<boolean>(false);
  
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
  const [scenario, setScenario] = useState<string>("physical");
  const [numberOfCars, setNumberOfCars] = useState<number>(1);

  // Fetch exchange rates
  const handleFetchRates = async () => {
    setIsLoadingRates(true);
    const rates = await fetchExchangeRates();
    if (rates) {
      setKrwToEurRate(rates.krwToEur);
      setUsdToEurRate(rates.usdToEur);
      toast({
        title: "Rates updated",
        description: `1 EUR = ${(1 / rates.krwToEur).toFixed(2)} KRW`,
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

  // Calculate car price in EUR
  const getCarPriceEUR = (): number => {
    if (useKRW && carPriceKRW) {
      const parsedInput = parseKRWInput(carPriceKRW);
      const actualKRW = parsedInput * 10000; // Always use 만원 mode for calculation
      return convertKRWToEUR(actualKRW, krwToEurRate);
    }
    return carPriceEUR;
  };

  // Calculations (per car)
  const carPrice = getCarPriceEUR();
  
  // Freight (3500 USD per container -> EUR, split by cars)
  const totalFreightUSD = 3500;
  const freightPerContainerEUR = totalFreightUSD * usdToEurRate;
  const freight = freightPerContainerEUR / numberOfCars;
  
  // Port & Agent Fees (420 base + 250 per car)
  const portAgentFee = (420 + 250 * numberOfCars) / numberOfCars;
  
  // Documents & Services
  const translation = translationPages * 35;
  const speditorFee = 150 * 1.21; // 150 € + 21% VAT = 181.50 €
  
  // Taxes
  const cif = carPrice + freight;
  const customs = cif * customsDuty / 100;
  const vatAmount = (cif + customs) * vat / 100;
  
  // Totals (per car)
  const totalCostWithoutCar = customs + vatAmount + speditorFee + homologationFee + translation + portAgentFee + miscellaneous;
  const finalCost = carPrice + totalCostWithoutCar;
  const vatRefund = scenario === "company" ? vatAmount : 0;
  const netCostForCompany = scenario === "company" ? finalCost - vatRefund : finalCost;
  
  // Total for all cars
  const totalCIF = cif * numberOfCars;
  const totalCustoms = customs * numberOfCars;
  const totalVAT = vatAmount * numberOfCars;
  const totalCostWithoutCarAll = totalCostWithoutCar * numberOfCars;
  const totalFinalCost = finalCost * numberOfCars;
  const totalVATRefund = vatRefund * numberOfCars;
  const totalNetCostForCompany = netCostForCompany * numberOfCars;
  return <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-card">
              <CalcIcon className="w-8 h-8 text-primary-foreground" />
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Montenegro Car Import Calculator</h1>
          <p className="text-muted-foreground text-lg">
            Calculate the total cost of importing your vehicle (KRW → EUR)
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <Card className="p-6 shadow-card transition-smooth hover:shadow-hover">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Currency & Rates
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="autoUpdateFX"
                      checked={autoUpdateFX}
                      onCheckedChange={setAutoUpdateFX}
                    />
                    <Label htmlFor="autoUpdateFX" className="text-sm font-medium cursor-pointer">
                      Auto-update FX rates
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFetchRates}
                    disabled={isLoadingRates}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRates ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="krwToEur" className="text-sm font-medium">
                      KRW → EUR Rate
                    </Label>
                    <Input
                      id="krwToEur"
                      type="number"
                      step="0.000001"
                      value={krwToEurRate}
                      onChange={e => setKrwToEurRate(Number(e.target.value))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      1 EUR = {(1 / krwToEurRate).toFixed(2)} KRW
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="usdToEur" className="text-sm font-medium">
                      USD → EUR Rate
                    </Label>
                    <Input
                      id="usdToEur"
                      type="number"
                      step="0.01"
                      value={usdToEurRate}
                      onChange={e => setUsdToEurRate(Number(e.target.value))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      1 USD = {usdToEurRate.toFixed(4)} EUR
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 shadow-card transition-smooth hover:shadow-hover">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Vehicle Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scenario" className="text-sm font-medium">
                    Import Scenario
                  </Label>
                  <Select value={scenario} onValueChange={setScenario}>
                    <SelectTrigger id="scenario" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical Person</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="numberOfCars" className="text-sm font-medium">
                    Number of Cars
                  </Label>
                  <Input
                    id="numberOfCars"
                    type="number"
                    min="1"
                    max="4"
                    value={numberOfCars}
                    onChange={e => setNumberOfCars(Math.max(1, Math.min(4, Number(e.target.value))))}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    1–4 cars per container
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Switch
                      id="useKRW"
                      checked={useKRW}
                      onCheckedChange={(checked) => {
                        setUseKRW(checked);
                        if (checked) setCarPriceEUR(0);
                        else setCarPriceKRW("");
                      }}
                    />
                    <Label htmlFor="useKRW" className="text-sm font-medium cursor-pointer">
                      Use KRW instead of EUR
                    </Label>
                  </div>

                  {useKRW ? (
                    <KRWInput
                      value={carPriceKRW}
                      onChange={setCarPriceKRW}
                      krwToEurRate={krwToEurRate}
                    />
                  ) : (
                    <div>
                      <Label htmlFor="carPriceEUR" className="text-sm font-medium">
                        Car Price (€)
                      </Label>
                      <Input
                        id="carPriceEUR"
                        type="number"
                        value={carPriceEUR}
                        onChange={e => setCarPriceEUR(Number(e.target.value))}
                        className="mt-1.5"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="freight" className="text-sm font-medium">
                    Freight (€/car)
                  </Label>
                  <Input
                    id="freight"
                    type="text"
                    value={freight.toFixed(2)}
                    readOnly
                    className="mt-1.5 bg-secondary/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Container total: 3500 USD ≈ {freightPerContainerEUR.toFixed(2)} € (at current USD→EUR rate)
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customsDuty" className="text-sm font-medium">
                      Customs Duty (%)
                    </Label>
                    <Input
                      id="customsDuty"
                      type="number"
                      value={customsDuty}
                      onChange={e => setCustomsDuty(Number(e.target.value))}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vat" className="text-sm font-medium">
                      VAT (%)
                    </Label>
                    <Input
                      id="vat"
                      type="number"
                      value={vat}
                      onChange={e => setVat(Number(e.target.value))}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="speditorFee" className="text-sm font-medium">
                      Speditor Fee (€)
                    </Label>
                    <Input
                      id="speditorFee"
                      type="text"
                      value={speditorFee.toFixed(2)}
                      readOnly
                      className="mt-1.5 bg-secondary/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      150 € + 21% VAT = 181.50 €/car
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="homologationFee" className="text-sm font-medium">
                      Homologation Fee (€)
                    </Label>
                    <Input
                      id="homologationFee"
                      type="number"
                      value={homologationFee}
                      onChange={e => setHomologationFee(Number(e.target.value))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Editable (default 250 €)
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="translationPages" className="text-sm font-medium">
                      Translation Pages
                    </Label>
                    <Input
                      id="translationPages"
                      type="number"
                      min="0"
                      value={translationPages}
                      onChange={e => setTranslationPages(Math.max(0, Number(e.target.value)))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      35 € per page = {translation.toFixed(2)} € total
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="portAgentFee" className="text-sm font-medium">
                      Port & Agent Fee (€/car)
                    </Label>
                    <Input
                      id="portAgentFee"
                      type="text"
                      value={portAgentFee.toFixed(2)}
                      readOnly
                      className="mt-1.5 bg-secondary/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      420 base + 250 per car
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="miscellaneous" className="text-sm font-medium">
                    Miscellaneous (€)
                  </Label>
                  <Input
                    id="miscellaneous"
                    type="number"
                    value={miscellaneous}
                    onChange={e => setMiscellaneous(Number(e.target.value))}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Calculation Results
              </h2>
              {numberOfCars > 1 && (
                <span className="text-sm text-muted-foreground">
                  {numberOfCars} cars
                </span>
              )}
            </div>

            {numberOfCars === 1 ? (
              <>
                <ResultCard label="CIF Value" value={cif} description="Car price + Freight" />
                <ResultCard label="Customs Duty" value={customs} description={`${customsDuty}% of CIF`} />
                <ResultCard label="VAT" value={vatAmount} description={`${vat}% of (CIF + Customs)`} />
                <ResultCard label="Total Cost (without car)" value={totalCostWithoutCar} description="All fees and taxes" highlight />
                <ResultCard label="Final Cost" value={finalCost} description="Total amount including car" highlight />

                {scenario === "company" && (
                  <>
                    <ResultCard label="VAT Refund" value={vatRefund} description="Refundable for companies" positive />
                    <ResultCard label="Net Cost for Company" value={netCostForCompany} description="Final cost after VAT refund" highlight />
                  </>
                )}
              </>
            ) : (
              <>
                <Card className="p-4 bg-secondary/50">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Per Car</h3>
                  <div className="space-y-2">
                    <ResultCard label="CIF Value" value={cif} description="Car price + Freight" />
                    <ResultCard label="Customs Duty" value={customs} description={`${customsDuty}% of CIF`} />
                    <ResultCard label="VAT" value={vatAmount} description={`${vat}% of (CIF + Customs)`} />
                    <ResultCard label="Total Cost (without car)" value={totalCostWithoutCar} description="All fees and taxes" highlight />
                    <ResultCard label="Final Cost" value={finalCost} description="Total amount including car" highlight />
                    
                    {scenario === "company" && (
                      <>
                        <ResultCard label="VAT Refund" value={vatRefund} description="Refundable for companies" positive />
                        <ResultCard label="Net Cost for Company" value={netCostForCompany} description="Final cost after VAT refund" highlight />
                      </>
                    )}
                  </div>
                </Card>

                <Card className="p-4 bg-primary/5 border-primary/20">
                  <h3 className="text-lg font-semibold text-primary mb-3">Total Container ({numberOfCars} cars)</h3>
                  <div className="space-y-2">
                    <ResultCard label="Total CIF Value" value={totalCIF} description={`${numberOfCars} × CIF`} />
                    <ResultCard label="Total Customs" value={totalCustoms} description={`${numberOfCars} × Customs`} />
                    <ResultCard label="Total VAT" value={totalVAT} description={`${numberOfCars} × VAT`} />
                    <ResultCard label="Total Cost (without cars)" value={totalCostWithoutCarAll} description="All fees and taxes" highlight />
                    <ResultCard label="Total Final Cost" value={totalFinalCost} description="Grand total" highlight />
                    
                    {scenario === "company" && (
                      <>
                        <ResultCard label="Total VAT Refund" value={totalVATRefund} description="Total refundable" positive />
                        <ResultCard label="Total Net Cost" value={totalNetCostForCompany} description="After VAT refund" highlight />
                      </>
                    )}
                  </div>
                </Card>
              </>
            )}

            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              Rates used: 1 EUR = {(1 / krwToEurRate).toFixed(2)} KRW | 1 USD = {usdToEurRate.toFixed(4)} EUR
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Calculator;