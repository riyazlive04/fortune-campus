import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

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
        <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`glass-card relative overflow-hidden rounded-[24px] p-6 transition-all duration-300 group h-full flex flex-col justify-between ${onClick ? 'cursor-pointer' : ''}`}
        >
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-10 transition-opacity duration-300 group-hover:opacity-30 ${accentColor}`} />

            <div className="flex flex-col gap-2 w-full relative z-10">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/60">
                        {title}
                    </p>
                    <div className={`rounded-2xl p-3 transition-all duration-300 ${accentColor} bg-opacity-10 group-hover:scale-110 shadow-sm shadow-black/5`}>
                        <Icon className={`h-5 w-5 text-foreground/80`} />
                    </div>
                </div>

                <div className="mt-4 flex flex-col">
                    <h3 className="text-3xl font-black tracking-tight text-foreground bg-clip-text">
                        {value}
                    </h3>
                </div>

                {change && (
                    <div className="mt-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-tight ${changeType === "positive"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : changeType === "negative"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                            }`}>
                            {change}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};


export default KPICard;
