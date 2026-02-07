import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  accentColor: string;
}

const KPICard = ({ title, value, change, changeType = "neutral", icon: Icon, accentColor }: KPICardProps) => {
  return (
    <div className="kpi-card animate-fade-in">
      <div className={`kpi-card-accent ${accentColor}`} />
      <div className="flex items-start justify-between pl-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${
              changeType === "positive" ? "text-emerald-600" :
              changeType === "negative" ? "text-red-500" :
              "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-muted p-2.5">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
