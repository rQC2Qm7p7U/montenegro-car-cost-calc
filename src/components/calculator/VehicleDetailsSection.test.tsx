import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VehicleDetailsSection } from "./VehicleDetailsSection";
import {
  MAX_HOMOLOGATION_EUR,
  MAX_MISC_EUR,
  MAX_TRANSLATION_PAGES,
} from "./state";

beforeAll(() => {
  // Radix Select uses pointer capture APIs that jsdom does not implement.
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
});

const renderWithState = () => {
  const setScenario = vi.fn();
  const Wrapper = () => {
    const [containerType, setContainerType] = React.useState<"20ft" | "40ft">(
      "40ft",
    );
    const [numberOfCars, setNumberOfCars] = React.useState(4);
    const [customsDuty, setCustomsDuty] = React.useState(5);
    const [vat, setVat] = React.useState(21);
    const [homologationFee, setHomologationFee] = React.useState(250);
    const [translationPages, setTranslationPages] = React.useState(3);
    const [miscellaneous, setMiscellaneous] = React.useState(0);

    return (
      <VehicleDetailsSection
        language="en"
        scenario="physical"
        setScenario={setScenario}
        numberOfCars={numberOfCars}
        setNumberOfCars={setNumberOfCars}
        containerType={containerType}
        setContainerType={setContainerType}
        freightPerCar={4150}
        freightPerContainerEUR={4150}
        customsDuty={customsDuty}
        setCustomsDuty={setCustomsDuty}
        vat={vat}
        setVat={setVat}
        speditorFee={181.5}
        homologationFee={homologationFee}
        setHomologationFee={setHomologationFee}
        translationPages={translationPages}
        setTranslationPages={setTranslationPages}
        translationPerCar={105}
        portAgentFeePerCar={670}
        miscellaneous={miscellaneous}
        setMiscellaneous={setMiscellaneous}
      />
    );
  };

  const user = userEvent.setup();
  return { user, setScenario, Wrapper };
};

describe("VehicleDetailsSection", () => {
  it("clamps number of cars when switching to smaller container", async () => {
    const { user, Wrapper } = renderWithState();
    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: /20ft/i }));

    expect(screen.queryByRole("button", { name: "3" })).not.toBeInTheDocument();
    expect(screen.getByText(/Max 2 cars/i)).toBeInTheDocument();
  });

  it("shows derived freight and notes for container settings", async () => {
    const { Wrapper, user } = renderWithState();
    render(<Wrapper />);

    expect(screen.getAllByText("€4 150").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: /Advanced Settings/i })[0]);
    const portInput = screen.getByLabelText(/Port.*Agent/i) as HTMLInputElement;
    expect(portInput.value.replace(/\s+/g, "")).toBe("670");
  });

  it("updates port note and max cars when container changes to 20ft", async () => {
    const { Wrapper, user } = renderWithState();
    render(<Wrapper />);

    const containerButtons = screen.getAllByRole("button", { name: /20ft/i });
    await user.click(containerButtons[containerButtons.length - 1]);

    expect(screen.getAllByText(/Max 2 cars/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\(350÷2\) \+ 250/)).toBeInTheDocument();
  });

  it("clamps translation pages to zero on negative input", async () => {
    const { Wrapper, user } = renderWithState();
    render(<Wrapper />);

    for (const btn of screen.getAllByRole("button", { name: /Advanced Settings/i })) {
      await user.click(btn);
    }

    const translationInput = (await screen.findByLabelText(/Translation Pages/i)) as HTMLInputElement;
    translationInput.focus();
    await user.clear(translationInput);
    await user.type(translationInput, "-3");
    // Ensure change event fired
    fireEvent.change(translationInput, { target: { value: "-3" } });

    expect(translationInput.value).toBe("0");
    expect(screen.getByText(/× 0\s*=/)).toBeInTheDocument();
  });

  it("toggles advanced settings and validates clamp of customs/vat/misc", async () => {
    const { user, Wrapper } = renderWithState();
    render(<Wrapper />);

    const advancedButtons = screen.getAllByRole("button", { name: /Advanced Settings/i });
    for (const btn of advancedButtons) {
      await user.click(btn);
    }

    const customsInput = (await screen.findByLabelText(/Customs Duty/i)) as HTMLInputElement;
    await user.clear(customsInput);
    await user.type(customsInput, "40");
    expect(Number(customsInput.value)).toBeLessThanOrEqual(30);

    const vatInput = (await screen.findByLabelText(/VAT/i)) as HTMLInputElement;
    await user.clear(vatInput);
    await user.type(vatInput, "30");
    expect(Number(vatInput.value)).toBeLessThanOrEqual(25);

    const miscInput = (await screen.findByLabelText(/Miscellaneous/i)) as HTMLInputElement;
    await user.clear(miscInput);
    await user.type(miscInput, "-5");
    expect(Number(miscInput.value)).toBeGreaterThanOrEqual(0);
  });

  it("caps advanced numeric inputs to safety limits", async () => {
    const { user, Wrapper } = renderWithState();
    render(<Wrapper />);

    const advancedButtons = screen.getAllByRole("button", { name: /Advanced Settings/i });
    for (const btn of advancedButtons) {
      await user.click(btn);
    }

    const homologationInput = (await screen.findByLabelText(/Homologation/i)) as HTMLInputElement;
    await user.clear(homologationInput);
    await user.type(homologationInput, String(MAX_HOMOLOGATION_EUR + 5000));
    expect(Number(homologationInput.value)).toBe(MAX_HOMOLOGATION_EUR);

    const translationInput = (await screen.findByLabelText(/Translation Pages/i)) as HTMLInputElement;
    await user.clear(translationInput);
    await user.type(translationInput, String(MAX_TRANSLATION_PAGES + 50));
    expect(Number(translationInput.value)).toBe(MAX_TRANSLATION_PAGES);

    const miscInput = (await screen.findByLabelText(/Miscellaneous/i)) as HTMLInputElement;
    await user.clear(miscInput);
    await user.type(miscInput, String(MAX_MISC_EUR + 1000));
    expect(Number(miscInput.value)).toBe(MAX_MISC_EUR);
  });

  it("exposes correct min/max attributes on capped inputs", async () => {
    const { user, Wrapper } = renderWithState();
    render(<Wrapper />);

    const advancedButtons = screen.getAllByRole("button", { name: /Advanced Settings/i });
    for (const btn of advancedButtons) {
      await user.click(btn);
    }

    const homologationInput = (await screen.findByLabelText(/Homologation/i)) as HTMLInputElement;
    expect(homologationInput.min).toBe("0");
    expect(homologationInput.max).toBe(String(MAX_HOMOLOGATION_EUR));

    const translationInput = (await screen.findByLabelText(/Translation Pages/i)) as HTMLInputElement;
    expect(translationInput.min).toBe("0");
    expect(translationInput.max).toBe(String(MAX_TRANSLATION_PAGES));

    const miscInput = (await screen.findByLabelText(/Miscellaneous/i)) as HTMLInputElement;
    expect(miscInput.min).toBe("0");
    expect(miscInput.max).toBe(String(MAX_MISC_EUR));
  });
});
