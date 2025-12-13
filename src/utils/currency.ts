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

export const convertKRWToUSD = (krw: number, krwPerUsdRate: number): number => {
  if (!krwPerUsdRate || krwPerUsdRate <= 0) return 0;
  return krw / krwPerUsdRate;
};

export const convertUSDToEUR = (usd: number, usdPerEurRate: number): number => {
  if (!usdPerEurRate || usdPerEurRate <= 0) return 0;
  return usd / usdPerEurRate;
};

export const convertKRWToEUR = (
  krw: number,
  krwPerUsdRate: number,
  usdPerEurRate: number,
): number => {
  const usd = convertKRWToUSD(krw, krwPerUsdRate);
  return convertUSDToEUR(usd, usdPerEurRate);
};

// Fetch live exchange rates from exchangerate API
export interface ExchangeRates {
  krwPerUsd: number;
  usdPerEur: number;
  isFallback: boolean;
  fetchedAt?: number;
}

export const FX_VALID_RANGES = {
  krwPerUsd: { min: 500, max: 2000 },
  usdPerEur: { min: 0.5, max: 2 },
} as const;

const FALLBACK_RATES: ExchangeRates = { krwPerUsd: 1350, usdPerEur: 1.08, isFallback: true, fetchedAt: undefined };

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

    const krwPerUsd = eurToKrw / eurToUsd;
    const usdPerEur = eurToUsd;

    const krwInRange =
      krwPerUsd >= FX_VALID_RANGES.krwPerUsd.min &&
      krwPerUsd <= FX_VALID_RANGES.krwPerUsd.max;
    const usdInRange =
      usdPerEur >= FX_VALID_RANGES.usdPerEur.min &&
      usdPerEur <= FX_VALID_RANGES.usdPerEur.max;

    if (!krwInRange || !usdInRange) {
      throw new Error(`Rates out of expected range: KRW/USD=${krwPerUsd}, USD/EUR=${usdPerEur}`);
    }

    return { krwPerUsd, usdPerEur, isFallback: false, fetchedAt: Date.now() };
  } catch (error) {
    console.error('Error fetching exchange rates, using fallbacks:', error);
    return { ...FALLBACK_RATES };
  } finally {
    clearTimeout(timeout);
  }
};
