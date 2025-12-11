import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Info } from "lucide-react";
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

  return (
    <Card className="p-6 shadow-card transition-smooth hover:shadow-hover animate-fade-in" style={{ animationDelay: "0.15s" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          Car Prices
        </h2>
        <div className="flex items-center gap-2">
          <Select value={currencyMode} onValueChange={(v) => setCurrencyMode(v as CurrencyMode)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eur">EUR €</SelectItem>
              <SelectItem value="krw">KRW ₩</SelectItem>
            </SelectContent>
          </Select>
          {numberOfCars > 1 && carPrices[0] > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={setAllToSamePrice}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy #1
            </Button>
          )}
        </div>
      </div>

      {currencyMode === "krw" && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
          <Switch
            id="rawKRWMode"
            checked={rawKRWMode}
            onCheckedChange={setRawKRWMode}
          />
          <Label htmlFor="rawKRWMode" className="text-sm text-muted-foreground cursor-pointer">
            Full KRW (no 만원 shorthand)
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Korean shorthand: '만원' means ×10,000.<br />
                  Example: 2,280 = 22,800,000 KRW
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="space-y-4">
        {Array.from({ length: numberOfCars }).map((_, index) => (
          <div key={index} className="space-y-1">
            <Label htmlFor={`carPrice${index}`} className="text-sm font-medium">
              Car #{index + 1} Price ({currencyMode === "eur" ? "€" : rawKRWMode ? "KRW" : "만원"})
            </Label>
            
            {currencyMode === "eur" ? (
              <Input
                id={`carPrice${index}`}
                type="text"
                inputMode="decimal"
                value={carPrices[index] > 0 ? carPrices[index].toLocaleString("en-US") : ""}
                onChange={(e) => handlePriceChange(index, e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="mt-1"
              />
            ) : (
              <div className="space-y-1">
                <Input
                  id={`carPrice${index}`}
                  type="text"
                  value={krwInputValues[index] || ""}
                  onChange={(e) => handleKRWChange(index, e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder={rawKRWMode ? "22800000" : "2280"}
                  className="mt-1"
                />
                {krwInputValues[index] && parseKRWInput(krwInputValues[index]) > 0 && (
                  <div className="text-xs text-muted-foreground space-y-0.5 pl-1">
                    <div>{formatKRW(rawKRWMode ? parseKRWInput(krwInputValues[index]) : parseKRWInput(krwInputValues[index]) * 10000)} KRW</div>
                    <div className="text-primary font-medium">≈ €{formatEUR(carPrices[index])}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {numberOfCars > 1 && (
        <p className="text-xs text-muted-foreground mt-4">
          Each car can have a different price. Container costs are split equally.
        </p>
      )}
    </Card>
  );
};
