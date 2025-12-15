export const PERSIST_KEY = "car-import-state-v1";
export const FX_LAST_SUCCESS_KEY = "car-import-last-fx-v1";
export const FX_REFRESH_MS = 10 * 60 * 1000; // 10 minutes
export const LANGUAGE_STORAGE_KEY = "car-import-language";
export const STATE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const FX_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
export const MAX_CAR_PRICE_EUR = 500_000;
export const MAX_HOMOLOGATION_EUR = 10_000;
export const MAX_TRANSLATION_PAGES = 300;
export const MAX_MISC_EUR = 50_000;

export const DEFAULTS = {
  customsDuty: 5,
  vat: 21,
  translationPages: 3,
  homologationFee: 250,
  miscellaneous: 0,
};
