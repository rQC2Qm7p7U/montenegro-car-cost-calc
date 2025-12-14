import React from "react";
import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import Calculator from "./Calculator";
import { LANGUAGE_STORAGE_KEY } from "./calculator/state";
import { TooltipProvider } from "@/components/ui/tooltip";

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

describe("Calculator form integration", () => {
  beforeEach(() => {
    let store: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    Object.defineProperty(global, "localStorage", {
      value: mockStorage,
      configurable: true,
    });
    localStorage.clear();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { KRW: 1350, USD: 1.08 } }),
    } as unknown as Response);
    Object.defineProperty(window.navigator, "language", {
      value: "en-US",
      configurable: true,
    });
    window.matchMedia =
      window.matchMedia ||
      (() =>
        ({
          matches: false,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
          media: "",
        } as unknown as MediaQueryList));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("enables Calculate after car price is provided", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Calculator />
      </TooltipProvider>,
    );

    const calcButton = screen.getByRole("button", {
      name: /enter .*price|заполните еще/i,
    });
    expect(calcButton).toBeDisabled();

    const carPriceInput = screen.getByLabelText(/car #1|авто №1/i) as HTMLInputElement;
    await user.type(carPriceInput, "12000");

    await waitFor(() => expect(calcButton).not.toBeDisabled());

    await user.click(calcButton);
    await waitFor(() =>
      expect(screen.getByText(/export pdf|скачать pdf/i)).toBeInTheDocument(),
    );
  });

  it("toggles language and persists selection", async () => {
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    render(
      <TooltipProvider>
        <Calculator />
      </TooltipProvider>,
    );

    const toggleLang = screen.getAllByLabelText(/toggle language/i)[0];
    await user.click(toggleLang); // switch to RU

    expect(screen.getByText(/Калькулятор ввоза авто/i)).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ru");
  });
});
