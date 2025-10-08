import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator as CalcIcon } from "lucide-react";
import ResultCard from "./ResultCard";

const Calculator = () => {
  const [carPrice, setCarPrice] = useState<number>(5500);
  const [freight, setFreight] = useState<number>(700);
  const [customsDuty, setCustomsDuty] = useState<number>(5);
  const [vat, setVat] = useState<number>(21);
  const [speditorFee, setSpeditorFee] = useState<number>(150);
  const [homologationFee, setHomologationFee] = useState<number>(77);
  const [translation, setTranslation] = useState<number>(105);
  const [portAgentFee, setPortAgentFee] = useState<number>(930);
  const [miscellaneous, setMiscellaneous] = useState<number>(50);
  const [scenario, setScenario] = useState<string>("physical");

  // Calculations
  const cif = carPrice + freight;
  const customs = (cif * customsDuty) / 100;
  const vatAmount = ((cif + customs) * vat) / 100;
  const totalCostWithoutCar = customs + vatAmount + speditorFee + homologationFee + translation + portAgentFee + miscellaneous;
  const finalCost = carPrice + totalCostWithoutCar;
  const vatRefund = scenario === "company" ? vatAmount : 0;
  const netCostForCompany = scenario === "company" ? finalCost - vatRefund : finalCost;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-card">
            <CalcIcon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Montenegro Car Import Calculator
          </h1>
          <p className="text-muted-foreground text-lg">
            Calculate the total cost of importing your vehicle
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="p-6 shadow-card transition-smooth hover:shadow-hover">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Vehicle Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="scenario" className="text-sm font-medium">
                  Import Scenario
                </Label>
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger id="scenario" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical Person</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carPrice" className="text-sm font-medium">
                    Car Price (€)
                  </Label>
                  <Input
                    id="carPrice"
                    type="number"
                    value={carPrice}
                    onChange={(e) => setCarPrice(Number(e.target.value))}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="freight" className="text-sm font-medium">
                    Freight (€)
                  </Label>
                  <Input
                    id="freight"
                    type="number"
                    value={freight}
                    onChange={(e) => setFreight(Number(e.target.value))}
                    className="mt-1.5"
                  />
                </div>
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
                    type="number"
                    value={speditorFee}
                    onChange={(e) => setSpeditorFee(Number(e.target.value))}
                    className="mt-1.5"
                  />
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
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="translation" className="text-sm font-medium">
                    Translation (€)
                  </Label>
                  <Input
                    id="translation"
                    type="number"
                    value={translation}
                    onChange={(e) => setTranslation(Number(e.target.value))}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="portAgentFee" className="text-sm font-medium">
                    Port & Agent Fee (€)
                  </Label>
                  <Input
                    id="portAgentFee"
                    type="number"
                    value={portAgentFee}
                    onChange={(e) => setPortAgentFee(Number(e.target.value))}
                    className="mt-1.5"
                  />
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

          {/* Results */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Calculation Results
            </h2>
            
            <ResultCard
              label="CIF Value"
              value={cif}
              description="Car price + Freight"
            />
            
            <ResultCard
              label="Customs Duty"
              value={customs}
              description={`${customsDuty}% of CIF`}
            />
            
            <ResultCard
              label="VAT"
              value={vatAmount}
              description={`${vat}% of (CIF + Customs)`}
            />
            
            <ResultCard
              label="Total Cost (without car)"
              value={totalCostWithoutCar}
              description="All fees and taxes"
              highlight
            />
            
            <ResultCard
              label="Final Cost"
              value={finalCost}
              description="Total amount including car"
              highlight
            />

            {scenario === "company" && (
              <>
                <ResultCard
                  label="VAT Refund"
                  value={vatRefund}
                  description="Refundable for companies"
                  positive
                />
                
                <ResultCard
                  label="Net Cost for Company"
                  value={netCostForCompany}
                  description="Final cost after VAT refund"
                  highlight
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
