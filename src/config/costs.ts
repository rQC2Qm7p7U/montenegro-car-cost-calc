/**
 * Central place for business constants used across calculations and UI.
 * Keep values aligned with shipping/speditor contracts.
 */
export const COSTS = {
  speditor: {
    baseFeeEUR: 150,
    vatRate: 0.21,
  },
  translationPerPageEUR: 35,
  portAgentBaseEUR: 250,
} as const;

export const CONTAINER_CONFIGS = {
  "20ft": { maxCars: 2, freightUSD: 3150, localEUR: 350 },
  "40ft": { maxCars: 4, freightUSD: 4150, localEUR: 420 },
} as const;
