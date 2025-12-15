import { useEffect, useMemo, useRef, useState } from "react";
import { useCalculatorContext } from "./CalculatorContext";
import { parseKRWInput, convertKRWToEUR } from "@/utils/currency";
import { MAX_CAR_PRICE_EUR } from "./state";

type CurrencyMode = "eur" | "krw";

const clampNonNegative = (value: number) =>
  !Number.isFinite(value) || value < 0 ? 0 : value;

const clampPrice = (value: number) =>
  Math.min(MAX_CAR_PRICE_EUR, clampNonNegative(value));

const formatEuroInput = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(value)
    .replace(/\u00A0/g, " ");

const computeEurFromKrwInput = (
  input: string,
  krwPerUsdRate: number,
  usdPerEurRate: number,
  raw: boolean,
) => {
  const parsedKRW = parseKRWInput(input);
  const actualKRW = raw ? parsedKRW : parsedKRW * 10000;
  return clampPrice(convertKRWToEUR(actualKRW, krwPerUsdRate, usdPerEurRate));
};

const formatKrwFromEur = (
  eur: number,
  krwPerUsdRate: number,
  usdPerEurRate: number,
  raw: boolean,
) => {
  if (!eur || !Number.isFinite(krwPerUsdRate) || krwPerUsdRate <= 0 || usdPerEurRate <= 0) {
    return "";
  }
  const krw = eur * usdPerEurRate * krwPerUsdRate;
  const display = raw ? krw : krw / 10000;
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(display)
    .replace(/\u00A0/g, " ");
};

