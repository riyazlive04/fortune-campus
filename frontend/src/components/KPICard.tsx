import { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: LucideIcon;
    accentColor: string;
    onClick?: () => void;
}

const KPICard = ({ title, value, change, changeType = "neutral", icon: Icon, onClick }: KPICardProps) => {
    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md animate-fade-in group ${onClick ? 'cursor-pointer hover:border-primary/50' : ''}`}
        >
            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        {title}
                    </p>
                    <div className="rounded-full bg-primary/5 p-2 transition-colors group-hover:bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                    </div>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold tracking-tight text-foreground">
                        {value}
                    </h3>
                </div>

                {change && (
                    <div className="mt-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${changeType === "positive"
                            ? "bg-emerald-50 text-emerald-600"
                            : changeType === "negative"
                                ? "bg-red-50 text-red-600"
                                : "bg-gray-50 text-gray-600"
                            }`}>
                            {change}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KPICard;
