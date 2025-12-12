import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Coins, SlidersHorizontal, ChevronDown } from "lucide-react";

interface CurrencyRatesSectionProps {
  autoUpdateFX: boolean;
  setAutoUpdateFX: (value: boolean) => void;
  isLoadingRates: boolean;
  onRefreshRates: () => void;
  krwToEurRate: number;
  setKrwToEurRate: (value: number) => void;
  usdToEurRate: number;
  setUsdToEurRate: (value: number) => void;
  lastUpdatedAt: number | null;
  lastValidRates: { krwToEur: number; usdToEur: number } | null;
  onRevertToLastValid: () => void;
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
  lastUpdatedAt,
  lastValidRates,
  onRevertToLastValid,
}: CurrencyRatesSectionProps) => {
  const KRW_RANGE = { min: 0.0001, max: 0.005 };
  const USD_RANGE = { min: 0.5, max: 2 };
  const [showDetails, setShowDetails] = useState(false);

  const krwInvalid = krwToEurRate < KRW_RANGE.min || krwToEurRate > KRW_RANGE.max;
  const usdInvalid = usdToEurRate < USD_RANGE.min || usdToEurRate > USD_RANGE.max;

  const safeNumber = (value: string) => {
    const num = Number(value.replace(",", "."));
    return Number.isFinite(num) ? num : 0;
  };

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const updatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString()
    : "No data";

  return (
    <Card className="p-3 sm:p-4 shadow-card transition-smooth hover:shadow-hover animate-fade-in glass-card">
      {/* Compact header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Coins className="w-4 h-4 text-primary/90" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Exchange Rates</h2>
              <p className="text-[11px] text-muted-foreground">Updated: {updatedLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshRates}
              disabled={isLoadingRates}
              className="h-8 gap-1.5 px-2 sm:px-3"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRates ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline text-xs">
                {isLoadingRates ? "Loading..." : "Refresh"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails((prev) => !prev)}
              className="h-8 gap-1.5 px-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs sm:text-sm">{showDetails ? "Hide" : "Edit"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 text-xs sm:text-sm">
            <span className="text-muted-foreground text-[11px]">1€</span>
            <span className="font-semibold">₩{(1 / krwToEurRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 text-xs sm:text-sm">
            <span className="text-muted-foreground text-[11px]">$1</span>
            <span className="font-semibold">€{usdToEurRate.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 text-xs">
            <Switch
              id="autoUpdateFX"
              checked={autoUpdateFX}
              onCheckedChange={setAutoUpdateFX}
              className="scale-90"
            />
            <span className="text-muted-foreground text-[11px] sm:text-xs">Auto</span>
          </div>
        </div>
      </div>

      {/* Editable details (toggle) */}
      {showDetails && (
        <div className="space-y-4 mt-4 pt-3 border-t border-border/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                1€ = ₩{(1 / krwToEurRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}
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

          {(krwInvalid || usdInvalid) && lastValidRates && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/30">
              <p className="text-xs text-destructive">Out of range. Restore last successful rates?</p>
              <Button size="sm" variant="outline" onClick={onRevertToLastValid}>
                Revert
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
