import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import type { SetStateAction } from "react";
import { Ship, Calculator as CalcIcon, X, Share2, RefreshCcw, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "./ThemeToggle";
import { fetchExchangeRates, FX_VALID_RANGES } from "@/utils/currency";
import { useCarImportCalculations } from "@/hooks/useCarImportCalculations";
import { useCalculatorPersistence } from "@/hooks/useCalculatorPersistence";
import { CurrencyRatesSection } from "./calculator/CurrencyRatesSection";
import { VehicleDetailsSection } from "./calculator/VehicleDetailsSection";
import { CarPricesSection } from "./calculator/CarPricesSection";
import { ResultsBottomSheet } from "./calculator/ResultsBottomSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottomSheet, BottomSheetBody, BottomSheetHeader } from "@/components/ui/bottom-sheet";

const PERSIST_KEY = "car-import-state-v1";
const FX_LAST_SUCCESS_KEY = "car-import-last-fx-v1";
const FX_REFRESH_MS = 10 * 60 * 1000; // 10 minutes

const DEFAULTS = {
  customsDuty: 5,
  vat: 21,
  translationPages: 3,
  homologationFee: 250,
  miscellaneous: 0,
};

const getContainerMaxCars = (containerType: "20ft" | "40ft") =>
  containerType === "20ft" ? 2 : 4;
const SPEDITOR_FEE = 150 * 1.21;

type InitialState = {
  carPrices: number[];
  krwPerUsdRate: number;
  usdPerEurRate: number;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: "20ft" | "40ft";
  autoUpdateFX: boolean;
  lastValidRates: { krwPerUsd: number; usdPerEur: number } | null;
  lastUpdatedAt: number | null;
};

const readInitialState = (): InitialState => {
  try {
    const params = new URLSearchParams(window.location.search);
    const storedRaw = localStorage.getItem(PERSIST_KEY);
    const stored = storedRaw ? JSON.parse(storedRaw) : {};
    const storedFX = localStorage.getItem(FX_LAST_SUCCESS_KEY);
    const lastFx = storedFX ? JSON.parse(storedFX) : null;

    const parseNumber = (value: unknown, fallback: number) => {
      if (value === null || value === undefined || value === "") return fallback;
      const num = Number(value);
      return Number.isFinite(num) ? num : fallback;
    };

    const parseBool = (value: unknown, fallback: boolean) => {
      if (value === "true" || value === true) return true;
      if (value === "false" || value === false) return false;
      return fallback;
    };

    const parseArray = (value: unknown) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return value.split(",");
      return [];
    };

    const deriveLegacyRates = (krwToEur: number, usdToEur: number) => {
      if (!krwToEur || !usdToEur || krwToEur <= 0 || usdToEur <= 0) return null;
      const krwPerEur = 1 / krwToEur;
      const usdPerEur = 1 / usdToEur;
      const krwPerUsd = krwPerEur / usdPerEur;
      return Number.isFinite(krwPerUsd) && Number.isFinite(usdPerEur)
        ? { krwPerUsd, usdPerEur }
        : null;
    };

    const urlState = {
      carPrices: params.get("carPrices"),
      krwPerUsdRate: params.get("krwPerUsdRate"),
      usdPerEurRate: params.get("usdPerEurRate"),
      customsDuty: params.get("customsDuty"),
      vat: params.get("vat"),
      translationPages: params.get("translationPages"),
      homologationFee: params.get("homologationFee"),
      miscellaneous: params.get("miscellaneous"),
      scenario: params.get("scenario"),
      numberOfCars: params.get("numberOfCars"),
      containerType: params.get("containerType"),
      autoUpdateFX: params.get("autoUpdateFX"),
    };

    const merged = { ...stored, ...urlState };
    const resolvedContainer =
      merged.containerType === "20ft" || merged.containerType === "40ft"
        ? merged.containerType
        : "40ft";
    const resolvedNumberOfCars = Math.min(
      getContainerMaxCars(resolvedContainer),
      Math.max(1, parseNumber(merged.numberOfCars, 1)),
    );

    const parsedCarPrices = parseArray(
      merged.carPrices ?? merged.carPrices === 0 ? merged.carPrices : undefined,
    )
      .map((price) => Math.max(0, parseNumber(price, 0)))
      .slice(0, resolvedNumberOfCars);

    const normalizedCarPrices =
      parsedCarPrices.length > 0
        ? Array.from({ length: resolvedNumberOfCars }, (_, index) => parsedCarPrices[index] ?? 0)
        : Array.from({ length: resolvedNumberOfCars }, () => 0);

    const legacyStoredRates = deriveLegacyRates(
      parseNumber(
        (merged as Record<string, unknown>).krwToEurRate ?? params.get("krwToEurRate"),
        NaN,
      ),
      parseNumber(
        (merged as Record<string, unknown>).usdToEurRate ?? params.get("usdToEurRate"),
        NaN,
      ),
    );

    const lastValidRates =
      lastFx && Number.isFinite(lastFx.krwPerUsd) && Number.isFinite(lastFx.usdPerEur)
        ? { krwPerUsd: lastFx.krwPerUsd, usdPerEur: lastFx.usdPerEur }
        : deriveLegacyRates(lastFx?.krwToEur, lastFx?.usdToEur);

    return {
      carPrices: normalizedCarPrices,
      krwPerUsdRate: parseNumber(
        merged.krwPerUsdRate ?? legacyStoredRates?.krwPerUsd,
        1350,
      ),
      usdPerEurRate: parseNumber(
        merged.usdPerEurRate ?? legacyStoredRates?.usdPerEur,
        1.08,
      ),
      customsDuty: parseNumber(merged.customsDuty, DEFAULTS.customsDuty),
      vat: parseNumber(merged.vat, DEFAULTS.vat),
      translationPages: Math.max(0, parseNumber(merged.translationPages, DEFAULTS.translationPages)),
      homologationFee: Math.max(0, parseNumber(merged.homologationFee, DEFAULTS.homologationFee)),
      miscellaneous: Math.max(0, parseNumber(merged.miscellaneous, DEFAULTS.miscellaneous)),
      scenario: merged.scenario === "company" ? "company" : "physical",
      numberOfCars: resolvedNumberOfCars,
      containerType: resolvedContainer,
      autoUpdateFX: parseBool(merged.autoUpdateFX, false),
      lastValidRates,
      lastUpdatedAt: Number.isFinite(lastFx?.fetchedAt) ? lastFx?.fetchedAt : null,
    };
  } catch (error) {
    console.warn("Failed to hydrate calculator state", error);
  }

  return {
    carPrices: [0],
    krwPerUsdRate: 1350,
    usdPerEurRate: 1.08,
    customsDuty: DEFAULTS.customsDuty,
    vat: DEFAULTS.vat,
    translationPages: DEFAULTS.translationPages,
    homologationFee: DEFAULTS.homologationFee,
    miscellaneous: DEFAULTS.miscellaneous,
    scenario: "physical",
    numberOfCars: 1,
    containerType: "40ft",
    autoUpdateFX: false,
    lastValidRates: null,
    lastUpdatedAt: null,
  };
};

