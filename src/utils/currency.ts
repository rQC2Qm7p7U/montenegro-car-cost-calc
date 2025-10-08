// Currency utility functions

export const formatKRW = (value: number): string => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

export const formatEUR = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
export const fetchExchangeRates = async (): Promise<{ krwToEur: number; usdToEur: number } | null> => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    if (!response.ok) throw new Error('Failed to fetch rates');
    
    const data = await response.json();
    const eurToKrw = data.rates.KRW;
    const eurToUsd = data.rates.USD;
    
    return {
      krwToEur: 1 / eurToKrw,
      usdToEur: 1 / eurToUsd,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
};
