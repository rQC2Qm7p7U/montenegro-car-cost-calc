/**
 * Central place for business constants used across calculations and UI.
 * Keep values aligned with shipping/speditor contracts.
 * Editing here updates downstream calculations automatically.
 */
export const COST_CONFIG = {
  speditor: {
    baseFeeEUR: 150,
    vatRate: 0.21,
  },
  translation: {
    perPageEUR: 35,
  },
  portAgent: {
    baseEUR: 250,
  },
  containers: {
    "20ft": { maxCars: 2, freightUSD: 3150, localEUR: 350 },
    "40ft": { maxCars: 4, freightUSD: 4150, localEUR: 420 },
  },
} as const;

export const COSTS = COST_CONFIG; // backwards-compatible alias
export const CONTAINER_CONFIGS = COST_CONFIG.containers;
export const SPEDITOR_GROSS_FEE =
  COST_CONFIG.speditor.baseFeeEUR * (1 + COST_CONFIG.speditor.vatRate);