type CalculatorState = {
  carPrices: number[];
  krwPerUsdRate: number;
  usdPerEurRate: number;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: "20ft" | "40ft";
  autoUpdateFX: boolean;
  lastValidRates: { krwPerUsd: number; usdPerEur: number } | null;
  lastUpdatedAt: number | null;
};

type Action =
  | { type: "setCarPrices"; value: number[] }
  | { type: "setCarPricesWithUpdater"; updater: SetStateAction<number[]> }
  | { type: "updateCarPrice"; index: number; value: number }
  | { type: "setNumberOfCars"; value: number }
  | { type: "setScenario"; value: "physical" | "company" }
  | { type: "setContainerType"; value: "20ft" | "40ft" }
  | { type: "setCustomsDuty"; value: number }
  | { type: "setVat"; value: number }
  | { type: "setTranslationPages"; value: number }
  | { type: "setHomologationFee"; value: number }
  | { type: "setMiscellaneous"; value: number }
  | { type: "setAutoUpdateFX"; value: boolean }
  | { type: "setRates"; krwPerUsdRate?: number; usdPerEurRate?: number }
  | { type: "setLastValidRates"; value: CalculatorState["lastValidRates"] }
  | { type: "setLastUpdatedAt"; value: number | null }
  | { type: "reset"; value: CalculatorState };

const clampCars = (value: number, containerType: "20ft" | "40ft") =>
  Math.min(getContainerMaxCars(containerType), Math.max(1, value));

const ensureCarPriceLength = (
  prices: number[],
  numberOfCars: number,
  containerType: "20ft" | "40ft",
) => {
  const target = clampCars(numberOfCars, containerType);
  const sanitized = prices
    .slice(0, target)
    .map((price) => (!Number.isFinite(price) || price < 0 ? 0 : price));

  if (sanitized.length < target) {
    return [...sanitized, ...Array(target - sanitized.length).fill(0)];
  }
  return sanitized;
};

