import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCarImportCalculations } from "@/hooks/useCarImportCalculations";
import { useCalculatorPersistence } from "@/hooks/useCalculatorPersistence";
import { useFxController } from "./useFxController";
import { useCalculatorDispatchers } from "./useCalculatorDispatchers";
import { calculatorCopy } from "./i18n";
import type { CalculatorCopy } from "./i18n";
import {
  calculatorReducer,
  LANGUAGE_STORAGE_KEY,
  PERSIST_KEY,
  readInitialState,
  resolveInitialLanguage,
  type Action,
  type CalculatorState,
  type InitialState,
} from "./state";
import { COST_CONFIG, SPEDITOR_GROSS_FEE } from "@/config/costs";
import type { CalculationResults } from "@/types/calculator";
import type { Language } from "@/types/language";

type CalculatorContextValue = {
  language: Language;
  setLanguage: Dispatch<SetStateAction<Language>>;
  t: CalculatorCopy[Language];
  state: CalculatorState;
  initialState: InitialState;
  results: CalculationResults;
  usdToEurRate: number;
  completedCars: number;
  allPricesFilled: boolean;
  isResultsOpen: boolean;
  setIsResultsOpen: (open: boolean) => void;
  handleCalculate: () => void;
  handleRecalculate: () => void;
  setCarPrices: ReturnType<typeof useCalculatorDispatchers>["setCarPrices"];
  setKrwPerUsdRate: ReturnType<typeof useCalculatorDispatchers>["setKrwPerUsdRate"];
  setUsdPerEurRate: ReturnType<typeof useCalculatorDispatchers>["setUsdPerEurRate"];
  setCustomsDuty: ReturnType<typeof useCalculatorDispatchers>["setCustomsDuty"];
  setVat: ReturnType<typeof useCalculatorDispatchers>["setVat"];
  setTranslationPages: ReturnType<typeof useCalculatorDispatchers>["setTranslationPages"];
  setHomologationFee: ReturnType<typeof useCalculatorDispatchers>["setHomologationFee"];
  setMiscellaneous: ReturnType<typeof useCalculatorDispatchers>["setMiscellaneous"];
  setScenario: ReturnType<typeof useCalculatorDispatchers>["setScenario"];
  setNumberOfCars: ReturnType<typeof useCalculatorDispatchers>["setNumberOfCars"];
  setContainerType: ReturnType<typeof useCalculatorDispatchers>["setContainerType"];
  setAutoUpdateFX: ReturnType<typeof useCalculatorDispatchers>["setAutoUpdateFX"];
  fxSource: ReturnType<typeof useFxController>["fxSource"];
  setFxSource: ReturnType<typeof useFxController>["setFxSource"];
  fxUpdateSourceRef: ReturnType<typeof useFxController>["fxUpdateSourceRef"];
  handleFetchRates: ReturnType<typeof useFxController>["handleFetchRates"];
  isLoadingRates: boolean;
  lastValidRates: CalculatorState["lastValidRates"];
  lastUpdatedAt: CalculatorState["lastUpdatedAt"];
};

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export const CalculatorProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>(resolveInitialLanguage);
  const initialStateRef = useRef<InitialState | null>(null);
  if (!initialStateRef.current) {
    initialStateRef.current = readInitialState();
  }
  const initialState = initialStateRef.current;

  const hasMountedRef = useRef(false);
  const [isResultsOpenState, setIsResultsOpenState] = useState(false);
  const isResultsOpenRef = useRef(false);

  const setIsResultsOpen = useCallback((open: boolean) => {
    isResultsOpenRef.current = open;
    setIsResultsOpenState(open);
  }, []);

  const markFormChanged = useCallback(() => {
    if (isResultsOpenRef.current) {
      setIsResultsOpen(false);
    }
  }, [setIsResultsOpen]);

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

  const dispatchTracked = useCallback(
    (action: Action, options?: { skipDirty?: boolean }) => {
      if (!options?.skipDirty) {
        markFormChanged();
      }
      dispatch(action);
    },
    [markFormChanged],
  );

  const {
    setCarPrices,
    setKrwPerUsdRate,
    setUsdPerEurRate,
    setCustomsDuty,
    setVat,
    setTranslationPages,
    setHomologationFee,
    setMiscellaneous,
    setScenario,
    setNumberOfCars,
    setContainerType,
    setAutoUpdateFX,
  } = useCalculatorDispatchers({ state, initialState, dispatchTracked });

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn("Failed to persist language", error);
    }
  }, [language]);

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
    [],
  );

  const setLastUpdatedAtState = useCallback(
    (value: number | null) => {
      dispatch({ type: "setLastUpdatedAt", value });
    },
    [],
  );

  const applyRates = useCallback(
    (krwRate: number, usdRate: number) => {
      dispatchTracked(
        {
          type: "setRates",
          krwPerUsdRate: krwRate,
          usdPerEurRate: usdRate,
        },
        { skipDirty: true },
      );
    },
    [dispatchTracked],
  );

  const {
    fxSource,
    setFxSource,
    fxUpdateSourceRef,
    handleFetchRates,
    isLoadingRates,
  } = useFxController({
    autoUpdateFX,
    lastValidRates,
    language,
    copy: {
      ratesFallbackDescription: t.ratesFallbackDescription,
      ratesFallbackTitle: t.ratesFallbackTitle,
      ratesUpdatedDescription: t.ratesUpdatedDescription,
      ratesUpdatedTitle: t.ratesUpdatedTitle,
    },
    applyRates,
    setLastValidRates: setLastValidRatesState,
    setLastUpdatedAt: setLastUpdatedAtState,
    toast,
    krwPerUsdRate,
    usdPerEurRate,
    hasMountedRef,
  });

  const usdToEurRate = usdPerEurRate > 0 ? 1 / usdPerEurRate : 0;

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
    speditorFee: SPEDITOR_GROSS_FEE,
    speditorVatRate: COST_CONFIG.speditor.vatRate,
  });

  const completedCars = useMemo(
    () => carPrices.filter((p) => p > 0).length,
    [carPrices],
  );
  const allPricesFilled = completedCars === numberOfCars;

  const handleCalculate = useCallback(() => {
    setIsResultsOpen(true);
  }, [setIsResultsOpen]);

  const handleRecalculate = useCallback(() => {
    setIsResultsOpen(false);
  }, [setIsResultsOpen]);

  const value: CalculatorContextValue = {
    language,
    setLanguage,
    t,
    state,
    initialState,
    results,
    usdToEurRate,
    completedCars,
    allPricesFilled,
    isResultsOpen: isResultsOpenState,
    setIsResultsOpen,
    handleCalculate,
    handleRecalculate,
    setCarPrices,
    setKrwPerUsdRate,
    setUsdPerEurRate,
    setCustomsDuty,
    setVat,
    setTranslationPages,
    setHomologationFee,
    setMiscellaneous,
    setScenario,
    setNumberOfCars,
    setContainerType,
    setAutoUpdateFX,
    fxSource,
    setFxSource,
    fxUpdateSourceRef,
    handleFetchRates,
    isLoadingRates,
    lastValidRates,
    lastUpdatedAt,
  };

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCalculatorContext = () => {
  const ctx = useContext(CalculatorContext);
  if (!ctx) {
    throw new Error("useCalculatorContext must be used within CalculatorProvider");
  }
  return ctx;
};
