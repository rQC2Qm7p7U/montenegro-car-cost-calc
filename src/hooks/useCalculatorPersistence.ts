import { useEffect } from "react";
import type { MutableRefObject } from "react";

type PersistableState = {
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
};

interface UseCalculatorPersistenceProps {
  persistKey: string;
  state: PersistableState;
  hasMountedRef: MutableRefObject<boolean>;
}

export const useCalculatorPersistence = ({
  persistKey,
  state,
  hasMountedRef,
}: UseCalculatorPersistenceProps) => {
  const {
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
  } = state;

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const id = window.setTimeout(() => {
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

      try {
        localStorage.setItem(persistKey, JSON.stringify(payload));
      } catch (error) {
        console.warn("Failed to persist calculator state", error);
      }

      // Persist into URL hash (not sent in Referer) to avoid leaking data to external requests.
      try {
        const params = new URLSearchParams();
        params.set("carPrices", carPrices.join(","));
        params.set("krwPerUsdRate", String(krwPerUsdRate));
        params.set("usdPerEurRate", String(usdPerEurRate));
        params.set("customsDuty", String(customsDuty));
        params.set("vat", String(vat));
        params.set("translationPages", String(translationPages));
        params.set("homologationFee", String(homologationFee));
        params.set("miscellaneous", String(miscellaneous));
        params.set("scenario", scenario);
        params.set("numberOfCars", String(numberOfCars));
        params.set("containerType", containerType);
        params.set("autoUpdateFX", String(autoUpdateFX));

        const hash = params.toString();
        // Guard against excessively long URLs to avoid history bloat.
        const safeHash = hash.length > 1800 ? "" : hash;
        const newUrl = safeHash
          ? `${window.location.pathname}#${safeHash}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      } catch (error) {
        console.warn("Failed to persist calculator URL hash", error);
      }
    }, 400);

    return () => window.clearTimeout(id);
  }, [
    autoUpdateFX,
    carPrices,
    containerType,
    customsDuty,
    hasMountedRef,
    homologationFee,
    krwPerUsdRate,
    miscellaneous,
    numberOfCars,
    scenario,
    translationPages,
    usdPerEurRate,
    vat,
    persistKey,
  ]);
};