export const useCarPricesForm = () => {
  const {
    state: { numberOfCars, carPrices, krwPerUsdRate, usdPerEurRate },
    results,
    setCarPrices,
  } = useCalculatorContext();

  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("eur");
  const [rawKRWMode, setRawKRWMode] = useState(false);
  const [krwInputValues, setKrwInputValues] = useState<string[]>(
    Array(numberOfCars).fill(""),
  );
  const [eurInputValues, setEurInputValues] = useState<string[]>(
    Array(numberOfCars).fill(""),
  );
  const debounceTimersRef = useRef<Record<number, ReturnType<typeof setTimeout> | undefined>>({});
  const prevKrwRateRef = useRef(krwPerUsdRate);
  const prevUsdRateRef = useRef(usdPerEurRate);
  const prevRawModeRef = useRef(rawKRWMode);

  const updateCarPriceDebounced = (index: number, value: number) => {
    const timers = debounceTimersRef.current;
    if (timers[index]) {
      clearTimeout(timers[index]);
    }
    timers[index] = setTimeout(() => {
      setCarPrices((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    }, 150);
  };

  const handlePriceChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, "");
    const intValue = digitsOnly === "" ? 0 : Math.trunc(Number(digitsOnly));
    const safeValue = clampPrice(intValue);

    setEurInputValues((prev) => {
      const next = [...prev];
      next[index] = digitsOnly === "" ? "" : formatEuroInput(safeValue);
      return next;
    });

    updateCarPriceDebounced(index, digitsOnly === "" ? 0 : safeValue);
  };

  const handleKRWChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^\d.,\s]/g, "");
    setKrwInputValues((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });

    const eurValue = computeEurFromKrwInput(cleaned, krwPerUsdRate, usdPerEurRate, rawKRWMode);
    updateCarPriceDebounced(index, eurValue);
    setEurInputValues((prev) => {
      const next = [...prev];
      next[index] = eurValue ? formatEuroInput(eurValue) : "";
      return next;
    });
  };

  const setAllToSamePrice = () => {
    if (currencyMode === "krw") {
      const baseKrwString = krwInputValues[0] ?? "";
      const eurFromKrw = baseKrwString
        ? computeEurFromKrwInput(baseKrwString, krwPerUsdRate, usdPerEurRate, rawKRWMode)
        : clampPrice(carPrices[0] ?? 0);
      const eurDisplay = eurFromKrw ? formatEuroInput(eurFromKrw) : "";
      const krwDisplay =
        baseKrwString || formatKrwFromEur(eurFromKrw, krwPerUsdRate, usdPerEurRate, rawKRWMode);

      setCarPrices(Array(numberOfCars).fill(eurFromKrw));
      setEurInputValues(Array(numberOfCars).fill(eurDisplay));
      setKrwInputValues(Array(numberOfCars).fill(krwDisplay));
      return;
    }

    const baseEur = clampPrice(carPrices[0] ?? 0);
    const eurDisplay = baseEur ? formatEuroInput(baseEur) : "";
    const krwDisplay = formatKrwFromEur(baseEur, krwPerUsdRate, usdPerEurRate, rawKRWMode);

    setCarPrices(Array(numberOfCars).fill(baseEur));
    setEurInputValues(Array(numberOfCars).fill(eurDisplay));
    setKrwInputValues(Array(numberOfCars).fill(krwDisplay));
  };

  const completedCount = useMemo(
    () => carPrices.filter((p) => p > 0).length,
    [carPrices],
  );
  const carResultByIndex = useMemo(
    () => new Map(results.carResults.map((car) => [car.carIndex - 1, car])),
    [results.carResults],
  );

  useEffect(() => {
    setEurInputValues((prev) => {
      if (prev.length < numberOfCars) {
        return [...prev, ...Array(numberOfCars - prev.length).fill("")];
      }
      if (prev.length > numberOfCars) {
        return prev.slice(0, numberOfCars);
      }
      return prev;
    });

    setKrwInputValues((prev) => {
      if (prev.length < numberOfCars) {
        return [...prev, ...Array(numberOfCars - prev.length).fill("")];
      }
      if (prev.length > numberOfCars) {
        return prev.slice(0, numberOfCars);
      }
      return prev;
    });
  }, [numberOfCars]);

  useEffect(() => {
    setEurInputValues((prev) => {
      const next = [...prev];
      for (let i = 0; i < numberOfCars; i += 1) {
        if (carPrices[i] > 0 && (!next[i] || next[i] === "0")) {
          next[i] = formatEuroInput(carPrices[i]);
        }
      }
      return next.slice(0, numberOfCars);
    });
  }, [carPrices, numberOfCars]);

  useEffect(() => {
    if (currencyMode !== "krw") return;
    setKrwInputValues((prev) => {
      const next = [...prev];
      for (let i = 0; i < numberOfCars; i += 1) {
        next[i] =
          carPrices[i] > 0
            ? formatKrwFromEur(carPrices[i], krwPerUsdRate, usdPerEurRate, rawKRWMode)
            : "";
      }
      return next.slice(0, numberOfCars);
    });
  }, [carPrices, currencyMode, krwPerUsdRate, numberOfCars, rawKRWMode, usdPerEurRate]);

  useEffect(() => {
    const rateChanged = prevKrwRateRef.current !== krwPerUsdRate;
    const usdRateChanged = prevUsdRateRef.current !== usdPerEurRate;
    const rawChanged = prevRawModeRef.current !== rawKRWMode;
    prevKrwRateRef.current = krwPerUsdRate;
    prevUsdRateRef.current = usdPerEurRate;
    prevRawModeRef.current = rawKRWMode;
    if (!rateChanged && !rawChanged && !usdRateChanged) return;
    if (!krwInputValues.some(Boolean)) return;

    const updatedPrices = [...carPrices];
    const updatedEurInputs = [...eurInputValues];

    krwInputValues.forEach((value, index) => {
      if (!value) return;
      const eurValue = computeEurFromKrwInput(value, krwPerUsdRate, usdPerEurRate, rawKRWMode);
      updatedPrices[index] = eurValue;
      updatedEurInputs[index] = eurValue ? formatEuroInput(eurValue) : "";
    });

    setCarPrices(updatedPrices, { skipDirty: true });
    setEurInputValues(updatedEurInputs);
  }, [carPrices, eurInputValues, krwInputValues, krwPerUsdRate, rawKRWMode, setCarPrices, usdPerEurRate]);

  useEffect(
    () => () => {
      Object.values(debounceTimersRef.current).forEach((timer) => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    },
    [],
  );

  return {
    numberOfCars,
    carPrices,
    currencyMode,
    setCurrencyMode,
    rawKRWMode,
    setRawKRWMode,
    krwInputValues,
    eurInputValues,
    handlePriceChange,
    handleKRWChange,
    setAllToSamePrice,
    completedCount,
    carResultByIndex,
    results,
    krwPerUsdRate,
    usdPerEurRate,
  };
};
