import { useState } from "react";
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
  const [editKrw, setEditKrw] = useState(false);
  const [editUsd, setEditUsd] = useState(false);

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
    <Card className="p-3 shadow-card transition-smooth hover:shadow-hover animate-fade-in glass-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Coins className="w-4 h-4 text-primary/90" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Exchange Rates</h2>
            <p className="text-[11px] text-muted-foreground">Tap to edit</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="autoUpdateFX"
            checked={autoUpdateFX}
            onCheckedChange={setAutoUpdateFX}
            className="scale-90"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshRates}
            disabled={isLoadingRates}
            className="h-8 gap-1 px-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingRates ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline text-xs">
              {isLoadingRates ? "Loading..." : "Refresh"}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <Label className="text-[11px] text-muted-foreground block mb-1">KRW → EUR</Label>
          {editKrw ? (
            <Input
              autoFocus
              id="krwToEur"
              type="number"
              step="0.000001"
              value={krwToEurRate}
              min={KRW_RANGE.min}
              max={KRW_RANGE.max}
              onChange={(e) =>
                setKrwToEurRate(clamp(safeNumber(e.target.value), KRW_RANGE.min, KRW_RANGE.max))
              }
              onBlur={() => setEditKrw(false)}
              className={`input-focus-ring bg-background/50 h-9 text-sm ${
                krwInvalid ? "border-destructive/60" : ""
              }`}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditKrw(true)}
              className="w-full h-10 px-3 rounded-md border border-border/60 bg-background/60 text-left text-sm hover:border-primary/40 transition-colors"
            >
              <span className="font-semibold">₩{(1 / krwToEurRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              <span className="text-muted-foreground text-[11px] ml-2">per €</span>
            </button>
          )}
          {krwInvalid && (
            <p className="text-[11px] text-destructive mt-1">
              Expected range: {KRW_RANGE.min}–{KRW_RANGE.max}
            </p>
          )}
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <Label className="text-[11px] text-muted-foreground block mb-1">USD → EUR</Label>
          {editUsd ? (
            <Input
              autoFocus
              id="usdToEur"
              type="number"
              step="0.0001"
              value={usdToEurRate}
              min={USD_RANGE.min}
              max={USD_RANGE.max}
              onChange={(e) =>
                setUsdToEurRate(clamp(safeNumber(e.target.value), USD_RANGE.min, USD_RANGE.max))
              }
              onBlur={() => setEditUsd(false)}
              className={`input-focus-ring bg-background/50 h-9 text-sm ${
                usdInvalid ? "border-destructive/60" : ""
              }`}
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditUsd(true)}
              className="w-full h-10 px-3 rounded-md border border-border/60 bg-background/60 text-left text-sm hover:border-primary/40 transition-colors"
            >
              <span className="font-semibold">€{usdToEurRate.toFixed(4)}</span>
              <span className="text-muted-foreground text-[11px] ml-2">per $</span>
            </button>
          )}
          {usdInvalid && (
            <p className="text-[11px] text-destructive mt-1">
              Expected range: {USD_RANGE.min}–{USD_RANGE.max}
            </p>
          )}
        </div>
      </div>

      {(krwInvalid || usdInvalid) && lastValidRates && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/30 mt-2">
          <p className="text-[11px] text-destructive">Out of range. Restore last successful rates?</p>
          <Button size="sm" variant="outline" onClick={onRevertToLastValid}>
            Revert
          </Button>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-2">
        Last updated: {updatedLabel}
      </p>
    </Card>
  );
};
