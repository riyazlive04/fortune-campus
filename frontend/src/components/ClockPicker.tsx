import { useState, useRef, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

interface ClockPickerProps {
    value: string; // "HH:MM" 24h format
    onChange: (value: string) => void;
    label?: string;
}

const ClockPicker = ({ value, onChange, label }: ClockPickerProps) => {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"hour" | "minute">("hour");
    const [hour, setHour] = useState(9);
    const [minute, setMinute] = useState(0);
    const [ampm, setAmpm] = useState<"AM" | "PM">("AM");
    const clockRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse incoming value
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(":").map(Number);
            if (!isNaN(h) && !isNaN(m)) {
                setHour(h % 12 === 0 ? 12 : h % 12);
                setMinute(m);
                setAmpm(h >= 12 ? "PM" : "AM");
            }
        }
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const emitChange = useCallback((h: number, m: number, ap: "AM" | "PM") => {
        let h24 = h % 12;
        if (ap === "PM") h24 += 12;
        const hStr = String(h24).padStart(2, "0");
        const mStr = String(m).padStart(2, "0");
        onChange(`${hStr}:${mStr}`);
    }, [onChange]);

    const handleClockClick = (e: React.MouseEvent<SVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (mode === "hour") {
            const h = Math.round(angle / 30) % 12 || 12;
            setHour(h);
            emitChange(h, minute, ampm);
            setMode("minute");
        } else {
            const m = Math.round(angle / 6) % 60;
            setMinute(m);
            emitChange(hour, m, ampm);
        }
    };

    const handleAmPm = (ap: "AM" | "PM") => {
        setAmpm(ap);
        emitChange(hour, minute, ap);
    };

    const displayValue = value
        ? (() => {
            const [h, m] = value.split(":").map(Number);
            if (isNaN(h) || isNaN(m)) return "--:--";
            const ap = h >= 12 ? "PM" : "AM";
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
        })()
        : "--:--";

    // Clock hand angle
    const hourAngle = ((hour % 12) / 12) * 360 + (minute / 60) * 30;
    const minuteAngle = (minute / 60) * 360;
    const handAngle = mode === "hour" ? hourAngle : minuteAngle;

    // Numbers on clock face
    const numbers = mode === "hour"
        ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    const R = 80; // clock radius
    const numR = 62; // number ring radius

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1 block">{label}</label>
            )}
            <button
                type="button"
                onClick={() => { setOpen(o => !o); setMode("hour"); }}
                className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 hover:border-primary/50 transition-colors"
            >
                <span className={value ? "text-foreground" : "text-muted-foreground"}>
                    {displayValue}
                </span>
                <Clock className="h-4 w-4 text-muted-foreground" />
            </button>

            {open && (
                <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-2xl shadow-2xl p-4 w-56 select-none">
                    {/* Digital display */}
                    <div className="flex items-center justify-center gap-1 mb-3">
                        <button
                            type="button"
                            onClick={() => setMode("hour")}
                            className={`text-2xl font-black rounded-lg px-2 py-0.5 transition-colors ${mode === "hour" ? "bg-primary text-white" : "text-foreground hover:bg-muted"}`}
                        >
                            {String(hour).padStart(2, "0")}
                        </button>
                        <span className="text-2xl font-black text-muted-foreground">:</span>
                        <button
                            type="button"
                            onClick={() => setMode("minute")}
                            className={`text-2xl font-black rounded-lg px-2 py-0.5 transition-colors ${mode === "minute" ? "bg-primary text-white" : "text-foreground hover:bg-muted"}`}
                        >
                            {String(minute).padStart(2, "0")}
                        </button>
                        <div className="flex flex-col ml-1 gap-0.5">
                            <button
                                type="button"
                                onClick={() => handleAmPm("AM")}
                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${ampm === "AM" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
                            >AM</button>
                            <button
                                type="button"
                                onClick={() => handleAmPm("PM")}
                                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${ampm === "PM" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`}
                            >PM</button>
                        </div>
                    </div>

                    {/* Analog clock */}
                    <div className="flex justify-center">
                        <svg
                            ref={clockRef as any}
                            width={R * 2 + 20}
                            height={R * 2 + 20}
                            viewBox={`${-R - 10} ${-R - 10} ${(R + 10) * 2} ${(R + 10) * 2}`}
                            onClick={handleClockClick}
                            className="cursor-pointer"
                        >
                            {/* Clock face — always white */}
                            <circle cx={0} cy={0} r={R} fill="white" stroke="#e2e8f0" strokeWidth={1.5} />
                            {/* Tick marks */}
                            {Array.from({ length: 12 }).map((_, i) => {
                                const a = (i / 12) * 2 * Math.PI - Math.PI / 2;
                                return (
                                    <line
                                        key={i}
                                        x1={(R - 6) * Math.cos(a)}
                                        y1={(R - 6) * Math.sin(a)}
                                        x2={R * Math.cos(a)}
                                        y2={R * Math.sin(a)}
                                        stroke="#cbd5e1"
                                        strokeWidth={1.5}
                                    />
                                );
                            })}

                            {/* Hour/minute markers */}
                            {numbers.map((num, i) => {
                                const angle = ((i / 12) * 360 - 90) * (Math.PI / 180);
                                const x = numR * Math.cos(angle);
                                const y = numR * Math.sin(angle);
                                const isActive = mode === "hour" ? num === hour : num === minute;
                                return (
                                    <g key={num}>
                                        <circle cx={x} cy={y} r={14} fill={isActive ? "#10b981" : "transparent"} />
                                        <text
                                            x={x}
                                            y={y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize={11}
                                            fontWeight={isActive ? "bold" : "normal"}
                                            fill={isActive ? "white" : "#1e293b"}
                                        >
                                            {mode === "hour" ? num : String(num).padStart(2, "0")}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Hand */}
                            <line
                                x1={0}
                                y1={0}
                                x2={(numR - 4) * Math.sin(handAngle * Math.PI / 180)}
                                y2={-(numR - 4) * Math.cos(handAngle * Math.PI / 180)}
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeLinecap="round"
                            />
                            {/* Center dot */}
                            <circle cx={0} cy={0} r={4} fill="#10b981" />
                            {/* Hand tip dot */}
                            <circle
                                cx={(numR - 4) * Math.sin(handAngle * Math.PI / 180)}
                                cy={-(numR - 4) * Math.cos(handAngle * Math.PI / 180)}
                                r={6}
                                fill="#10b981"
                            />
                        </svg>
                    </div>

                    {/* Mode hint */}
                    <p className="text-center text-[11px] text-muted-foreground mt-1">
                        {mode === "hour" ? "Select hour" : "Select minute"}
                    </p>

                    {/* OK button */}
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="mt-2 w-full rounded-xl bg-primary py-1.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                        OK
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClockPicker;
