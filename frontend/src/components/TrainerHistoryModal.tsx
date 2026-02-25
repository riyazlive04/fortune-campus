import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { trainerAttendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, History, Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";

interface TrainerHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainerId: string | null;
    trainerName: string | null;
}

const TrainerHistoryModal = ({ isOpen, onClose, trainerId, trainerName }: TrainerHistoryModalProps) => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [viewDate, setViewDate] = useState(new Date());
    const { toast } = useToast();

    const fetchHistory = async () => {
        if (!trainerId || !isOpen) return;

        try {
            setLoading(true);
            const startDate = startOfMonth(viewDate).toISOString().split('T')[0];
            const endDate = endOfMonth(viewDate).toISOString().split('T')[0];

            const res = await trainerAttendanceApi.getHistory({
                trainerId,
                startDate,
                endDate
            });
            setHistory(res.data || []);
        } catch (error: any) {
            console.error("Failed to fetch trainer history", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch attendance history",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [trainerId, isOpen, viewDate]);

    const days = eachDayOfInterval({
        start: startOfMonth(viewDate),
        end: endOfMonth(viewDate),
    });

    const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
    const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));
    const handleToday = () => setViewDate(new Date());

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl bg-background border-none shadow-[0_30px_60px_rgba(0,0,0,0.25)] overflow-hidden p-0 max-h-[90vh] flex flex-col rounded-2xl">
                <DialogHeader className="p-6 pb-5 border-b bg-gradient-to-r from-primary/[0.03] via-background to-background relative overflow-hidden">
                    {/* Decorative Background Element */}
                    <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center transition-transform hover:scale-105">
                                <History className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground leading-none">
                                    {trainerName || "Trainer"}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] font-bold uppercase text-primary tracking-widest">
                                        Attendance Ledger
                                    </span>
                                    <span className="h-0.5 w-0.5 rounded-full bg-muted-foreground/30" />
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1 opacity-70">
                                        <Calendar className="h-3 w-3" /> Monthly Review
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-border/40">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrevMonth}
                                className="h-8 w-8 rounded-lg hover:bg-background"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-[150px] text-center px-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">
                                    {format(viewDate, "MMMM yyyy")}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNextMonth}
                                className="h-8 w-8 rounded-lg hover:bg-background"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <div className="h-4 w-[1px] bg-border/40 mx-0.5" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToday}
                                className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest hover:bg-background rounded-lg"
                            >
                                Today
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col p-6">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
                            <div className="text-center space-y-1">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60">Fetching Records</h3>
                                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest opacity-50">Please wait while we sync the data…</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto rounded-xl border border-border/40 bg-muted/5 shadow-inner">
                            <table className="w-full text-xs border-separate border-spacing-0">
                                <thead className="bg-background/95 backdrop-blur-sm sticky top-0 z-20">
                                    <tr className="text-left">
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px] text-muted-foreground/60 border-b border-border/20">Date</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px] text-muted-foreground/60 border-b border-border/20 text-center">Status</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px] text-muted-foreground/60 border-b border-border/20">Time Schedule</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px] text-muted-foreground/60 border-b border-border/20">Batch Assignment</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px] text-muted-foreground/60 border-b border-border/20">Observations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10">
                                    {days.map((day) => {
                                        const record = history.find(r => isSameDay(new Date(r.date), day));
                                        const isToday = isSameDay(day, new Date());
                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                        return (
                                            <tr key={day.toISOString()} className={`group transition-all duration-200 hover:bg-muted/50 ${isToday ? 'bg-primary/[0.03]' : ''} ${isWeekend ? 'bg-muted/5' : ''}`}>
                                                <td className="px-6 py-3.5 whitespace-nowrap align-middle border-r border-border/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex flex-col items-center justify-center h-9 w-9 rounded-lg border transition-all ${isToday ? 'bg-primary border-primary shadow-md shadow-primary/20' : 'bg-background border-border/40 shadow-sm'}`}>
                                                            <span className={`text-sm font-bold leading-none ${isToday ? 'text-primary-foreground' : 'text-foreground'}`}>
                                                                {format(day, "dd")}
                                                            </span>
                                                            <span className={`text-[7px] uppercase font-black tracking-tighter mt-0.5 ${isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                                {format(day, "EEE")}
                                                            </span>
                                                        </div>
                                                        {isToday && (
                                                            <span className="text-[8px] font-bold text-primary uppercase tracking-widest animate-pulse">Live</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-center align-middle border-r border-border/5">
                                                    {record ? (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase border ${record.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                record.status === 'ABSENT' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                            {record.status}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-medium text-muted-foreground/20 italic">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5 align-middle border-r border-border/5">
                                                    {record ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-2.5 w-2.5 text-emerald-500" />
                                                                <span className="text-[10px] font-semibold text-foreground/80">
                                                                    {record.inTime ? format(new Date(record.inTime), "hh:mm a") : "—"}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 opacity-40">
                                                                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                                                                <span className="text-[10px] font-medium text-muted-foreground">
                                                                    {record.outTime ? format(new Date(record.outTime), "hh:mm a") : "—"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-muted-foreground/10">—</span>}
                                                </td>
                                                <td className="px-6 py-3.5 align-middle border-r border-border/5">
                                                    {record?.batch ? (
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="text-[11px] font-bold text-foreground/80 truncate max-w-[150px]">{record.batch.name}</span>
                                                            <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tighter">{record.batch.code}</span>
                                                        </div>
                                                    ) : record ? (
                                                        <span className="italic text-[9px] font-medium text-muted-foreground/30">General Session</span>
                                                    ) : <span className="text-muted-foreground/10">—</span>}
                                                </td>
                                                <td className="px-6 py-3.5 align-middle max-w-[180px]">
                                                    {record?.remarks ? (
                                                        <p className="text-[9px] text-muted-foreground italic truncate" title={record.remarks}>
                                                            {record.remarks}
                                                        </p>
                                                    ) : <span className="text-muted-foreground/10">—</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-muted/20 flex justify-between items-center px-8 relative overflow-hidden">
                    <div className="flex items-center gap-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Present</span>
                                <span className="text-xs font-bold text-foreground">{history.filter(r => r.status === 'PRESENT').length} Days</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-3.5 w-3.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Absent</span>
                                <span className="text-xs font-bold text-foreground">{history.filter(r => r.status === 'ABSENT').length} Days</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-3.5 w-3.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">Others</span>
                                <span className="text-xs font-bold text-foreground">{history.filter(r => !['PRESENT', 'ABSENT'].includes(r.status) && r.status).length} Logs</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-background px-4 py-2 rounded-xl border border-border/40 shadow-sm">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            System Verified Record
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TrainerHistoryModal;
