import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  label: string;
  value: number;
  description?: string;
  highlight?: boolean;
  positive?: boolean;
}

const ResultCard = ({ label, value, description, highlight, positive }: ResultCardProps) => {
  return (
    <Card
      className={cn(
        "p-4 transition-smooth hover:shadow-hover",
        highlight && "bg-primary/5 border-primary/20",
        positive && "bg-accent/5 border-accent/20"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className={cn(
            "text-sm font-medium mb-1",
            highlight ? "text-primary" : positive ? "text-accent" : "text-muted-foreground"
          )}>
            {label}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn(
          "text-2xl font-bold",
          highlight ? "text-primary" : positive ? "text-accent" : "text-foreground"
        )}>
          {value.toFixed(2)} €
        </div>
      </div>
    </Card>
  );
};

export default ResultCard;
