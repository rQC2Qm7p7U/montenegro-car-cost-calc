import { useCallback, useEffect, useRef, useState } from "react";
import { fetchExchangeRates, FX_VALID_RANGES } from "@/utils/currency";
import type { CalculatorState } from "./state";
import { FX_LAST_SUCCESS_KEY, FX_REFRESH_MS } from "./state";
import type { Language } from "@/types/language";

export type FxSource = "live" | "fallback" | "manual" | "restored";

interface FxCopy {
  ratesFallbackTitle: string;
  ratesUpdatedTitle: string;
  ratesFallbackDescription: string;
  ratesUpdatedDescription: (krw: number, usd: number) => string;
}

interface UseExchangeRatesProps {
  autoUpdateFX: boolean;
  lastValidRates: CalculatorState["lastValidRates"];
  language: Language;
  copy: FxCopy;
  applyRates: (krwPerUsdRate: number, usdPerEurRate: number) => void;
  setLastValidRates: (value: CalculatorState["lastValidRates"]) => void;
  setLastUpdatedAt: (value: number | null) => void;
  toast: (opts: { title: string; description: string; variant?: "default" | "destructive" }) => void;
}

export const useExchangeRates = ({
  autoUpdateFX,
  lastValidRates,
  language,
  copy,
  applyRates,
  setLastValidRates,
  setLastUpdatedAt,
  toast,
}: UseExchangeRatesProps) => {
  const isMountedRef = useRef(true);
  const fetchInFlightRef = useRef(false);
  const fxFailureCountRef = useRef(0);
  const fxRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFxSource: FxSource = lastValidRates ? "restored" : "fallback";
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [fxSource, setFxSource] = useState<FxSource>(initialFxSource);
  const fxUpdateSourceRef = useRef<"none" | "live" | "fallback" | "restored">(
    initialFxSource,
  );
  const initialRatesFetchedRef = useRef(false);

  useEffect(
    () => () => {
      isMountedRef.current = false;
      if (fxRetryTimeoutRef.current) {
        clearTimeout(fxRetryTimeoutRef.current);
      }
    },
    [],
  );

  const handleFetchRates = useCallback(async (): Promise<boolean> => {
    if (fetchInFlightRef.current || !isMountedRef.current) return false;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      fxFailureCountRef.current += 1;
      toast({
        title: copy.ratesFallbackTitle,
        description:
          language === "en"
            ? "Offline — cannot refresh rates."
            : "Нет сети — обновление курсов недоступно.",
        variant: "destructive",
      });
      return false;
    }

    fetchInFlightRef.current = true;
    setIsLoadingRates(true);
    try {
      const rates = await fetchExchangeRates();
      fxUpdateSourceRef.current = rates.isFallback ? "fallback" : "live";
      if (!isMountedRef.current) return false;

      applyRates(rates.krwPerUsd, rates.usdPerEur);
      const fetchedAt = rates.fetchedAt || Date.now();
      setLastUpdatedAt(fetchedAt);

      if (!rates.isFallback) {
        setLastValidRates({
          krwPerUsd: rates.krwPerUsd,
          usdPerEur: rates.usdPerEur,
        });
        localStorage.setItem(
          FX_LAST_SUCCESS_KEY,
          JSON.stringify({
            krwPerUsd: rates.krwPerUsd,
            usdPerEur: rates.usdPerEur,
            fetchedAt,
          }),
        );
      }

      fxFailureCountRef.current = 0;
      setFxSource(rates.isFallback ? "fallback" : "live");

      toast({
        title: rates.isFallback ? copy.ratesFallbackTitle : copy.ratesUpdatedTitle,
        description: rates.isFallback
          ? copy.ratesFallbackDescription
          : copy.ratesUpdatedDescription(rates.krwPerUsd, rates.usdPerEur),
        variant: rates.isFallback ? "destructive" : "default",
      });
      return !rates.isFallback;
    } catch (error) {
      fxFailureCountRef.current += 1;
      const message =
        language === "en"
          ? "Could not refresh rates. Check your connection and try again."
          : "Не удалось обновить курсы. Проверьте соединение и повторите попытку.";
      toast({
        title: copy.ratesFallbackTitle,
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      fetchInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsLoadingRates(false);
      }
    }
  }, [applyRates, copy, language, setLastUpdatedAt, setLastValidRates, toast]);

  useEffect(() => {
    if (initialRatesFetchedRef.current) return;
    initialRatesFetchedRef.current = true;
    if (autoUpdateFX || !lastValidRates) {
      handleFetchRates();
    }
  }, [autoUpdateFX, handleFetchRates, lastValidRates]);

  useEffect(() => {
    if (!autoUpdateFX) return;
    let cancelled = false;
    const MAX_BACKOFF_MS = 60 * 60 * 1000; // 1 hour

    const scheduleNext = (delay: number) => {
      if (cancelled) return;
      if (fxRetryTimeoutRef.current) {
        clearTimeout(fxRetryTimeoutRef.current);
      }
      fxRetryTimeoutRef.current = setTimeout(run, delay);
    };

    const run = async () => {
      if (cancelled) return;
      const success = await handleFetchRates();
      const backoffStep = Math.min(fxFailureCountRef.current, 5);
      const delay = success
        ? FX_REFRESH_MS
        : Math.min(FX_REFRESH_MS * 2 ** backoffStep, MAX_BACKOFF_MS);
      scheduleNext(delay);
    };

    run();

    return () => {
      cancelled = true;
      if (fxRetryTimeoutRef.current) {
        clearTimeout(fxRetryTimeoutRef.current);
      }
    };
  }, [autoUpdateFX, handleFetchRates]);

  // Track last valid rates from manual edits within acceptable ranges
  useEffect(() => {
    if (!lastValidRates) return;
    const krwValid =
      lastValidRates.krwPerUsd >= FX_VALID_RANGES.krwPerUsd.min &&
      lastValidRates.krwPerUsd <= FX_VALID_RANGES.krwPerUsd.max;
    const usdValid =
      lastValidRates.usdPerEur >= FX_VALID_RANGES.usdPerEur.min &&
      lastValidRates.usdPerEur <= FX_VALID_RANGES.usdPerEur.max;

    if (krwValid && usdValid && fxUpdateSourceRef.current !== "none") {
      setFxSource(
        fxUpdateSourceRef.current === "fallback"
          ? "fallback"
          : fxUpdateSourceRef.current === "live"
          ? "live"
          : "restored",
      );
      fxUpdateSourceRef.current = "none";
    }
  }, [lastValidRates]);

  return {
    fxSource,
    setFxSource,
    fxUpdateSourceRef,
    handleFetchRates,
    isLoadingRates,
  };
};