const calculatorReducer = (state: CalculatorState, action: Action): CalculatorState => {
  switch (action.type) {
    case "setCarPrices":
      return {
        ...state,
        carPrices: ensureCarPriceLength(action.value, state.numberOfCars, state.containerType),
      };
    case "setCarPricesWithUpdater": {
      const nextValue =
        typeof action.updater === "function" ? action.updater(state.carPrices) : action.updater;
      return {
        ...state,
        carPrices: ensureCarPriceLength(nextValue, state.numberOfCars, state.containerType),
      };
    }
    case "updateCarPrice": {
      const next = ensureCarPriceLength(
        [...state.carPrices],
        state.numberOfCars,
        state.containerType,
      );
      next[action.index] = !Number.isFinite(action.value) || action.value < 0 ? 0 : action.value;
      return { ...state, carPrices: next };
    }
    case "setNumberOfCars": {
      const nextCount = clampCars(action.value, state.containerType);
      const base = state.carPrices.slice(0, nextCount);
      const nextPrices = ensureCarPriceLength(base, nextCount, state.containerType);
      return {
        ...state,
        numberOfCars: nextCount,
        carPrices: nextPrices,
      };
    }
    case "setScenario":
      return { ...state, scenario: action.value };
    case "setContainerType": {
      const nextCount = clampCars(state.numberOfCars, action.value);
      const base = state.carPrices.slice(0, nextCount);
      return {
        ...state,
        containerType: action.value,
        numberOfCars: nextCount,
        carPrices: ensureCarPriceLength(base, nextCount, action.value),
      };
    }
    case "setCustomsDuty":
      return { ...state, customsDuty: action.value };
    case "setVat":
      return { ...state, vat: action.value };
    case "setTranslationPages":
      return { ...state, translationPages: action.value };
    case "setHomologationFee":
      return { ...state, homologationFee: action.value };
    case "setMiscellaneous":
      return { ...state, miscellaneous: action.value };
    case "setAutoUpdateFX":
      return { ...state, autoUpdateFX: action.value };
    case "setRates":
      return {
        ...state,
        krwPerUsdRate: action.krwPerUsdRate ?? state.krwPerUsdRate,
        usdPerEurRate: action.usdPerEurRate ?? state.usdPerEurRate,
      };
    case "setLastValidRates":
      return { ...state, lastValidRates: action.value };
    case "setLastUpdatedAt":
      return { ...state, lastUpdatedAt: action.value };
    case "reset":
      return { ...action.value };
    default:
      return state;
  }
};

