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

const KPICard = ({ title, value, change, changeType = "neutral", icon: Icon, onClick, accentColor }: KPICardProps) => {
    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg animate-fade-in group h-full flex flex-col justify-between ${onClick ? 'cursor-pointer hover:border-primary/40 hover:-translate-y-1' : ''}`}
        >
            {/* Top Border Accent */}
            <div className={`absolute top-0 left-0 w-full h-[3px] opacity-80 ${accentColor}`} />

            {/* Corner Glowing Blob */}
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 transition-opacity duration-300 group-hover:opacity-40 ${accentColor}`} />

            <div className="flex flex-col gap-1 w-full relative z-10">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        {title}
                    </p>
                    <div className={`rounded-full p-2.5 transition-colors ${accentColor} bg-opacity-10 group-hover:bg-opacity-20`}>
                        <Icon className={`h-4.5 w-4.5 text-foreground/80`} />
                    </div>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                    <h3 className="text-2xl font-black tracking-tight text-foreground">
                        {value}
                    </h3>
                </div>

                {change && (
                    <div className="mt-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${changeType === "positive"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                            : changeType === "negative"
                                ? "bg-red-50 text-red-600 border border-red-100/50"
                                : "bg-muted/50 text-muted-foreground border border-border/50"
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
