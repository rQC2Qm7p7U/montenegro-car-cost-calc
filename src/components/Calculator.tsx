import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import type { SetStateAction } from "react";
import {
  Ship,
  Calculator as CalcIcon,
  X,
  Share2,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "./ThemeToggle";
import { fetchExchangeRates, FX_VALID_RANGES } from "@/utils/currency";
import { useCarImportCalculations } from "@/hooks/useCarImportCalculations";
import { useCalculatorPersistence } from "@/hooks/useCalculatorPersistence";
import { CurrencyRatesSection } from "./calculator/CurrencyRatesSection";
import { VehicleDetailsSection } from "./calculator/VehicleDetailsSection";
import { CarPricesSection } from "./calculator/CarPricesSection";
import { ResultsBottomSheet } from "./calculator/ResultsBottomSheet";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetHeader,
} from "@/components/ui/bottom-sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Language } from "@/types/language";

const PERSIST_KEY = "car-import-state-v1";
const FX_LAST_SUCCESS_KEY = "car-import-last-fx-v1";
const FX_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
const LANGUAGE_STORAGE_KEY = "car-import-language";

const DEFAULTS = {
  customsDuty: 5,
  vat: 21,
  translationPages: 3,
  homologationFee: 250,
  miscellaneous: 0,
};

const getContainerMaxCars = (containerType: "20ft" | "40ft") =>
  containerType === "20ft" ? 2 : 4;
const SPEDITOR_BASE_FEE = 150;
const SPEDITOR_VAT_RATE = 0.21;
const SPEDITOR_FEE = SPEDITOR_BASE_FEE * (1 + SPEDITOR_VAT_RATE);
const clampToRange = (
  value: number,
  range: { min: number; max: number },
  fallback: number
) => {
  const safe = Number.isFinite(value) ? value : fallback;
  return Math.min(range.max, Math.max(range.min, safe));
};

const calculatorCopy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    ratesSheetTitle: string;
    ratesSheetSubtitle: string;
    shareSuccessTitle: string;
    shareSuccessDescription: string;
    shareFallbackDescription: string;
    shareConfigTitle: string;
    shareConfigDescription: string;
    shareConfigWarningTitle: string;
    shareConfigWarningBody: string;
    shareConfigCopy: string;
    shareConfigCopied: string;
    ratesUpdatedTitle: string;
    ratesFallbackTitle: string;
    ratesUpdatedDescription: (krw: number, usd: number) => string;
    ratesFallbackDescription: string;
    fxStatus: {
      notUpdated: string;
      justNow: string;
      minuteAgo: string;
      minutesAgo: (minutes: number) => string;
    };
    calculateReady: string;
    calculateMissing: (remaining: number) => string;
    copyRatesLabel: string;
  }
