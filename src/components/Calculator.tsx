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

type InitialState = {
  carPrices: number[];
  krwToEurRate: number;
  usdToEurRate: number;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: "20ft" | "40ft";
  autoUpdateFX: boolean;
  lastValidRates: { krwToEur: number; usdToEur: number } | null;
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

    const urlState = {
      carPrices: params.get("carPrices"),
      krwToEurRate: params.get("krwToEurRate"),
      usdToEurRate: params.get("usdToEurRate"),
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

    const lastValidRates =
      lastFx && Number.isFinite(lastFx.krwToEur) && Number.isFinite(lastFx.usdToEur)
        ? { krwToEur: lastFx.krwToEur, usdToEur: lastFx.usdToEur }
        : null;

    return {
      carPrices: normalizedCarPrices,
      krwToEurRate: parseNumber(merged.krwToEurRate, 0.00068),
      usdToEurRate: parseNumber(merged.usdToEurRate, 0.93),
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
    krwToEurRate: 0.00068,
    usdToEurRate: 0.93,
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
  krwToEurRate: number;
  usdToEurRate: number;
  customsDuty: number;
  vat: number;
  translationPages: number;
  homologationFee: number;
  miscellaneous: number;
  scenario: "physical" | "company";
  numberOfCars: number;
  containerType: "20ft" | "40ft";
  autoUpdateFX: boolean;
  lastValidRates: { krwToEur: number; usdToEur: number } | null;
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
  | { type: "setRates"; krwToEurRate?: number; usdToEurRate?: number }
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
      const nextPrices = ensureCarPriceLength(state.carPrices, nextCount, state.containerType);
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
      return {
        ...state,
        containerType: action.value,
        numberOfCars: nextCount,
        carPrices: ensureCarPriceLength(state.carPrices, nextCount, action.value),
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
        krwToEurRate: action.krwToEurRate ?? state.krwToEurRate,
        usdToEurRate: action.usdToEurRate ?? state.usdToEurRate,
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
    krwToEurRate,
    usdToEurRate,
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
    (updater: SetStateAction<number[]>) => {
      dispatchTracked({ type: "setCarPricesWithUpdater", updater });
    },
    [dispatchTracked],
  );

  const setKrwToEurRateTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(krwToEurRate) : updater;
      dispatchTracked({ type: "setRates", krwToEurRate: next });
    },
    [dispatchTracked, krwToEurRate],
  );

  const setUsdToEurRateTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(usdToEurRate) : updater;
      dispatchTracked({ type: "setRates", usdToEurRate: next });
    },
    [dispatchTracked, usdToEurRate],
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
      krwToEurRate,
      usdToEurRate,
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
        { type: "setRates", krwToEurRate: rates.krwToEur, usdToEurRate: rates.usdToEur },
        { skipDirty: true },
      );
      if (!rates.isFallback) {
        setLastValidRatesState({ krwToEur: rates.krwToEur, usdToEur: rates.usdToEur });
        const fetchedAt = rates.fetchedAt || Date.now();
        setLastUpdatedAtState(fetchedAt);
        localStorage.setItem(
          FX_LAST_SUCCESS_KEY,
          JSON.stringify({
            krwToEur: rates.krwToEur,
            usdToEur: rates.usdToEur,
            fetchedAt,
          }),
        );
      }

      setFxSource(rates.isFallback ? "fallback" : "live");

      toast({
        title: rates.isFallback ? "Using fallback rates" : "Rates updated",
        description: rates.isFallback
          ? "Live rates were unavailable or invalid; using safe defaults."
          : `1 EUR = ${(1 / rates.krwToEur).toFixed(2)} KRW | 1 USD = ${rates.usdToEur.toFixed(4)} EUR`,
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
      krwToEurRate >= FX_VALID_RANGES.krwToEur.min &&
      krwToEurRate <= FX_VALID_RANGES.krwToEur.max;
    const usdValid =
      usdToEurRate >= FX_VALID_RANGES.usdToEur.min &&
      usdToEurRate <= FX_VALID_RANGES.usdToEur.max;

    if (krwValid && usdValid) {
      const source = fxUpdateSourceRef.current;
      if (source !== "none") {
        setFxSource(source === "fallback" ? "fallback" : source === "live" ? "live" : "restored");
        fxUpdateSourceRef.current = "none";
      } else {
        setFxSource("manual");
      }

      setLastValidRatesState({ krwToEur: krwToEurRate, usdToEur: usdToEurRate });
    }
  }, [krwToEurRate, setLastValidRatesState, usdToEurRate]);

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
          {/* Header */}
          <header className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300">
                <Ship className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-10 gap-2" onClick={handleCopyShareLink}>
                  <Share2 className="w-4 h-4" />
                  Copy link
                </Button>
                <ThemeToggle />
              </div>
            </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            Montenegro Car Import
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Calculate import costs for vehicles from Korea
          </p>
            
            {/* Quick status badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Badge variant="outline" className="gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {containerType} Container
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                {numberOfCars} {numberOfCars === 1 ? 'Car' : 'Cars'}
              </Badge>
              {completedCars > 0 && (
                <Badge variant="secondary" className="gap-1.5 badge-success">
                  {completedCars}/{numberOfCars} priced
                </Badge>
              )}
            </div>

            {/* FX summary chips + freshness */}
            <div className="flex flex-col items-center gap-2 mt-2">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRatesSheetOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-sm text-foreground hover:border-primary/50 transition-colors"
                >
                  <span className="text-[11px] text-muted-foreground">1€</span>
                  ₩{(1 / krwToEurRate).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRatesSheetOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-sm text-foreground hover:border-primary/50 transition-colors"
                >
                  <span className="text-[11px] text-muted-foreground">$1</span>
                  €{usdToEurRate.toFixed(4)}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60 border border-border/60">
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">{renderFxUpdatedLabel()}</span>
                </div>
                {fxSource === "fallback" && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[11px]">Using fallback rates</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3"
                  onClick={handleFetchRates}
                  disabled={isLoadingRates}
                >
                  <RefreshCcw className={`w-4 h-4 mr-1 ${isLoadingRates ? "animate-spin" : ""}`} />
                  Retry
                </Button>
              </div>
            </div>
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
              krwToEurRate={krwToEurRate}
              results={results}
            />
          </div>
        </div>
      </div>

      {/* Sticky Calculate Button Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/50 z-40">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleCalculate}
            disabled={!allPricesFilled}
            size="lg"
            className="w-full sm:w-auto sm:min-w-[200px] sm:mx-auto sm:flex h-14 text-lg font-semibold gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <CalcIcon className="w-5 h-5" />
            {allPricesFilled ? 'Calculate' : `Enter ${numberOfCars - completedCars} more price${numberOfCars - completedCars > 1 ? 's' : ''}`}
          </Button>
          {!allPricesFilled && (
            <p className="text-center text-xs text-muted-foreground mt-2">
              Fill all car prices to calculate
            </p>
          )}
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
        krwToEurRate={krwToEurRate}
        usdToEurRate={usdToEurRate}
        containerType={containerType}
        onRecalculate={handleRecalculate}
        onScenarioChange={setScenarioTracked}
      />

      <BottomSheet open={isRatesSheetOpen} onOpenChange={setIsRatesSheetOpen}>
        <BottomSheetHeader className="flex items-center justify-between pb-3">
          <div>
            <p className="text-xs text-muted-foreground">Exchange Rates</p>
            <h3 className="text-lg font-semibold text-foreground">KRW & USD to EUR</h3>
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
              krwToEurRate={krwToEurRate}
              setKrwToEurRate={setKrwToEurRateTracked}
              usdToEurRate={usdToEurRate}
              setUsdToEurRate={setUsdToEurRateTracked}
              lastUpdatedAt={lastUpdatedAt}
              lastValidRates={lastValidRates}
              onRevertToLastValid={() => {
                if (lastValidRates) {
                  fxUpdateSourceRef.current = "restored";
                  setKrwToEurRateTracked(lastValidRates.krwToEur);
                  setUsdToEurRateTracked(lastValidRates.usdToEur);
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
