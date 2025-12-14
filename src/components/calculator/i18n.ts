import type { Language } from "@/types/language";

export type CalculatorCopy = Record<
  Language,
  {
    title: string;
    subtitle: string;
    ratesSheetTitle: string;
    ratesSheetSubtitle: string;
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
>;

export const calculatorCopy: CalculatorCopy = {
  en: {
    title: "Car Import Calculator",
    subtitle: "Korea → Montenegro",
    ratesSheetTitle: "Exchange Rates",
    ratesSheetSubtitle: "KRW → USD & USD → EUR",
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
