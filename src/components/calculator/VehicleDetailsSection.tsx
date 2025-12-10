import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const containerInfo = containerType === "20ft" 
    ? { maxCars: 2, freightUSD: 3150, localEUR: 350 }
    : { maxCars: 4, freightUSD: 4150, localEUR: 420 };

  return (
    <Card className="p-6 shadow-card transition-smooth hover:shadow-hover animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Import Settings
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
              <SelectItem value="20ft">20ft (max 2 cars) - USD 3,150 + EUR 350</SelectItem>
              <SelectItem value="40ft">40ft HC (max 4 cars) - USD 4,150 + EUR 420</SelectItem>
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
              setNumberOfCars(Math.max(1, Math.min(containerInfo.maxCars, num)));
            }}
            onFocus={(e) => e.target.select()}
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            1–{containerInfo.maxCars} cars per {containerType} container
          </p>
        </div>

        <div className="border-t pt-4">
          <Label htmlFor="freight" className="text-sm font-medium">
            Freight (€/car)
          </Label>
          <Input
            id="freight"
            type="text"
            value={freightPerCar.toFixed(2)}
            readOnly
            className="mt-1.5 bg-secondary/50 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {containerType}: USD {containerInfo.freightUSD.toLocaleString()} + EUR {containerInfo.localEUR} = {freightPerContainerEUR.toFixed(2)} € total ÷ {numberOfCars} = {freightPerCar.toFixed(2)} €/car
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
              Speditor Fee (€/car)
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
              Homologation Fee (€/car)
            </Label>
            <Input
              id="homologationFee"
              type="number"
              value={homologationFee}
              onChange={(e) => setHomologationFee(Number(e.target.value))}
              className="mt-1.5"
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
              onChange={(e) => setTranslationPages(Math.max(0, Number(e.target.value)))}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">35 € × {translationPages} pages = {translationPerCar.toFixed(2)} €/car</p>
          </div>

          <div>
            <Label htmlFor="portAgentFee" className="text-sm font-medium">
              Port & Agent Fee (€/car)
            </Label>
            <Input
              id="portAgentFee"
              type="text"
              value={portAgentFeePerCar.toFixed(2)}
              readOnly
              className="mt-1.5 bg-secondary/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">(420 ÷ {numberOfCars}) + 250 = {portAgentFeePerCar.toFixed(2)} €/car</p>
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
            onChange={(e) => setMiscellaneous(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>
      </div>
    </Card>
  );
};
