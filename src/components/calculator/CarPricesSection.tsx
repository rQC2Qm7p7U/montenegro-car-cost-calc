import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Info, Car, CheckCircle2 } from "lucide-react";
import { formatKRW, parseKRWInput, convertKRWToEUR, formatEUR } from "@/utils/currency";

interface CarPricesSectionProps {
  numberOfCars: number;
  carPrices: number[];
  setCarPrices: (prices: number[]) => void;
  krwToEurRate: number;
}

type CurrencyMode = "eur" | "krw";

export const CarPricesSection = ({
  numberOfCars,
  carPrices,
  setCarPrices,
  krwToEurRate,
}: CarPricesSectionProps) => {
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("eur");
  const [rawKRWMode, setRawKRWMode] = useState(false);
  const [krwInputValues, setKrwInputValues] = useState<string[]>(Array(numberOfCars).fill(""));

  const handlePriceChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^\d]/g, "");
    const numValue = cleaned === "" ? 0 : Number(cleaned);
    const newPrices = [...carPrices];
    newPrices[index] = numValue;
    setCarPrices(newPrices);
  };

  const handleKRWChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^\d,]/g, "");
    const newKrwValues = [...krwInputValues];
    newKrwValues[index] = cleaned;
    setKrwInputValues(newKrwValues);

    // Convert KRW to EUR and update carPrices
    const parsedKRW = parseKRWInput(cleaned);
    const actualKRW = rawKRWMode ? parsedKRW : parsedKRW * 10000;
    const eurValue = convertKRWToEUR(actualKRW, krwToEurRate);
    
    const newPrices = [...carPrices];
    newPrices[index] = Math.round(eurValue);
    setCarPrices(newPrices);
  };

  const setAllToSamePrice = () => {
    const firstPrice = carPrices[0] || 0;
    if (firstPrice > 0) {
      const newPrices = Array(numberOfCars).fill(firstPrice);
      setCarPrices(newPrices);
      if (currencyMode === "krw" && krwInputValues[0]) {
        setKrwInputValues(Array(numberOfCars).fill(krwInputValues[0]));
      }
    }
  };

  const completedCount = carPrices.filter(p => p > 0).length;

  // Keep KRW inputs in sync with car count
  useEffect(() => {
    setKrwInputValues((prev) => {
      if (prev.length < numberOfCars) {
        return [...prev, ...Array(numberOfCars - prev.length).fill("")];
      }
      if (prev.length > numberOfCars) {
        return prev.slice(0, numberOfCars);
      }
      return prev;
    });
  }, [numberOfCars]);

  // Recalculate EUR prices when KRW rate or input mode changes
  useEffect(() => {
    if (!krwInputValues.some(Boolean)) return;
    setCarPrices((prevPrices) => {
      const updated = [...prevPrices];
      krwInputValues.forEach((value, index) => {
        if (!value) return;
        const parsedKRW = parseKRWInput(value);
        const actualKRW = rawKRWMode ? parsedKRW : parsedKRW * 10000;
        const eurValue = convertKRWToEUR(actualKRW, krwToEurRate);
        updated[index] = Math.round(eurValue);
      });
      return updated;
    });
  }, [krwInputValues, krwToEurRate, rawKRWMode, setCarPrices]);

  return (
    <Card className="p-5 shadow-card transition-smooth hover:shadow-hover animate-fade-in glass-card" style={{ animationDelay: "0.15s" }}>
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            Vehicle Prices
          </h2>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{numberOfCars} entered
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={currencyMode} onValueChange={(v) => setCurrencyMode(v as CurrencyMode)}>
            <SelectTrigger className="w-[90px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eur">EUR €</SelectItem>
              <SelectItem value="krw">KRW ₩</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-4">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${(completedCount / numberOfCars) * 100}%` }}
        />
      </div>

      {currencyMode === "krw" && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <Switch
            id="rawKRWMode"
            checked={rawKRWMode}
            onCheckedChange={setRawKRWMode}
          />
          <Label htmlFor="rawKRWMode" className="text-sm text-muted-foreground cursor-pointer flex-1">
            Full KRW (no 만원)
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="max-w-xs text-sm">
                  Korean shorthand: '만원' = ×10,000<br />
                  Example: 2,280 → 22,800,000 KRW
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Copy button for multiple cars */}
      {numberOfCars > 1 && carPrices[0] > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={setAllToSamePrice}
          className="w-full mb-4 gap-2 h-9"
        >
          <Copy className="w-4 h-4" />
          Apply Car #1 price to all
        </Button>
      )}

      <div className="space-y-3">
        {Array.from({ length: numberOfCars }).map((_, index) => {
          const hasPrice = carPrices[index] > 0;
          
          return (
            <div 
              key={index} 
              className={`relative p-3 rounded-lg border transition-all duration-200 ${
                hasPrice 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-border/50 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor={`carPrice${index}`} className="text-sm font-medium flex items-center gap-2">
                  Car #{index + 1}
                  {hasPrice && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {currencyMode === "eur" ? "€" : rawKRWMode ? "KRW" : "만원"}
                </span>
              </div>
              
              {currencyMode === "eur" ? (
                <Input
                  id={`carPrice${index}`}
                  type="text"
                  inputMode="decimal"
                  value={carPrices[index] > 0 ? carPrices[index].toLocaleString("en-US") : ""}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Enter price..."
                  className="input-focus-ring bg-background/50"
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    id={`carPrice${index}`}
                    type="text"
                    value={krwInputValues[index] || ""}
                    onChange={(e) => handleKRWChange(index, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder={rawKRWMode ? "22,800,000" : "2,280"}
                    className="input-focus-ring bg-background/50"
                  />
                  {krwInputValues[index] && parseKRWInput(krwInputValues[index]) > 0 && (
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-muted-foreground">
                        {formatKRW(rawKRWMode ? parseKRWInput(krwInputValues[index]) : parseKRWInput(krwInputValues[index]) * 10000)} KRW
                      </span>
                      <span className="text-primary font-semibold">
                        ≈ €{formatEUR(carPrices[index])}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {numberOfCars > 1 && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Container costs are split equally between vehicles
        </p>
      )}
    </Card>
  );
};
