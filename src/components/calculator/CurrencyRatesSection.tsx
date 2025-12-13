import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Coins } from "lucide-react";
import type { Language } from "@/types/language";

interface CurrencyRatesSectionProps {
  language: Language;
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

const copy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    krwLabel: string;
    usdLabel: string;
    perDollar: string;
    perEuro: string;
    refresh: string;
    loading: string;
    restore: string;
    restoreButton: string;
    lastUpdated: string;
    noData: string;
  }
> = {
  en: {
    title: "Exchange Rates",
    subtitle: "Tap to edit",
    krwLabel: "KRW → USD",
    usdLabel: "USD → EUR",
    perDollar: "per $1",
    perEuro: "per €1",
    refresh: "Refresh",
    loading: "Loading...",
    restore: "Restore last successful rates?",
    restoreButton: "Revert",
    lastUpdated: "Last updated:",
    noData: "No data",
  },
  ru: {
    title: "Курсы валют",
    subtitle: "Нажмите, чтобы изменить",
    krwLabel: "KRW → USD",
    usdLabel: "USD → EUR",
    perDollar: "за $1",
    perEuro: "за €1",
    refresh: "Обновить",
    loading: "Обновляем...",
    restore: "Восстановить последний успешный курс?",
    restoreButton: "Вернуть",
    lastUpdated: "Последнее обновление:",
    noData: "Нет данных",
  },
};

export const CurrencyRatesSection = ({
  language,
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
  const t = copy[language];
  const [editKrw, setEditKrw] = useState(false);
  const [editUsd, setEditUsd] = useState(false);
  const [usdPerEurInput, setUsdPerEurInput] = useState(() =>
    Number.isFinite(usdPerEurRate) && usdPerEurRate > 0 ? usdPerEurRate.toFixed(4).replace(".", ",") : "",
  );

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
    ? new Date(lastUpdatedAt).toLocaleString(language === "ru" ? "ru-RU" : "en-US")
    : t.noData;

  const normalizeUsdInput = (value: string) => {
    const withComma = value.replace(/\./g, ",");
    const hadComma = withComma.includes(",");
    const [integer, ...rest] = withComma.split(",");
    const normalizedInteger = integer.replace(/[^\d]/g, "");
    const normalizedDecimal = rest.join("").replace(/[^\d]/g, "");
    if (!normalizedInteger && !normalizedDecimal) return hadComma ? "0," : "";
    const intPart = normalizedInteger || "0";
    if (normalizedDecimal) {
      return `${intPart},${normalizedDecimal}`;
    }
    return hadComma ? `${intPart},` : intPart;
  };

  const handleUsdRateChange = (value: string) => {
    const normalized = normalizeUsdInput(value);
    setUsdPerEurInput(normalized);
    const parsed = Number(normalized.replace(",", "."));
    setUsdPerEurRate(Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
  };

  useEffect(() => {
    if (editUsd) return;
    setUsdPerEurInput(
      Number.isFinite(usdPerEurRate) && usdPerEurRate > 0
        ? usdPerEurRate.toFixed(4).replace(".", ",")
        : "",
    );
  }, [editUsd, usdPerEurRate]);

  return (
    <Card className="p-3 shadow-card transition-smooth hover:shadow-hover animate-fade-in glass-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Coins className="w-4 h-4 text-primary/90" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>
            <p className="text-[11px] text-muted-foreground">{t.subtitle}</p>
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
              {isLoadingRates ? t.loading : t.refresh}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <Label className="text-[11px] text-muted-foreground block mb-1">{t.krwLabel}</Label>
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
              onFocus={(e) => e.target.select()}
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
                <span className="text-muted-foreground text-[11px] ml-2">{t.perDollar}</span>
              </div>
            </button>
          )}
        </div>

        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
          <Label className="text-[11px] text-muted-foreground block mb-1">{t.usdLabel}</Label>
          {editUsd ? (
            <Input
              autoFocus
              id="usdPerEur"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={usdPerEurInput}
              onChange={(e) => handleUsdRateChange(e.target.value)}
              onBlur={() => setEditUsd(false)}
              onFocus={(e) => e.target.select()}
              placeholder="1,0700"
              className="input-focus-ring bg-background/50 h-10 text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setUsdPerEurInput(
                  Number.isFinite(usdPerEurRate) && usdPerEurRate > 0
                    ? usdPerEurRate.toFixed(4).replace(".", ",")
                    : "",
                );
                setEditUsd(true);
              }}
              className="w-full h-10 px-3 rounded-md border border-border/60 bg-background/60 text-left text-sm hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-foreground">{formatUsdPerEur(usdPerEurRate)}</span>
                <span className="text-muted-foreground text-[11px] ml-2">{t.perEuro}</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {lastValidRates && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/30 mt-2">
          <p className="text-[11px] text-destructive">{t.restore}</p>
          <Button size="sm" variant="outline" onClick={onRevertToLastValid}>
            {t.restoreButton}
          </Button>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-2">
        {t.lastUpdated} {updatedLabel}
      </p>
    </Card>
  );
};
