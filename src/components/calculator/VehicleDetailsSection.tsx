import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import KRWInput from "@/components/KRWInput";

interface VehicleDetailsSectionProps {
  scenario: "physical" | "company";
  setScenario: (value: "physical" | "company") => void;
  numberOfCars: number;
  setNumberOfCars: (value: number) => void;
  containerType: "20ft" | "40ft";
  setContainerType: (value: "20ft" | "40ft") => void;
  useKRW: boolean;
  setUseKRW: (value: boolean) => void;
  carPriceKRW: string;
  setCarPriceKRW: (value: string) => void;
  carPriceEUR: number;
  setCarPriceEUR: (value: number) => void;
  krwToEurRate: number;
  freight: number;
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
  translation: number;
  portAgentFee: number;
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
  useKRW,
  setUseKRW,
  carPriceKRW,
  setCarPriceKRW,
  carPriceEUR,
  setCarPriceEUR,
  krwToEurRate,
  freight,
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
  translation,
  portAgentFee,
  miscellaneous,
  setMiscellaneous,
}: VehicleDetailsSectionProps) => {
  return (
    <Card className="p-6 shadow-card transition-smooth hover:shadow-hover animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Vehicle Details
      </h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="scenario" className="text-sm font-medium">
            Import Scenario
          </Label>
          <Select value={scenario} onValueChange={(value) => setScenario(value as "physical" | "company")}>
            <SelectTrigger id="scenario" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical Person</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="containerType" className="text-sm font-medium">
            Container Type
          </Label>
          <Select value={containerType} onValueChange={(value) => {
            setContainerType(value as "20ft" | "40ft");
            const maxCars = value === "20ft" ? 2 : 4;
            if (numberOfCars > maxCars) setNumberOfCars(maxCars);
          }}>
            <SelectTrigger id="containerType" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20ft">20ft (max 2 cars)</SelectItem>
              <SelectItem value="40ft">40ft (max 4 cars)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="numberOfCars" className="text-sm font-medium">
            Number of Cars
          </Label>
          <Input
            id="numberOfCars"
            type="text"
            inputMode="numeric"
            value={numberOfCars}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d]/g, '');
              if (cleaned === '') {
                setNumberOfCars(1);
                return;
              }
              const num = Number(cleaned);
              const maxCars = containerType === "20ft" ? 2 : 4;
              setNumberOfCars(Math.max(1, Math.min(maxCars, num)));
            }}
            onFocus={(e) => e.target.select()}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {containerType === "20ft" ? "1–2 cars per 20ft container" : "1–4 cars per 40ft container"}
          </p>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Switch
              id="useKRW"
              checked={useKRW}
              onCheckedChange={(checked) => {
                setUseKRW(checked);
                if (checked) setCarPriceEUR(0);
                else setCarPriceKRW("");
              }}
            />
            <Label htmlFor="useKRW" className="text-sm font-medium cursor-pointer">
              Use KRW instead of EUR
            </Label>
          </div>

          {useKRW ? (
            <KRWInput value={carPriceKRW} onChange={setCarPriceKRW} krwToEurRate={krwToEurRate} />
          ) : (
            <div>
              <Label htmlFor="carPriceEUR" className="text-sm font-medium">
                Car Price (€)
              </Label>
              <Input
                id="carPriceEUR"
                type="text"
                inputMode="decimal"
                value={carPriceEUR > 0 ? carPriceEUR.toLocaleString('en-US') : ''}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^\d]/g, '');
                  setCarPriceEUR(cleaned === '' ? 0 : Number(cleaned));
                }}
                placeholder="0"
                className="mt-1.5"
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="freight" className="text-sm font-medium">
            Freight (€/car)
          </Label>
          <Input
            id="freight"
            type="text"
            value={freight.toFixed(2)}
            readOnly
            className="mt-1.5 bg-secondary/50 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {containerType === "20ft" 
              ? `20ft: USD 3150 + EUR 350 ≈ ${freightPerContainerEUR.toFixed(2)} € total`
              : `40ft: USD 4150 + EUR 420 ≈ ${freightPerContainerEUR.toFixed(2)} € total`
            }
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customsDuty" className="text-sm font-medium">
              Customs Duty (%)
            </Label>
            <Input
              id="customsDuty"
              type="number"
              value={customsDuty}
              onChange={(e) => setCustomsDuty(Number(e.target.value))}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="vat" className="text-sm font-medium">
              VAT (%)
            </Label>
            <Input
              id="vat"
              type="number"
              value={vat}
              onChange={(e) => setVat(Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="speditorFee" className="text-sm font-medium">
              Speditor Fee (€)
            </Label>
            <Input
              id="speditorFee"
              type="text"
              value={speditorFee.toFixed(2)}
              readOnly
              className="mt-1.5 bg-secondary/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">150 € + 21% VAT = 181.50 €/car</p>
          </div>

          <div>
            <Label htmlFor="homologationFee" className="text-sm font-medium">
              Homologation Fee (€)
            </Label>
            <Input
              id="homologationFee"
              type="number"
              value={homologationFee}
              onChange={(e) => setHomologationFee(Number(e.target.value))}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">Editable (default 250 €)</p>
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
              onChange={(e) => setTranslationPages(Math.max(0, Number(e.target.value)))}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">35 € per page = {translation.toFixed(2)} € total</p>
          </div>

          <div>
            <Label htmlFor="portAgentFee" className="text-sm font-medium">
              Port & Agent Fee (€/car)
            </Label>
            <Input
              id="portAgentFee"
              type="text"
              value={portAgentFee.toFixed(2)}
              readOnly
              className="mt-1.5 bg-secondary/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">420 base + 250 per car</p>
          </div>
        </div>

        <div>
          <Label htmlFor="miscellaneous" className="text-sm font-medium">
            Miscellaneous (€)
          </Label>
          <Input
            id="miscellaneous"
            type="number"
            value={miscellaneous}
            onChange={(e) => setMiscellaneous(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>
      </div>
    </Card>
  );
};
