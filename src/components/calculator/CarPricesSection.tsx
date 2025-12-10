import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface CarPricesSectionProps {
  numberOfCars: number;
  carPrices: number[];
  setCarPrices: (prices: number[]) => void;
}

export const CarPricesSection = ({
  numberOfCars,
  carPrices,
  setCarPrices,
}: CarPricesSectionProps) => {
  const handlePriceChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^\d]/g, "");
    const numValue = cleaned === "" ? 0 : Number(cleaned);
    const newPrices = [...carPrices];
    newPrices[index] = numValue;
    setCarPrices(newPrices);
  };

  const setAllToSamePrice = () => {
    const firstPrice = carPrices[0] || 0;
    if (firstPrice > 0) {
      const newPrices = Array(numberOfCars).fill(firstPrice);
      setCarPrices(newPrices);
    }
  };

  return (
    <Card className="p-6 shadow-card transition-smooth hover:shadow-hover animate-fade-in" style={{ animationDelay: "0.15s" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">
          Car Prices
        </h2>
        {numberOfCars > 1 && carPrices[0] > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={setAllToSamePrice}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            Set all to Car #1 price
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {Array.from({ length: numberOfCars }).map((_, index) => (
          <div key={index}>
            <Label htmlFor={`carPrice${index}`} className="text-sm font-medium">
              Car #{index + 1} Price (€)
            </Label>
            <Input
              id={`carPrice${index}`}
              type="text"
              inputMode="decimal"
              value={carPrices[index] > 0 ? carPrices[index].toLocaleString("en-US") : ""}
              onChange={(e) => handlePriceChange(index, e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="mt-1.5"
            />
          </div>
        ))}
      </div>

      {numberOfCars > 1 && (
        <p className="text-xs text-muted-foreground mt-4">
          Each car can have a different price. Container costs are split equally.
        </p>
      )}
    </Card>
  );
};
