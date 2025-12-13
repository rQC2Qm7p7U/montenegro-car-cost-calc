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
  krwPerUsdRate: number;
  setKrwPerUsdRate: (value: number) => void;
  usdPerEurRate: number;
  setUsdPerEurRate: (value: number) => void;
  lastUpdatedAt: number | null;
  lastValidRates: { krwPerUsd: number; usdPerEur: number } | null;
  onRevertToLastValid: () => void;
}

export const CurrencyRatesSection = ({
  autoUpdateFX,
  setAutoUpdateFX,
  isLoadingRates,
  onRefreshRates,
  krwPerUsdRate,
  setKrwPerUsdRate,
  usdPerEurRate,
  setUsdPerEurRate,
  lastUpdatedAt,
  lastValidRates,
  onRevertToLastValid,
}: CurrencyRatesSectionProps) => {
  const [editKrw, setEditKrw] = useState(false);
  const [editUsd, setEditUsd] = useState(false);

  const toPositiveNumber = (value: string) => {
    const num = Number(value.replace(",", "."));
    if (!Number.isFinite(num)) return 0;
    return num > 0 ? num : 0;
  };

  const formatKrwPerUsd = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "—";
    return `₩${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
      .format(value)
      .replace(/\u00A0/g, " ")}`;
  };

  const formatUsdPerEur = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "—";
    return `$${value
      .toLocaleString("ru-RU", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })
      .replace(/\u00A0/g, " ")}`;
  };

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
          <Label className="text-[11px] text-muted-foreground block mb-1">KRW → USD</Label>
          {editKrw ? (
            <Input
              autoFocus
              id="krwPerUsd"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={krwPerUsdRate}
              onChange={(e) => setKrwPerUsdRate(toPositiveNumber(e.target.value))}
              onBlur={() => setEditKrw(false)}
              placeholder="1350"
              className="input-focus-ring bg-background/50 h-10 text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditKrw(true)}
              className="w-full h-10 px-3 rounded-md border border-border/60 bg-background/60 text-left text-sm hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-foreground">{formatKrwPerUsd(krwPerUsdRate)}</span>
                <span className="text-muted-foreground text-[11px] ml-2">per $1</span>
              </div>
            </button>
          )}
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <Label className="text-[11px] text-muted-foreground block mb-1">EUR → USD</Label>
          {editUsd ? (
            <Input
              autoFocus
              id="usdPerEur"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={usdPerEurRate}
              onChange={(e) => setUsdPerEurRate(toPositiveNumber(e.target.value))}
              onBlur={() => setEditUsd(false)}
              placeholder="1.0700"
              className="input-focus-ring bg-background/50 h-10 text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditUsd(true)}
              className="w-full h-10 px-3 rounded-md border border-border/60 bg-background/60 text-left text-sm hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-foreground">{formatUsdPerEur(usdPerEurRate)}</span>
                <span className="text-muted-foreground text-[11px] ml-2">per €1</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {lastValidRates && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/30 mt-2">
          <p className="text-[11px] text-destructive">Restore last successful rates?</p>
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