const Calculator = () => {
  const { toast } = useToast();
  const initialStateRef = useRef<InitialState | null>(null);
  if (!initialStateRef.current) {
    initialStateRef.current = readInitialState();
  }
  const initialState = initialStateRef.current;

  const isMountedRef = useRef(true);
  const hasMountedRef = useRef(false);
  const fetchInFlightRef = useRef(false);
  const [isResultsOpenState, setIsResultsOpenState] = useState(false);
  const isResultsOpenRef = useRef(false);
  const formChangeRef = useRef(false);
  const initialRatesFetchedRef = useRef(false);

  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const {
    carPrices,
    krwPerUsdRate,
    usdPerEurRate,
    autoUpdateFX,
    customsDuty,
    vat,
    translationPages,
    homologationFee,
    miscellaneous,
    scenario,
    numberOfCars,
    containerType,
    lastValidRates,
    lastUpdatedAt,
  } = state;
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const initialFxSource: "live" | "fallback" | "manual" | "restored" =
    initialState.lastValidRates ? "restored" : "fallback";
  const [fxSource, setFxSource] = useState<"live" | "fallback" | "manual" | "restored">(initialFxSource);
  const fxUpdateSourceRef = useRef<"none" | "live" | "fallback" | "restored">(initialFxSource);

  // Other costs and toggles handled in reducer above
  const [isRatesSheetOpen, setIsRatesSheetOpen] = useState(false);
  const ratesSheetTouchStart = useRef<number | null>(null);

  const setIsResultsOpen = useCallback((open: boolean) => {
    isResultsOpenRef.current = open;
    setIsResultsOpenState(open);
  }, []);
  const isResultsOpen = isResultsOpenState;

  const markFormChanged = useCallback(() => {
    formChangeRef.current = true;
    if (isResultsOpenRef.current) {
      setIsResultsOpen(false);
    }
  }, [setIsResultsOpen]);

  const dispatchTracked = useCallback(
    (action: Action, options?: { skipDirty?: boolean }) => {
      if (!options?.skipDirty) {
        markFormChanged();
      }
      dispatch(action);
    },
    [dispatch, markFormChanged],
  );

  const setCarPricesTracked = useCallback(
    (updater: SetStateAction<number[]>, options?: { skipDirty?: boolean }) => {
      dispatchTracked({ type: "setCarPricesWithUpdater", updater }, options);
    },
    [dispatchTracked],
  );

  const setKrwPerUsdRateTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(krwPerUsdRate) : updater;
      dispatchTracked({ type: "setRates", krwPerUsdRate: next });
    },
    [dispatchTracked, krwPerUsdRate],
  );

  const setUsdPerEurRateTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(usdPerEurRate) : updater;
      dispatchTracked({ type: "setRates", usdPerEurRate: next });
    },
    [dispatchTracked, usdPerEurRate],
  );

  const setCustomsDutyTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(customsDuty) : updater;
      dispatchTracked({ type: "setCustomsDuty", value: next });
    },
    [customsDuty, dispatchTracked],
  );

  const setVatTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(vat) : updater;
      dispatchTracked({ type: "setVat", value: next });
    },
    [dispatchTracked, vat],
  );

  const setTranslationPagesTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(translationPages) : updater;
      dispatchTracked({ type: "setTranslationPages", value: next });
    },
    [dispatchTracked, translationPages],
  );

  const setHomologationFeeTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(homologationFee) : updater;
      dispatchTracked({ type: "setHomologationFee", value: next });
    },
    [dispatchTracked, homologationFee],
  );

  const setMiscellaneousTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(miscellaneous) : updater;
      dispatchTracked({ type: "setMiscellaneous", value: next });
    },
    [dispatchTracked, miscellaneous],
  );

  const setScenarioTracked = useCallback(
    (next: "physical" | "company") => {
      dispatchTracked({ type: "setScenario", value: next });
    },
    [dispatchTracked],
  );

  const setNumberOfCarsTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(numberOfCars) : updater;
      dispatchTracked({ type: "setNumberOfCars", value: next });
    },
    [dispatchTracked, numberOfCars],
  );

  const setContainerTypeTracked = useCallback(
    (next: "20ft" | "40ft") => {
      dispatchTracked({ type: "setContainerType", value: next });
    },
    [dispatchTracked],
  );

  const setAutoUpdateFXTracked = useCallback(
    (updater: SetStateAction<boolean>) => {
      const next = typeof updater === "function" ? updater(autoUpdateFX) : updater;
      dispatchTracked({ type: "setAutoUpdateFX", value: next });
    },
    [autoUpdateFX, dispatchTracked],
  );

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
  );

  // Persist state to localStorage and URL
  useCalculatorPersistence({
    persistKey: PERSIST_KEY,
    hasMountedRef,
    state: {
      carPrices,
      krwPerUsdRate,
      usdPerEurRate,
      customsDuty,
      vat,
      translationPages,
      homologationFee,
      miscellaneous,
      scenario,
      numberOfCars,
      containerType,
      autoUpdateFX,
    },
  });

  const setLastValidRatesState = useCallback(
    (value: CalculatorState["lastValidRates"]) => {
      dispatch({ type: "setLastValidRates", value });
    },
    [dispatch],
  );

  const setLastUpdatedAtState = useCallback(
    (value: number | null) => {
      dispatch({ type: "setLastUpdatedAt", value });
    },
    [dispatch],
  );

  const usdToEurRate = usdPerEurRate > 0 ? 1 / usdPerEurRate : 0;

  // Calculate all results using custom hook
  const results = useCarImportCalculations({
    carPrices,
    usdToEurRate,
    customsDuty,
    vat,
    translationPages,
    homologationFee,
    miscellaneous,
    scenario,
    numberOfCars,
    containerType,
    speditorFee: SPEDITOR_FEE,
  });

  // Fetch exchange rates
  const handleFetchRates = useCallback(async () => {
    if (fetchInFlightRef.current || !isMountedRef.current) return;
    fetchInFlightRef.current = true;
    setIsLoadingRates(true);
    try {
      const rates = await fetchExchangeRates();
      fxUpdateSourceRef.current = rates.isFallback ? "fallback" : "live";
      if (!isMountedRef.current) return;
      dispatchTracked(
        { type: "setRates", krwPerUsdRate: rates.krwPerUsd, usdPerEurRate: rates.usdPerEur },
        { skipDirty: true },
      );
      if (!rates.isFallback) {
        setLastValidRatesState({ krwPerUsd: rates.krwPerUsd, usdPerEur: rates.usdPerEur });
        const fetchedAt = rates.fetchedAt || Date.now();
        setLastUpdatedAtState(fetchedAt);
        localStorage.setItem(
          FX_LAST_SUCCESS_KEY,
          JSON.stringify({
            krwPerUsd: rates.krwPerUsd,
            usdPerEur: rates.usdPerEur,
            fetchedAt,
          }),
        );
      }

      setFxSource(rates.isFallback ? "fallback" : "live");

      toast({
        title: rates.isFallback ? "Using fallback rates" : "Rates updated",
        description: rates.isFallback
          ? "Live rates were unavailable or invalid; using safe defaults."
          : `$1 = ${Math.round(rates.krwPerUsd).toLocaleString("en-US")} KRW | €1 = $${rates.usdPerEur.toFixed(4)}`,
        variant: rates.isFallback ? "destructive" : "default",
      });
    } finally {
      fetchInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsLoadingRates(false);
      }
    }
  }, [dispatchTracked, setLastUpdatedAtState, setLastValidRatesState, toast]);

  // Fetch latest exchange rates on initial load
  useEffect(() => {
    if (initialRatesFetchedRef.current) return;
    initialRatesFetchedRef.current = true;
    handleFetchRates();
  }, [handleFetchRates]);

  // Auto-update exchange rates when toggle is enabled
  useEffect(() => {
    if (autoUpdateFX) {
      handleFetchRates();
    }
  }, [autoUpdateFX, handleFetchRates]);

  // Auto-refresh rates on an interval when enabled
  useEffect(() => {
    if (!autoUpdateFX) return;
    const id = setInterval(() => {
      handleFetchRates();
    }, FX_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoUpdateFX, handleFetchRates]);

  // Track last valid rates from manual edits within acceptable ranges
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
        setFxSource(source === "fallback" ? "fallback" : source === "live" ? "live" : "restored");
        fxUpdateSourceRef.current = "none";
      } else {
        setFxSource("manual");
      }

      setLastValidRatesState({ krwPerUsd: krwPerUsdRate, usdPerEur: usdPerEurRate });
    }
  }, [krwPerUsdRate, setLastValidRatesState, usdPerEurRate]);

  // Check if all car prices are filled
  const completedCars = carPrices.filter(p => p > 0).length;
  const allPricesFilled = completedCars === numberOfCars;

  // Handle calculate button click
  const handleCalculate = () => {
    formChangeRef.current = false;
    setIsResultsOpen(true);
  };

  // Handle recalculate (close modal to edit)
  const handleRecalculate = () => {
    setIsResultsOpen(false);
  };

  const handleRatesTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    ratesSheetTouchStart.current = e.touches[0]?.clientX ?? null;
  };

  const handleRatesTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (ratesSheetTouchStart.current === null) return;
    const deltaX = (e.changedTouches[0]?.clientX ?? 0) - ratesSheetTouchStart.current;
    if (deltaX < -40) setIsRatesSheetOpen(false);
    ratesSheetTouchStart.current = null;
  };

  const handleCopyShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Share this configured calculator.",
      });
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast({
        title: "Link copied",
        description: "Clipboard access was limited; used fallback copy.",
      });
    }
  };

  const renderFxUpdatedLabel = () => {
    if (!lastUpdatedAt) return "Not updated yet";
    const diffMs = Date.now() - lastUpdatedAt;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes <= 0) return "Just now";
    if (minutes === 1) return "Updated 1 min ago";
    return `Updated ${minutes} min ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Compact Header */}
          <header className="animate-fade-in mb-4">
            {/* Top row: Logo + Title + Actions */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                <Ship className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground leading-tight break-words">
                  Car Import Calculator
                </h1>
                <p className="text-xs text-muted-foreground">Korea → Montenegro</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleCopyShareLink}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <ThemeToggle />
              </div>
            </div>

            {/* Rates bar - inline compact */}
            <button
              type="button"
              onClick={() => setIsRatesSheetOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">$1</span>
                  <span className="font-medium text-foreground">
                    = ₩{Math.round(krwPerUsdRate).toLocaleString("en-US")}
                  </span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">€1</span>
                  <span className="font-medium text-foreground">
                    = ${usdPerEurRate.toLocaleString("en-US", {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {fxSource === "fallback" && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <RefreshCcw 
                  className={`w-3.5 h-3.5 ${isLoadingRates ? "animate-spin" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFetchRates();
                  }}
                />
              </div>
            </button>
          </header>

          {/* Input Form - Single column layout */}
          <div className="space-y-5">
            <VehicleDetailsSection
              scenario={scenario}
              setScenario={setScenarioTracked}
              numberOfCars={numberOfCars}
              setNumberOfCars={setNumberOfCarsTracked}
              containerType={containerType}
              setContainerType={setContainerTypeTracked}
              freightPerCar={results.freightPerCar}
              freightPerContainerEUR={results.freightPerContainerEUR}
              customsDuty={customsDuty}
              setCustomsDuty={setCustomsDutyTracked}
              vat={vat}
              setVat={setVatTracked}
              speditorFee={results.speditorFee}
              homologationFee={homologationFee}
              setHomologationFee={setHomologationFeeTracked}
              translationPages={translationPages}
              setTranslationPages={setTranslationPagesTracked}
              translationPerCar={results.translationPerCar}
              portAgentFeePerCar={results.portAgentFeePerCar}
              miscellaneous={miscellaneous}
              setMiscellaneous={setMiscellaneousTracked}
            />

            <CarPricesSection
              numberOfCars={numberOfCars}
              carPrices={carPrices}
              setCarPrices={setCarPricesTracked}
              krwPerUsdRate={krwPerUsdRate}
              usdPerEurRate={usdPerEurRate}
              results={results}
            />

            {/* Calculate Button */}
            <Button
              onClick={handleCalculate}
              disabled={!allPricesFilled}
              className="
                w-full h-14 mt-2 rounded-xl
                shadow-lg shadow-primary/20
                bg-gradient-to-r from-primary to-primary/80
                hover:from-primary/90 hover:to-primary/70
                hover:shadow-primary/30 hover:shadow-xl
                active:scale-[0.98]
                transition-all duration-200 ease-out
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-3
                text-primary-foreground font-semibold text-base
              "
            >
              <CalcIcon className="w-5 h-5" />
              <span>
                {allPricesFilled ? 'Calculate' : `Enter ${numberOfCars - completedCars} more price${numberOfCars - completedCars > 1 ? 's' : ''}`}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Bottom Sheet */}
      <ResultsBottomSheet
        open={isResultsOpen}
        onOpenChange={setIsResultsOpen}
        results={results}
        numberOfCars={numberOfCars}
        scenario={scenario}
        customsDuty={customsDuty}
        vat={vat}
        krwPerUsdRate={krwPerUsdRate}
        usdPerEurRate={usdPerEurRate}
        containerType={containerType}
        onRecalculate={handleRecalculate}
        onScenarioChange={setScenarioTracked}
      />

      <BottomSheet open={isRatesSheetOpen} onOpenChange={setIsRatesSheetOpen}>
        <BottomSheetHeader className="flex items-center justify-between pb-3">
          <div>
            <p className="text-xs text-muted-foreground">Exchange Rates</p>
            <h3 className="text-lg font-semibold text-foreground">KRW → USD & USD ↔ EUR</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsRatesSheetOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </BottomSheetHeader>
        <BottomSheetBody className="pt-2">
          <div onTouchStart={handleRatesTouchStart} onTouchEnd={handleRatesTouchEnd}>
            <CurrencyRatesSection
              autoUpdateFX={autoUpdateFX}
              setAutoUpdateFX={setAutoUpdateFXTracked}
              isLoadingRates={isLoadingRates}
              onRefreshRates={handleFetchRates}
              krwPerUsdRate={krwPerUsdRate}
              setKrwPerUsdRate={setKrwPerUsdRateTracked}
              usdPerEurRate={usdPerEurRate}
              setUsdPerEurRate={setUsdPerEurRateTracked}
              lastUpdatedAt={lastUpdatedAt}
              lastValidRates={lastValidRates}
              onRevertToLastValid={() => {
                if (lastValidRates) {
                  fxUpdateSourceRef.current = "restored";
                  setKrwPerUsdRateTracked(lastValidRates.krwPerUsd);
                  setUsdPerEurRateTracked(lastValidRates.usdPerEur);
                }
              }}
            />
          </div>
        </BottomSheetBody>
      </BottomSheet>
    </div>
  );
};

export default Calculator;
