import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Info, Car, CheckCircle2 } from "lucide-react";
import { formatKRW, parseKRWInput, formatEUR } from "@/utils/currency";
import type { Language } from "@/types/language";
import { useCalculatorContext } from "./CalculatorContext";
import { useCarPricesForm } from "./useCarPricesForm";

const copy: Record<
  Language,
  {
    title: string;
    entered: (completed: number, total: number) => string;
    formatHint: string;
    selectEur: string;
    selectKrw: string;
    rawKrwLabel: string;
    rawKrwInfo: string;
    applyAll: string;
    carLabel: (index: number) => string;
    approxWithTaxes: string;
    containerSplit: string;
    eurPlaceholder: string;
    krwPlaceholder: string;
    krwRawPlaceholder: string;
  }
> = {
  en: {
    title: "Vehicle Prices",
    entered: (completed, total) => `${completed}/${total} entered`,
    formatHint: "Expected format: 12 345 €",
    selectEur: "EUR €",
    selectKrw: "KRW ₩",
    rawKrwLabel: "Full KRW (no 만원)",
    rawKrwInfo: "Korean shorthand: '만원' = ×10,000\nExample: 2 280 → 22 800 000 KRW",
    applyAll: "Apply Car #1 price to all",
    carLabel: (index) => `Car #${index}`,
    approxWithTaxes: "with freight & taxes",
    containerSplit: "Container costs are split equally between vehicles",
    eurPlaceholder: "e.g. 12 500",
    krwPlaceholder: "e.g. 2 280",
    krwRawPlaceholder: "e.g. 22 800 000",
  },
  ru: {
    title: "Стоимость автомобилей",
    entered: (completed, total) => `${completed}/${total} заполнено`,
    formatHint: "Формат: 12 345 €",
    selectEur: "Евро €",
    selectKrw: "Вона ₩",
    rawKrwLabel: "Полная сумма KRW (без 만원)",
    rawKrwInfo: "Короткая запись в Корее: '만원' = ×10 000\nПример: 2 280 → 22 800 000 KRW",
    applyAll: "Применить цену авто №1 ко всем",
    carLabel: (index) => `Авто №${index}`,
    approxWithTaxes: "с учетом доставки и налогов",
    containerSplit: "Стоимость контейнера делится поровну между авто",
    eurPlaceholder: "Например: 12 500",
    krwPlaceholder: "Например: 2 280",
    krwRawPlaceholder: "Например: 22 800 000",
  },
};

type CopyEntry = (typeof copy)["en"];

type CurrencyMode = "eur" | "krw";

const CarPriceRow = ({
  index,
  currencyMode,
  rawKRWMode,
  eurValue,
  krwValue,
  carPrice,
  t,
  onEURChange,
  onKRWChange,
  preview,
}: {
  index: number;
  currencyMode: "eur" | "krw";
  rawKRWMode: boolean;
  eurValue: string;
  krwValue: string;
  carPrice: number;
  t: CopyEntry;
  onEURChange: (value: string) => void;
  onKRWChange: (value: string) => void;
  preview?: {
    finalCost: number;
  };
}) => {
  const hasPrice = carPrice > 0;
  return (
    <div
      className={`relative p-3 rounded-lg border transition-all duration-200 ${
        hasPrice
          ? "bg-primary/5 border-primary/20"
          : "bg-muted/30 border-border/50 hover:border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor={`carPrice${index}`} className="text-sm font-medium flex items-center gap-2">
          {t.carLabel(index + 1)}
          {hasPrice && <CheckCircle2 className="w-4 h-4 text-primary" />}
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
            value={eurValue}
            onChange={(e) => onEURChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder={t.eurPlaceholder}
            className="input-focus-ring bg-background/50"
          />
          {preview && preview.finalCost > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              ≈ €{formatEUR(preview.finalCost)} {t.approxWithTaxes}
            </p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <Input
            id={`carPrice${index}`}
            type="text"
            value={krwValue}
            onChange={(e) => onKRWChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder={rawKRWMode ? t.krwRawPlaceholder : t.krwPlaceholder}
            className="input-focus-ring bg-background/50"
          />
          {krwValue && parseKRWInput(krwValue) > 0 && (
            <>
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-muted-foreground">
                  {formatKRW(
                    rawKRWMode ? parseKRWInput(krwValue) : parseKRWInput(krwValue) * 10000,
                  )}{" "}
                  KRW
                </span>
                <span className="text-primary font-semibold">
                  ≈ €{formatEUR(carPrice)}
                </span>
              </div>
              {preview && preview.finalCost > 0 && (
                <p className="text-[11px] text-muted-foreground px-1">
                  ≈ €{formatEUR(preview.finalCost)} {t.approxWithTaxes}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const CarPricesSection = () => {
  const { language } = useCalculatorContext();
  const t: CopyEntry = copy[language];
  const {
    numberOfCars,
    carPrices,
    currencyMode,
    setCurrencyMode,
    rawKRWMode,
    setRawKRWMode,
    krwInputValues,
    eurInputValues,
    handlePriceChange,
    handleKRWChange,
    setAllToSamePrice,
    completedCount,
    carResultByIndex,
    results,
  } = useCarPricesForm();

  return (
    <Card className="p-5 shadow-card transition-smooth hover:shadow-hover animate-fade-in glass-card" style={{ animationDelay: "0.15s" }}>
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Car className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            {t.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t.entered(completedCount, numberOfCars)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {t.formatHint}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={currencyMode} onValueChange={(v) => setCurrencyMode(v as CurrencyMode)}>
            <SelectTrigger className="w-[90px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eur">{t.selectEur}</SelectItem>
              <SelectItem value="krw">{t.selectKrw}</SelectItem>
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
            {t.rawKrwLabel}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="max-w-xs text-sm whitespace-pre-line">
                  {t.rawKrwInfo}
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
          {t.applyAll}
        </Button>
      )}

      <div className="space-y-3">
        {Array.from({ length: numberOfCars }).map((_, index) => {
          const preview = carResultByIndex.get(index);
          return (
            <CarPriceRow
              key={index}
              index={index}
              currencyMode={currencyMode}
              rawKRWMode={rawKRWMode}
              eurValue={eurInputValues[index] ?? ""}
              krwValue={krwInputValues[index] || ""}
              carPrice={carPrices[index] ?? 0}
              t={t}
              onEURChange={(value) => handlePriceChange(index, value)}
              onKRWChange={(value) => handleKRWChange(index, value)}
              preview={preview}
            />
          );
        })}
      </div>

      {numberOfCars > 1 && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          {t.containerSplit}
        </p>
      )}
    </Card>
  );
};