> = {
  en: {
    title: "Car Import Calculator",
    subtitle: "Korea → Montenegro",
    ratesSheetTitle: "Exchange Rates",
    ratesSheetSubtitle: "KRW → USD & USD → EUR",
    shareSuccessTitle: "Link copied",
    shareSuccessDescription: "Share this configured calculator.",
    shareFallbackDescription:
      "Clipboard access was limited; used fallback copy.",
    shareConfigTitle: "Share configured calculator",
    shareConfigDescription: "Export current prices and rates as a safe token.",
    shareConfigWarningTitle: "Sensitive data",
    shareConfigWarningBody:
      "The token contains all prices and fees. Only share with people you trust.",
    shareConfigCopy: "Copy token",
    shareConfigCopied: "Token copied",
    ratesUpdatedTitle: "Rates updated",
    ratesFallbackTitle: "Using fallback rates",
    ratesUpdatedDescription: (krw, usd) =>
      `$1 = ${new Intl.NumberFormat("ru-RU")
        .format(Math.round(krw))
        .replace(/\u00A0/g, " ")} KRW | €1 = $${usd
        .toLocaleString("ru-RU", {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        })
        .replace(/\u00A0/g, " ")}`,
    ratesFallbackDescription:
      "Live rates were unavailable or invalid; using safe defaults.",
    fxStatus: {
      notUpdated: "Not updated yet",
      justNow: "Just now",
      minuteAgo: "Updated 1 min ago",
      minutesAgo: (minutes: number) => `Updated ${minutes} min ago`,
    },
    calculateReady: "Calculate",
    calculateMissing: (remaining: number) =>
      `Enter ${remaining} more price${remaining > 1 ? "s" : ""}`,
    copyRatesLabel: "Updated",
  },
  ru: {
    title: "Калькулятор ввоза авто",
    subtitle: "Корея → Черногория",
    ratesSheetTitle: "Курсы валют",
    ratesSheetSubtitle: "KRW → USD и USD → EUR",
    shareSuccessTitle: "Ссылка скопирована",
    shareSuccessDescription: "Поделитесь настроенным калькулятором.",
    shareFallbackDescription:
      "Доступ к буферу ограничен, скопировали альтернативным способом.",
    shareConfigTitle: "Поделиться настройками",
    shareConfigDescription: "Экспорт текущих цен и курсов в безопасный токен.",
    shareConfigWarningTitle: "Конфиденциальные данные",
    shareConfigWarningBody:
      "Токен содержит все цены и сборы. Делитесь им только с доверенными людьми.",
    shareConfigCopy: "Скопировать токен",
    shareConfigCopied: "Токен скопирован",
    ratesUpdatedTitle: "Курсы обновлены",
    ratesFallbackTitle: "Используем резервные курсы",
    ratesUpdatedDescription: (krw, usd) =>
      `$1 = ${new Intl.NumberFormat("ru-RU")
        .format(Math.round(krw))
        .replace(/\u00A0/g, " ")} KRW | €1 = $${usd
        .toLocaleString("ru-RU", {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        })
        .replace(/\u00A0/g, " ")}`,
    ratesFallbackDescription:
      "Не удалось получить живые курсы, используем безопасные значения.",
    fxStatus: {
      notUpdated: "Еще не обновлялось",
      justNow: "Только что",
      minuteAgo: "Обновлено минуту назад",
      minutesAgo: (minutes: number) => `Обновлено ${minutes} мин назад`,
    },
    calculateReady: "Рассчитать",
    calculateMissing: (remaining: number) =>
      `Заполните еще ${remaining} цен${
        remaining === 1 ? "у" : remaining < 5 ? "ы" : ""
      }`,
    copyRatesLabel: "Обновлено",
  },
};

const resolveInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "ru";
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "ru") return stored;
    const browserLang = navigator.language?.toLowerCase();
    return browserLang?.startsWith("ru") ? "ru" : "en";
  } catch (error) {
    console.warn("Failed to resolve language, defaulting to RU", error);
    return "ru";
  }
};

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
  if (typeof window === "undefined") {
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
  }

  try {
    const storedRaw = localStorage.getItem(PERSIST_KEY);
    const stored: Record<string, unknown> = storedRaw ? JSON.parse(storedRaw) : {};
    const storedFX = localStorage.getItem(FX_LAST_SUCCESS_KEY);
    const lastFx = storedFX ? JSON.parse(storedFX) : null;

    const parseNumber = (value: unknown, fallback: number) => {
      if (value === null || value === undefined || value === "") return fallback;
      const normalized = String(value).replace(/\s+/g, "").replace(/\u00A0/g, "").replace(",", ".");
      const num = Number(normalized);
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

    const preferStored = <T,>(key: string, fallbackValue: T): T => {
      return (stored as Record<string, T | undefined>)[key] ?? fallbackValue;
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

    const merged = {
      carPrices: preferStored("carPrices", stored.carPrices),
      krwPerUsdRate: preferStored("krwPerUsdRate", stored.krwPerUsdRate),
      usdPerEurRate: preferStored("usdPerEurRate", stored.usdPerEurRate),
      customsDuty: preferStored("customsDuty", stored.customsDuty),
      vat: preferStored("vat", stored.vat),
      translationPages: preferStored("translationPages", stored.translationPages),
      homologationFee: preferStored("homologationFee", stored.homologationFee),
      miscellaneous: preferStored("miscellaneous", stored.miscellaneous),
      scenario: preferStored("scenario", stored.scenario),
      numberOfCars: preferStored("numberOfCars", stored.numberOfCars),
      containerType: preferStored("containerType", stored.containerType),
      autoUpdateFX: preferStored("autoUpdateFX", stored.autoUpdateFX),
    };
    const resolvedContainer =
      merged.containerType === "20ft" || merged.containerType === "40ft"
        ? merged.containerType
        : "40ft";
    const resolvedNumberOfCars = Math.min(
      getContainerMaxCars(resolvedContainer),
      Math.max(1, parseNumber(merged.numberOfCars, 1))
    );

    const parsedCarPrices = parseArray(
      merged.carPrices ?? merged.carPrices === 0 ? merged.carPrices : undefined
    )
      .map((price) => Math.max(0, parseNumber(price, 0)))
      .slice(0, resolvedNumberOfCars);

    const normalizedCarPrices =
      parsedCarPrices.length > 0
        ? Array.from(
            { length: resolvedNumberOfCars },
            (_, index) => parsedCarPrices[index] ?? 0
          )
        : Array.from({ length: resolvedNumberOfCars }, () => 0);

    const legacyStoredRates = deriveLegacyRates(
      parseNumber(
        (merged as Record<string, unknown>).krwToEurRate,
        NaN
      ),
      parseNumber(
        (merged as Record<string, unknown>).usdToEurRate,
        NaN
      )
    );

    const lastValidRates =
      lastFx &&
      Number.isFinite(lastFx.krwPerUsd) &&
      Number.isFinite(lastFx.usdPerEur)
        ? { krwPerUsd: lastFx.krwPerUsd, usdPerEur: lastFx.usdPerEur }
        : deriveLegacyRates(lastFx?.krwToEur, lastFx?.usdToEur);

    return {
      carPrices: normalizedCarPrices,
      krwPerUsdRate: clampToRange(
        parseNumber(merged.krwPerUsdRate ?? legacyStoredRates?.krwPerUsd, 1350),
        FX_VALID_RANGES.krwPerUsd,
        1350
      ),
      usdPerEurRate: clampToRange(
        parseNumber(merged.usdPerEurRate ?? legacyStoredRates?.usdPerEur, 1.08),
        FX_VALID_RANGES.usdPerEur,
        1.08
      ),
      customsDuty: clampToRange(
        parseNumber(merged.customsDuty, DEFAULTS.customsDuty),
        { min: 0, max: 30 },
        DEFAULTS.customsDuty
      ),
      vat: clampToRange(
        parseNumber(merged.vat, DEFAULTS.vat),
        { min: 0, max: 25 },
        DEFAULTS.vat
      ),
      translationPages: Math.max(
        0,
        parseNumber(merged.translationPages, DEFAULTS.translationPages)
      ),
      homologationFee: Math.max(
        0,
        parseNumber(merged.homologationFee, DEFAULTS.homologationFee)
      ),
      miscellaneous: Math.max(
        0,
        parseNumber(merged.miscellaneous, DEFAULTS.miscellaneous)
      ),
      scenario: merged.scenario === "company" ? "company" : "physical",
      numberOfCars: resolvedNumberOfCars,
      containerType: resolvedContainer,
      autoUpdateFX: parseBool(merged.autoUpdateFX, false),
      lastValidRates,
      lastUpdatedAt: Number.isFinite(lastFx?.fetchedAt)
        ? lastFx?.fetchedAt
        : null,
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
  containerType: "20ft" | "40ft"
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

const calculatorReducer = (
  state: CalculatorState,
  action: Action
): CalculatorState => {
  switch (action.type) {
    case "setCarPrices":
      return {
        ...state,
        carPrices: ensureCarPriceLength(
          action.value,
          state.numberOfCars,
          state.containerType
        ),
      };
    case "setCarPricesWithUpdater": {
      const nextValue =
        typeof action.updater === "function"
          ? action.updater(state.carPrices)
          : action.updater;
      return {
        ...state,
        carPrices: ensureCarPriceLength(
          nextValue,
          state.numberOfCars,
          state.containerType
        ),
      };
    }
    case "updateCarPrice": {
      const next = ensureCarPriceLength(
        [...state.carPrices],
        state.numberOfCars,
        state.containerType
      );
      next[action.index] =
        !Number.isFinite(action.value) || action.value < 0 ? 0 : action.value;
      return { ...state, carPrices: next };
    }
    case "setNumberOfCars": {
      const nextCount = clampCars(action.value, state.containerType);
      const base = state.carPrices.slice(0, nextCount);
      const nextPrices = ensureCarPriceLength(
        base,
        nextCount,
        state.containerType
      );
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
  const [language, setLanguage] = useState<Language>(resolveInitialLanguage);
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
  const t = calculatorCopy[language];
  const controlButtonClasses =
    "h-10 w-10 rounded-lg border border-border/60 bg-background/70 hover:border-primary/60 hover:bg-primary/10 active:scale-95 transition-colors transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const initialFxSource: "live" | "fallback" | "manual" | "restored" =
    initialState.lastValidRates ? "restored" : "fallback";
  const [fxSource, setFxSource] = useState<
    "live" | "fallback" | "manual" | "restored"
  >(initialFxSource);
  const fxUpdateSourceRef = useRef<"none" | "live" | "fallback" | "restored">(
    initialFxSource
  );

  // Other costs and toggles handled in reducer above
  const [isRatesSheetOpen, setIsRatesSheetOpen] = useState(false);
  const ratesSheetTouchStart = useRef<number | null>(null);

  const setIsResultsOpen = useCallback((open: boolean) => {
    isResultsOpenRef.current = open;
    setIsResultsOpenState(open);
  }, []);
  const isResultsOpen = isResultsOpenState;
  const [shareConfigOpen, setShareConfigOpen] = useState(false);
  const [shareToken, setShareToken] = useState("");

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
    [dispatch, markFormChanged]
  );

  const setCarPricesTracked = useCallback(
    (updater: SetStateAction<number[]>, options?: { skipDirty?: boolean }) => {
      dispatchTracked({ type: "setCarPricesWithUpdater", updater }, options);
    },
    [dispatchTracked]
  );

  const setKrwPerUsdRateTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(krwPerUsdRate) : updater;
      const clamped = clampToRange(
        next,
        FX_VALID_RANGES.krwPerUsd,
        initialState.krwPerUsdRate
      );
      dispatchTracked({ type: "setRates", krwPerUsdRate: clamped });
    },
    [dispatchTracked, initialState.krwPerUsdRate, krwPerUsdRate]
  );

  const setUsdPerEurRateTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(usdPerEurRate) : updater;
      const clamped = clampToRange(
        next,
        FX_VALID_RANGES.usdPerEur,
        initialState.usdPerEurRate
      );
      dispatchTracked({ type: "setRates", usdPerEurRate: clamped });
    },
    [dispatchTracked, initialState.usdPerEurRate, usdPerEurRate]
  );

  const setCustomsDutyTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(customsDuty) : updater;
      dispatchTracked({ type: "setCustomsDuty", value: next });
    },
    [customsDuty, dispatchTracked]
  );

  const setVatTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next = typeof updater === "function" ? updater(vat) : updater;
      dispatchTracked({ type: "setVat", value: next });
    },
    [dispatchTracked, vat]
  );

  const setTranslationPagesTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(translationPages) : updater;
      dispatchTracked({ type: "setTranslationPages", value: next });
    },
    [dispatchTracked, translationPages]
  );

  const setHomologationFeeTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(homologationFee) : updater;
      dispatchTracked({ type: "setHomologationFee", value: next });
    },
    [dispatchTracked, homologationFee]
  );

  const setMiscellaneousTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(miscellaneous) : updater;
      dispatchTracked({ type: "setMiscellaneous", value: next });
    },
    [dispatchTracked, miscellaneous]
  );

  const setScenarioTracked = useCallback(
    (next: "physical" | "company") => {
      dispatchTracked({ type: "setScenario", value: next });
    },
    [dispatchTracked]
  );

  const setNumberOfCarsTracked = useCallback(
    (updater: SetStateAction<number>) => {
      const next =
        typeof updater === "function" ? updater(numberOfCars) : updater;
      dispatchTracked({ type: "setNumberOfCars", value: next });
    },
    [dispatchTracked, numberOfCars]
  );

  const setContainerTypeTracked = useCallback(
    (next: "20ft" | "40ft") => {
      dispatchTracked({ type: "setContainerType", value: next });
    },
    [dispatchTracked]
  );

  const setAutoUpdateFXTracked = useCallback(
    (updater: SetStateAction<boolean>) => {
      const next =
        typeof updater === "function" ? updater(autoUpdateFX) : updater;
      dispatchTracked({ type: "setAutoUpdateFX", value: next });
    },
    [autoUpdateFX, dispatchTracked]
  );

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn("Failed to persist language", error);
    }
  }, [language]);

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
    [dispatch]
  );

  const setLastUpdatedAtState = useCallback(
    (value: number | null) => {
      dispatch({ type: "setLastUpdatedAt", value });
    },
    [dispatch]
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
    speditorVatRate: SPEDITOR_VAT_RATE,
  });

  // Fetch exchange rates
  const handleFetchRates = useCallback(async () => {
    if (fetchInFlightRef.current || !isMountedRef.current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      toast({
        title: t.ratesFallbackTitle,
        description: language === "en" ? "Offline — cannot refresh rates." : "Нет сети — обновление курсов недоступно.",
        variant: "destructive",
      });
      return;
    }
    fetchInFlightRef.current = true;
    setIsLoadingRates(true);
    try {
      const rates = await fetchExchangeRates();
      fxUpdateSourceRef.current = rates.isFallback ? "fallback" : "live";
      if (!isMountedRef.current) return;
      dispatchTracked(
        {
          type: "setRates",
          krwPerUsdRate: rates.krwPerUsd,
          usdPerEurRate: rates.usdPerEur,
        },
        { skipDirty: true }
      );
      const fetchedAt = rates.fetchedAt || Date.now();
      setLastUpdatedAtState(fetchedAt);
      if (!rates.isFallback) {
        setLastValidRatesState({
          krwPerUsd: rates.krwPerUsd,
          usdPerEur: rates.usdPerEur,
        });
        localStorage.setItem(
          FX_LAST_SUCCESS_KEY,
          JSON.stringify({
            krwPerUsd: rates.krwPerUsd,
            usdPerEur: rates.usdPerEur,
            fetchedAt,
          })
        );
      }

      setFxSource(rates.isFallback ? "fallback" : "live");

      toast({
        title: rates.isFallback ? t.ratesFallbackTitle : t.ratesUpdatedTitle,
        description: rates.isFallback
          ? t.ratesFallbackDescription
          : t.ratesUpdatedDescription(rates.krwPerUsd, rates.usdPerEur),
        variant: rates.isFallback ? "destructive" : "default",
      });
    } finally {
      fetchInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsLoadingRates(false);
      }
    }
  }, [
    dispatchTracked,
    language,
    setLastUpdatedAtState,
    setLastValidRatesState,
    toast,
    t,
  ]);

  // Fetch latest exchange rates on initial load
  useEffect(() => {
    if (initialRatesFetchedRef.current) return;
    initialRatesFetchedRef.current = true;
    if (autoUpdateFX || !lastValidRates) {
      handleFetchRates();
    }
  }, [autoUpdateFX, handleFetchRates, lastValidRates]);

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
        setFxSource(
          source === "fallback"
            ? "fallback"
            : source === "live"
            ? "live"
            : "restored"
        );
        fxUpdateSourceRef.current = "none";
      } else {
        setFxSource("manual");
      }

      setLastValidRatesState({
        krwPerUsd: krwPerUsdRate,
        usdPerEur: usdPerEurRate,
      });
    }
  }, [krwPerUsdRate, setLastValidRatesState, usdPerEurRate]);

  // Check if all car prices are filled
  const completedCars = carPrices.filter((p) => p > 0).length;
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
    const deltaX =
      (e.changedTouches[0]?.clientX ?? 0) - ratesSheetTouchStart.current;
    if (deltaX < -40) setIsRatesSheetOpen(false);
    ratesSheetTouchStart.current = null;
  };

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    const activeElement = document.activeElement as HTMLElement | null;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t.shareSuccessTitle,
        description: t.shareSuccessDescription,
      });
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      let success = false;
      try {
        success = document.execCommand("copy");
      } catch {
        success = false;
      } finally {
        document.body.removeChild(textarea);
        if (activeElement?.focus) activeElement.focus();
      }
      if (success) {
        toast({
          title: t.shareSuccessTitle,
          description: t.shareFallbackDescription,
        });
      } else {
        toast({
          title: language === "en" ? "Copy failed" : "Не удалось скопировать",
          description: language === "en" ? "Try copying the link manually." : "Попробуйте скопировать ссылку вручную.",
          variant: "destructive",
        });
      }
    }
  };

  const buildShareToken = () => {
    const payload = {
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
    };
    const json = JSON.stringify(payload);
    // Encode to base64 safely for Unicode.
    const encoded = btoa(unescape(encodeURIComponent(json)));
    setShareToken(encoded);
  };

  const handleShareConfig = () => {
    buildShareToken();
    setShareConfigOpen(true);
  };

  const handleCopyToken = async () => {
    const activeElement = document.activeElement as HTMLElement | null;
    try {
      await navigator.clipboard.writeText(shareToken);
      toast({
        title: t.shareConfigCopied,
        description: t.shareConfigDescription,
      });
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareToken;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      let success = false;
      try {
        success = document.execCommand("copy");
      } catch {
        success = false;
      } finally {
        document.body.removeChild(textarea);
        if (activeElement?.focus) activeElement.focus();
      }
      if (success) {
        toast({
          title: t.shareConfigCopied,
          description: t.shareConfigDescription,
        });
      } else {
        toast({
          title: language === "en" ? "Copy failed" : "Не удалось скопировать",
          description:
            language === "en"
              ? "Try copying the token manually."
              : "Попробуйте скопировать токен вручную.",
          variant: "destructive",
        });
      }
    }
  };

  const renderFxUpdatedLabel = () => {
    if (!lastUpdatedAt) return t.fxStatus.notUpdated;
    const diffMs = Date.now() - lastUpdatedAt;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes <= 0) return t.fxStatus.justNow;
    if (minutes === 1) return t.fxStatus.minuteAgo;
    return t.fxStatus.minutesAgo(minutes);
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
                  {t.title}
                </h1>
                <p className="text-xs text-muted-foreground">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`${controlButtonClasses} text-xs font-semibold`}
                        onClick={() =>
                          setLanguage((prev) => (prev === "en" ? "ru" : "en"))
                        }
                        aria-label="Toggle language RU/EN"
                      >
                        {language === "en" ? "RU" : "EN"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {language === "en" ? "Switch to Russian" : "Переключить на английский"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={controlButtonClasses}
                        onClick={handleCopyShareLink}
                        aria-label="Copy calculator link"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t.shareSuccessTitle}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="outline"
                  size="icon"
                  className={controlButtonClasses}
                  onClick={handleShareConfig}
                  aria-label={t.shareConfigTitle}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ThemeToggle className={controlButtonClasses} />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {language === "en" ? "Toggle theme" : "Сменить тему"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                    = ₩
                    {new Intl.NumberFormat("ru-RU")
                      .format(Math.round(krwPerUsdRate))
                      .replace(/\u00A0/g, " ")}
                  </span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">€1</span>
                  <span className="font-medium text-foreground">
                    = $
                    {usdPerEurRate
                      .toLocaleString("ru-RU", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })
                      .replace(/\u00A0/g, " ")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {fxSource === "fallback" && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <RefreshCcw
                  className={`w-3.5 h-3.5 ${
                    isLoadingRates ? "animate-spin" : ""
                  }`}
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
              language={language}
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
              language={language}
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
                {allPricesFilled
                  ? t.calculateReady
                  : t.calculateMissing(numberOfCars - completedCars)}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Bottom Sheet */}
      <ResultsBottomSheet
        language={language}
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
            <p className="text-xs text-muted-foreground">{t.ratesSheetTitle}</p>
            <h3 className="text-lg font-semibold text-foreground">
              {t.ratesSheetSubtitle}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRatesSheetOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </BottomSheetHeader>
        <BottomSheetBody className="pt-2">
          <div
            onTouchStart={handleRatesTouchStart}
            onTouchEnd={handleRatesTouchEnd}
          >
            <CurrencyRatesSection
              language={language}
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

      <AlertDialog open={shareConfigOpen} onOpenChange={setShareConfigOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.shareConfigWarningTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.shareConfigWarningBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted/50 border border-border/60 rounded-lg p-3 text-xs break-all select-text">
            {shareToken}
          </div>
          <p className="text-xs text-muted-foreground">{t.shareConfigDescription}</p>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "en" ? "Close" : "Закрыть"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCopyToken}>
              {t.shareConfigCopy}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Calculator;
