import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Container, Package } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface VehicleDetailsSectionProps {
  scenario: "physical" | "company";
  setScenario: (value: "physical" | "company") => void;
  numberOfCars: number;
  setNumberOfCars: (value: number) => void;
  containerType: "20ft" | "40ft";
  setContainerType: (value: "20ft" | "40ft") => void;
  freightPerCar: number;
  freightPerContainerEUR: number;
  customsDuty: number;
  setCustomsDuty: (value: number) => void;
  vat: number;
  setVat: (value: number) => void;
  speditorFee: number;
  homologationFee: number;
  setHomologationFee: (value: number) => void;
  translationPages: number;
  setTranslationPages: (value: number) => void;
  translationPerCar: number;
  portAgentFeePerCar: number;
  miscellaneous: number;
  setMiscellaneous: (value: number) => void;
}

export const VehicleDetailsSection = ({
  scenario,
  setScenario,
  numberOfCars,
  setNumberOfCars,
  containerType,
  setContainerType,
  freightPerCar,
  freightPerContainerEUR,
  customsDuty,
  setCustomsDuty,
  vat,
  setVat,
  speditorFee,
  homologationFee,
  setHomologationFee,
  translationPages,
  setTranslationPages,
  translationPerCar,
  portAgentFeePerCar,
  miscellaneous,
  setMiscellaneous,
}: VehicleDetailsSectionProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const parseNumber = (value: string) => Number(value.replace(",", "."));
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  const displayMoney = (value: number) =>
    new Intl.NumberFormat("ru-RU")
      .format(Math.round(value))
      .replace(/\u00A0/g, " ");
  
  const containerInfo = containerType === "20ft" 
    ? { maxCars: 2, freightUSD: 3150, localEUR: 350 }
    : { maxCars: 4, freightUSD: 4150, localEUR: 420 };

  const customsInvalid = customsDuty < 0 || customsDuty > 30;
  const vatInvalid = vat < 0 || vat > 25;
  const miscInvalid = miscellaneous < 0;

  return (
    <Card className="p-5 shadow-card transition-smooth hover:shadow-hover animate-fade-in glass-card" style={{ animationDelay: "0.1s" }}>
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Settings2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Import Settings
          </h2>
          <p className="text-xs text-muted-foreground">Container & fees configuration</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Main settings - always visible */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scenario" className="text-sm font-medium">
              Import As
            </Label>
            <Select value={scenario} onValueChange={(value) => setScenario(value as "physical" | "company")}>
              <SelectTrigger id="scenario" className="mt-1.5 input-focus-ring">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical Person</SelectItem>
                <SelectItem value="company">Company (VAT refund)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="numberOfCars" className="text-sm font-medium">
              Number of Cars
            </Label>
            <div className="flex gap-2 mt-1.5">
              {[1, 2, 3, 4].slice(0, containerInfo.maxCars).map((num) => (
                <Button
                  key={num}
                  variant={numberOfCars === num ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-10"
                  onClick={() => setNumberOfCars(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Container type with visual */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <Label className="text-sm font-medium mb-3 block">Container Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setContainerType("20ft");
                if (numberOfCars > 2) setNumberOfCars(2);
              }}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                containerType === "20ft"
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Container className="w-4 h-4" />
                <span className="font-medium text-sm">20ft</span>
              </div>
              <p className="text-xs text-muted-foreground">Max 2 cars</p>
              <p className="text-xs font-medium text-primary mt-1">$3,150</p>
            </button>
            <button
              onClick={() => setContainerType("40ft")}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                containerType === "40ft"
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4" />
                <span className="font-medium text-sm">40ft HC</span>
              </div>
              <p className="text-xs text-muted-foreground">Max 4 cars</p>
              <p className="text-xs font-medium text-primary mt-1">$4,150</p>
            </button>
          </div>
        </div>

        {/* Freight summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-sm text-muted-foreground">Freight per car</span>
          <span className="text-lg font-bold text-primary">€{displayMoney(freightPerCar)}</span>
        </div>

        {/* Advanced settings - collapsible */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-10 px-3">
              <span className="text-sm font-medium">Advanced Settings</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customsDuty" className="text-sm font-medium">
                  Customs Duty (%)
                </Label>
                <Input
                  id="customsDuty"
                  type="number"
                  value={customsDuty}
                  min={0}
                  max={30}
                  step="0.1"
                  onChange={(e) => setCustomsDuty(clamp(parseNumber(e.target.value), 0, 30))}
                  className={`mt-1.5 input-focus-ring ${customsInvalid ? "border-destructive/60" : ""}`}
                />
                {customsInvalid && (
                  <p className="text-xs text-destructive mt-1">0–30% expected</p>
                )}
              </div>
              <div>
                <Label htmlFor="vat" className="text-sm font-medium">
                  VAT (%)
                </Label>
                <Input
                  id="vat"
                  type="number"
                  value={vat}
                  min={0}
                  max={25}
                  step="0.1"
                  onChange={(e) => setVat(clamp(parseNumber(e.target.value), 0, 25))}
                  className={`mt-1.5 input-focus-ring ${vatInvalid ? "border-destructive/60" : ""}`}
                />
                {vatInvalid && (
                  <p className="text-xs text-destructive mt-1">0–25% expected</p>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="speditorFee" className="text-sm font-medium">
                  Speditor Fee (€/car)
                </Label>
                <Input
                  id="speditorFee"
                  type="text"
                  value={displayMoney(speditorFee)}
                  readOnly
                  className="mt-1.5 bg-muted/50 cursor-not-allowed text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">150€ + 21% VAT</p>
              </div>
              <div>
                <Label htmlFor="homologationFee" className="text-sm font-medium">
                  Homologation (€/car)
                </Label>
                <Input
                  id="homologationFee"
                  type="number"
                  value={homologationFee}
                  min={0}
                  onChange={(e) => setHomologationFee(Math.max(0, parseNumber(e.target.value)))}
                  className="mt-1.5 input-focus-ring"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="translationPages" className="text-sm font-medium">
                  Translation Pages
                </Label>
                <Input
                  id="translationPages"
                  type="number"
                  min="0"
                  value={translationPages}
                  onChange={(e) => setTranslationPages(Math.max(0, parseNumber(e.target.value)))}
                  className="mt-1.5 input-focus-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  35€ × {translationPages} = €{displayMoney(translationPerCar)}/car
                </p>
              </div>
              <div>
                <Label htmlFor="portAgentFee" className="text-sm font-medium">
                  Port & Agent (€/car)
                </Label>
                <Input
                  id="portAgentFee"
                  type="text"
                  value={displayMoney(portAgentFeePerCar)}
                  readOnly
                  className="mt-1.5 bg-muted/50 cursor-not-allowed text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ({containerInfo.localEUR}÷{numberOfCars}) + 250
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="miscellaneous" className="text-sm font-medium">
                Miscellaneous (€/car)
              </Label>
              <Input
                id="miscellaneous"
                type="number"
                value={miscellaneous}
                min={0}
                onChange={(e) => setMiscellaneous(Math.max(0, parseNumber(e.target.value)))}
                className={`mt-1.5 input-focus-ring ${miscInvalid ? "border-destructive/60" : ""}`}
              />
              {miscInvalid && (
                <p className="text-xs text-destructive mt-1">Must be ≥ 0</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
};
