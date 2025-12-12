// Currency utility functions

export const formatKRW = (value: number): string => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

export const formatEUR = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

export const parseKRWInput = (input: string): number => {
  // Remove commas and whitespace
  const cleaned = input.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const convertKRWToEUR = (krw: number, rate: number): number => {
  return krw * rate;
};

export const convertUSDToEUR = (usd: number, rate: number): number => {
  return usd * rate;
};

// Fetch live exchange rates from exchangerate API
export interface ExchangeRates {
  krwToEur: number;
  usdToEur: number;
  isFallback: boolean;
  fetchedAt?: number;
}

export const FX_VALID_RANGES = {
  krwToEur: { min: 0.0001, max: 0.005 },
  usdToEur: { min: 0.5, max: 2 },
} as const;

const FALLBACK_RATES: ExchangeRates = { krwToEur: 0.00068, usdToEur: 0.93, isFallback: true, fetchedAt: undefined };

export const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR', {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Failed to fetch rates: ${response.status}`);
    
    const data = await response.json();
    const rates = data?.rates;
    const eurToKrw = typeof rates?.KRW === 'number' ? rates.KRW : null;
    const eurToUsd = typeof rates?.USD === 'number' ? rates.USD : null;

    if (!eurToKrw || !eurToUsd || !Number.isFinite(eurToKrw) || !Number.isFinite(eurToUsd)) {
      throw new Error('Missing or invalid rate fields');
    }

    const krwToEur = 1 / eurToKrw;
    const usdToEur = 1 / eurToUsd;

    const krwInRange = krwToEur >= FX_VALID_RANGES.krwToEur.min && krwToEur <= FX_VALID_RANGES.krwToEur.max;
    const usdInRange = usdToEur >= FX_VALID_RANGES.usdToEur.min && usdToEur <= FX_VALID_RANGES.usdToEur.max;

    if (!krwInRange || !usdInRange) {
      throw new Error(`Rates out of expected range: KRW/EUR=${krwToEur}, USD/EUR=${usdToEur}`);
    }

    return { krwToEur, usdToEur, isFallback: false, fetchedAt: Date.now() };
  } catch (error) {
    console.error('Error fetching exchange rates, using fallbacks:', error);
    return { ...FALLBACK_RATES };
  } finally {
    clearTimeout(timeout);
  }
};
