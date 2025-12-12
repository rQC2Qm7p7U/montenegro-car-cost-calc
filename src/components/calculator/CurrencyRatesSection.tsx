import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Coins } from "lucide-react";

interface CurrencyRatesSectionProps {
  autoUpdateFX: boolean;
  setAutoUpdateFX: (value: boolean) => void;
  isLoadingRates: boolean;
  onRefreshRates: () => void;
  krwToEurRate: number;
  setKrwToEurRate: (value: number) => void;
  usdToEurRate: number;
  setUsdToEurRate: (value: number) => void;
}

export const CurrencyRatesSection = ({
  autoUpdateFX,
  setAutoUpdateFX,
  isLoadingRates,
  onRefreshRates,
  krwToEurRate,
  setKrwToEurRate,
  usdToEurRate,
  setUsdToEurRate,
}: CurrencyRatesSectionProps) => {
  const KRW_RANGE = { min: 0.0001, max: 0.005 };
  const USD_RANGE = { min: 0.5, max: 2 };

  const krwInvalid = krwToEurRate < KRW_RANGE.min || krwToEurRate > KRW_RANGE.max;
  const usdInvalid = usdToEurRate < USD_RANGE.min || usdToEurRate > USD_RANGE.max;

  const safeNumber = (value: string) => {
    const num = Number(value.replace(",", "."));
    return Number.isFinite(num) ? num : 0;
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  return (
    <Card className="p-5 shadow-card transition-smooth hover:shadow-hover animate-fade-in glass-card">
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Exchange Rates
            </h2>
            <p className="text-xs text-muted-foreground">KRW & USD to EUR</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshRates}
          disabled={isLoadingRates}
          className="h-9 gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingRates ? 'animate-spin' : ''}`} />
          {isLoadingRates ? 'Loading...' : 'Update'}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Rate cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <Label htmlFor="krwToEur" className="text-xs font-medium text-muted-foreground block mb-2">
              KRW → EUR
            </Label>
            <Input
              id="krwToEur"
              type="number"
              step="0.000001"
              value={krwToEurRate}
              min={KRW_RANGE.min}
              max={KRW_RANGE.max}
              onChange={(e) =>
                setKrwToEurRate(clamp(safeNumber(e.target.value), KRW_RANGE.min, KRW_RANGE.max))
              }
              className={`input-focus-ring bg-background/50 h-9 text-sm ${
                krwInvalid ? "border-destructive/60" : ""
              }`}
            />
            <p className="text-xs text-primary font-medium mt-2">
              1€ = ₩{(1 / krwToEurRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            {krwInvalid && (
              <p className="text-[11px] text-destructive mt-1">
                Expected range: {KRW_RANGE.min}–{KRW_RANGE.max}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <Label htmlFor="usdToEur" className="text-xs font-medium text-muted-foreground block mb-2">
              USD → EUR
            </Label>
            <Input
              id="usdToEur"
              type="number"
              step="0.01"
              value={usdToEurRate}
              min={USD_RANGE.min}
              max={USD_RANGE.max}
              onChange={(e) =>
                setUsdToEurRate(clamp(safeNumber(e.target.value), USD_RANGE.min, USD_RANGE.max))
              }
              className={`input-focus-ring bg-background/50 h-9 text-sm ${
                usdInvalid ? "border-destructive/60" : ""
              }`}
            />
            <p className="text-xs text-primary font-medium mt-2">
              $1 = €{usdToEurRate.toFixed(4)}
            </p>
            {usdInvalid && (
              <p className="text-[11px] text-destructive mt-1">
                Expected range: {USD_RANGE.min}–{USD_RANGE.max}
              </p>
            )}
          </div>
        </div>

        {/* Auto-update toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
          <Label htmlFor="autoUpdateFX" className="text-sm text-muted-foreground cursor-pointer">
            Auto-update on load
          </Label>
          <Switch
            id="autoUpdateFX"
            checked={autoUpdateFX}
            onCheckedChange={setAutoUpdateFX}
          />
        </div>
      </div>
    </Card>
  );
};
