import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Info, Car, CheckCircle2 } from "lucide-react";
import { formatKRW, parseKRWInput, convertKRWToEUR, formatEUR } from "@/utils/currency";
import type { CalculationResults } from "@/types/calculator";

interface CarPricesSectionProps {
  numberOfCars: number;
  carPrices: number[];
  setCarPrices: Dispatch<SetStateAction<number[]>>;
  krwToEurRate: number;
  results: CalculationResults;
}

type CurrencyMode = "eur" | "krw";

const clampNonNegative = (value: number) =>
  !Number.isFinite(value) || value < 0 ? 0 : value;

const formatEuroInput = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

const computeEurFromKrwInput = (input: string, rate: number, raw: boolean) => {
  const parsedKRW = parseKRWInput(input);
  const actualKRW = raw ? parsedKRW : parsedKRW * 10000;
  return clampNonNegative(convertKRWToEUR(actualKRW, rate));
};

const formatKrwFromEur = (eur: number, rate: number, raw: boolean) => {
  if (!eur || !Number.isFinite(rate) || rate <= 0) return "";
  const krw = eur / rate;
  const display = raw ? krw : krw / 10000;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(display);
};

export const CarPricesSection = ({
  numberOfCars,
  carPrices,
  setCarPrices,
  krwToEurRate,
  results,
}: CarPricesSectionProps) => {
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("eur");
  const [rawKRWMode, setRawKRWMode] = useState(false);
  const [krwInputValues, setKrwInputValues] = useState<string[]>(Array(numberOfCars).fill(""));
  const [eurInputValues, setEurInputValues] = useState<string[]>(Array(numberOfCars).fill(""));
  const debounceTimersRef = useRef<Record<number, ReturnType<typeof setTimeout> | undefined>>({});
  const prevKrwRateRef = useRef(krwToEurRate);
  const prevRawModeRef = useRef(rawKRWMode);

  const updateCarPriceDebounced = (index: number, value: number) => {
    const timers = debounceTimersRef.current;
    if (timers[index]) {
      clearTimeout(timers[index]);
    }
    timers[index] = setTimeout(() => {
      setCarPrices((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    }, 150);
  };

  const handlePriceChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, "");
    const intValue = digitsOnly === "" ? 0 : Math.trunc(Number(digitsOnly));
    const safeValue = clampNonNegative(intValue);

    setEurInputValues((prev) => {
      const next = [...prev];
      next[index] = digitsOnly === "" ? "" : formatEuroInput(safeValue);
      return next;
    });

    updateCarPriceDebounced(index, digitsOnly === "" ? 0 : safeValue);
  };

  const handleKRWChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^\d,]/g, "");
    setKrwInputValues((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });

    const eurValue = computeEurFromKrwInput(cleaned, krwToEurRate, rawKRWMode);
    updateCarPriceDebounced(index, eurValue);
    setEurInputValues((prev) => {
      const next = [...prev];
      next[index] = eurValue ? formatEuroInput(eurValue) : "";
      return next;
    });
  };

  const setAllToSamePrice = () => {
    const baseEur = clampNonNegative(carPrices[0] ?? 0);
    const eurDisplay = baseEur ? formatEuroInput(baseEur) : "";
    const krwDisplay = formatKrwFromEur(baseEur, krwToEurRate, rawKRWMode);

    const newPrices = Array(numberOfCars).fill(baseEur);
    setCarPrices(newPrices);
    setEurInputValues(Array(numberOfCars).fill(eurDisplay));
    setKrwInputValues(Array(numberOfCars).fill(krwDisplay));
  };

  const completedCount = carPrices.filter(p => p > 0).length;
  const carResultByIndex = new Map(results.carResults.map((car) => [car.carIndex - 1, car]));

  // Keep KRW inputs in sync with car count
  useEffect(() => {
    setEurInputValues((prev) => {
      if (prev.length < numberOfCars) {
        return [...prev, ...Array(numberOfCars - prev.length).fill("")];
      }
      if (prev.length > numberOfCars) {
        return prev.slice(0, numberOfCars);
      }
      return prev;
    });

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

  // Keep EUR inputs in sync when values change externally (e.g., hydration)
  useEffect(() => {
    setEurInputValues((prev) => {
      const next = [...prev];
      for (let i = 0; i < numberOfCars; i += 1) {
        if (carPrices[i] > 0 && (!next[i] || next[i] === "0")) {
          next[i] = formatEuroInput(carPrices[i]);
        }
      }
      return next.slice(0, numberOfCars);
    });
  }, [carPrices, numberOfCars]);

  // Sync KRW inputs when switching to KRW mode or when rates/raw mode change
  useEffect(() => {
    if (currencyMode !== "krw") return;
    setKrwInputValues((prev) => {
      const next = [...prev];
      for (let i = 0; i < numberOfCars; i += 1) {
        next[i] = carPrices[i] > 0 ? formatKrwFromEur(carPrices[i], krwToEurRate, rawKRWMode) : "";
      }
      return next.slice(0, numberOfCars);
    });
  }, [carPrices, currencyMode, krwToEurRate, numberOfCars, rawKRWMode]);

  // Recalculate EUR prices when KRW rate or input mode changes
  useEffect(() => {
    const rateChanged = prevKrwRateRef.current !== krwToEurRate;
    const rawChanged = prevRawModeRef.current !== rawKRWMode;
    prevKrwRateRef.current = krwToEurRate;
    prevRawModeRef.current = rawKRWMode;
    if (!rateChanged && !rawChanged) return;
    if (!krwInputValues.some(Boolean)) return;

    const updatedPrices = [...carPrices];
    const updatedEurInputs = [...eurInputValues];

    krwInputValues.forEach((value, index) => {
      if (!value) return;
      const eurValue = computeEurFromKrwInput(value, krwToEurRate, rawKRWMode);
      updatedPrices[index] = eurValue;
      updatedEurInputs[index] = eurValue ? formatEuroInput(eurValue) : "";
    });

    setCarPrices(updatedPrices);
    setEurInputValues(updatedEurInputs);
  }, [carPrices, eurInputValues, krwInputValues, krwToEurRate, rawKRWMode, setCarPrices]);

  useEffect(
    () => () => {
      Object.values(debounceTimersRef.current).forEach((timer) => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    },
    [],
  );

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
          <p className="text-[11px] text-muted-foreground mt-1">
            Expected format: 12,345 €
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
      {numberOfCars > 1 && (
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
          const preview = carResultByIndex.get(index);
          
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
                <>
                  <Input
                    id={`carPrice${index}`}
                    type="text"
                    inputMode="numeric"
                    value={eurInputValues[index] ?? ""}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="12,345"
                    className="input-focus-ring bg-background/50"
                  />
                  {preview && preview.carPrice > 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      ≈ €{formatEUR(preview.finalCost)} with freight & taxes
                    </p>
                  )}
                </>
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
                    <>
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-muted-foreground">
                          {formatKRW(rawKRWMode ? parseKRWInput(krwInputValues[index]) : parseKRWInput(krwInputValues[index]) * 10000)} KRW
                        </span>
                        <span className="text-primary font-semibold">
                          ≈ €{formatEUR(carPrices[index])}
                        </span>
                      </div>
                      {preview && preview.carPrice > 0 && (
                        <p className="text-[11px] text-muted-foreground px-1">
                          ≈ €{formatEUR(preview.finalCost)} with freight & taxes
                        </p>
                      )}
                    </>
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
