import { useEffect, type MutableRefObject } from "react";
import { FX_VALID_RANGES } from "@/utils/currency";
import type { CalculatorState } from "./state";
import { useExchangeRates } from "./useExchangeRates";
import type { FxCopy } from "./useExchangeRates";

interface UseFxControllerProps {
  autoUpdateFX: boolean;
  lastValidRates: CalculatorState["lastValidRates"];
  language: "en" | "ru";
  copy: FxCopy;
  applyRates: (krwPerUsdRate: number, usdPerEurRate: number) => void;
  setLastValidRates: (value: CalculatorState["lastValidRates"]) => void;
  setLastUpdatedAt: (value: number | null) => void;
  toast: (opts: { title: string; description: string; variant?: "default" | "destructive" }) => void;
  krwPerUsdRate: number;
  usdPerEurRate: number;
  hasMountedRef: MutableRefObject<boolean>;
}

export const useFxController = ({
  autoUpdateFX,
  lastValidRates,
  language,
  copy,
  applyRates,
  setLastValidRates,
  setLastUpdatedAt,
  toast,
  krwPerUsdRate,
  usdPerEurRate,
  hasMountedRef,
}: UseFxControllerProps) => {
  const exchange = useExchangeRates({
    autoUpdateFX,
    lastValidRates,
    language,
    copy,
    applyRates,
    setLastValidRates,
    setLastUpdatedAt,
    toast,
  });

  const { fxUpdateSourceRef, setFxSource } = exchange;

  useEffect(() => {
    if (!hasMountedRef.current) return;
    const krwValid =
      krwPerUsdRate >= FX_VALID_RANGES.krwPerUsd.min &&
      krwPerUsdRate <= FX_VALID_RANGES.krwPerUsd.max;
    const usdValid =
      usdPerEurRate >= FX_VALID_RANGES.usdPerEur.min &&
      usdPerEurRate <= FX_VALID_RANGES.usdPerEur.max;

    if (krwValid && usdValid) {
      const source = fxUpdateSourceRef.current;
      if (source !== "none") {
        setFxSource(
          source === "fallback"
            ? "fallback"
            : source === "live"
            ? "live"
            : "restored",
        );
        fxUpdateSourceRef.current = "none";
      } else {
        setFxSource("manual");
      }

      setLastValidRates({
        krwPerUsd: krwPerUsdRate,
        usdPerEur: usdPerEurRate,
      });
    }
  }, [
    fxUpdateSourceRef,
    hasMountedRef,
    krwPerUsdRate,
    setFxSource,
    setLastValidRates,
    usdPerEurRate,
  ]);

  return exchange;
};
