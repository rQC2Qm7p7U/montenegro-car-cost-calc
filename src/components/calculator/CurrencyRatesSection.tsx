import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";

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
  return (
    <Card className="p-6 shadow-card transition-smooth hover:shadow-hover animate-fade-in">
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
            onClick={onRefreshRates}
            disabled={isLoadingRates}
            className="hover-scale"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRates ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Label htmlFor="krwToEur" className="text-sm font-medium">
              KRW → EUR Rate
            </Label>
            <Input
              id="krwToEur"
              type="number"
              step="0.000001"
              value={krwToEurRate}
              onChange={(e) => setKrwToEurRate(Number(e.target.value))}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              1 EUR = {(1 / krwToEurRate).toFixed(2)} KRW
            </p>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Label htmlFor="usdToEur" className="text-sm font-medium">
              USD → EUR Rate
            </Label>
            <Input
              id="usdToEur"
              type="number"
              step="0.01"
              value={usdToEurRate}
              onChange={(e) => setUsdToEurRate(Number(e.target.value))}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              1 USD = {usdToEurRate.toFixed(4)} EUR
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
