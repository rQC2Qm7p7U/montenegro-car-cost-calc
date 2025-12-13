import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { formatKRW, parseKRWInput, convertKRWToEUR, formatEUR } from "@/utils/currency";

interface KRWInputProps {
  value: string;
  onChange: (value: string) => void;
  krwPerUsdRate: number;
  usdPerEurRate: number;
  disabled?: boolean;
}

const KRWInput = ({ value, onChange, krwPerUsdRate, usdPerEurRate, disabled }: KRWInputProps) => {
  const [rawKRWMode, setRawKRWMode] = useState(false);
  
  const parsedInput = parseKRWInput(value);
  const actualKRW = rawKRWMode ? parsedInput : parsedInput * 10000;
  const eurValue = convertKRWToEUR(actualKRW, krwPerUsdRate, usdPerEurRate);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="krwPrice" className="text-sm font-medium">
          Car Price (KRW, {rawKRWMode ? 'full' : '만원'})
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">
                Korean shorthand: '만원' means ×10,000.<br />
                Example: 2 280만원 = 22 800 000 KRW
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Input
        id="krwPrice"
        type="text"
        value={value}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^\d,]/g, '');
          onChange(cleaned);
        }}
        placeholder={rawKRWMode ? "22 800 000" : "2 280"}
        disabled={disabled}
        className="mt-1.5"
      />
      
      <div className="flex items-center gap-2 text-sm">
        <Switch
          id="rawKRWMode"
          checked={rawKRWMode}
          onCheckedChange={setRawKRWMode}
          disabled={disabled}
        />
        <Label htmlFor="rawKRWMode" className="text-xs text-muted-foreground cursor-pointer">
          I'm entering full KRW (no 만원 shorthand)
        </Label>
      </div>
      
      {parsedInput > 0 && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>{formatKRW(actualKRW)} KRW</div>
          <div className="text-primary font-medium">
            ≈ €{formatEUR(eurValue)} at rate ₩
            {new Intl.NumberFormat("ru-RU").format(Math.round(krwPerUsdRate)).replace(/\u00A0/g, " ")} / $
          </div>
        </div>
      )}
    </div>
  );
};

export default KRWInput;
