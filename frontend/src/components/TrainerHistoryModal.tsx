
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { trainerAttendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, History, Calendar, Clock, AlertCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { format } from "date-fns";

interface TrainerHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainerId: string | null;
    trainerName: string | null;
}

const TrainerHistoryModal = ({ isOpen, onClose, trainerId, trainerName }: TrainerHistoryModalProps) => {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!trainerId || !isOpen) return;

            try {
                setLoading(true);
                const res = await trainerAttendanceApi.getHistory({ trainerId });
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

        fetchHistory();
    }, [trainerId, isOpen, toast]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-card border-border shadow-2xl">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="flex items-center gap-3 text-xl font-black text-foreground">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <History className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="leading-none">{trainerName || "Trainer"}</p>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-1.5 opacity-60">
                                <Calendar className="h-3 w-3" /> Attendance History
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                            <p className="text-xs font-black uppercase text-muted-foreground tracking-widest animate-pulse">Retrieving Logs…</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <Calendar className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">No attendance records found for this trainer.</p>
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-muted/20 scrollbar-hide">
                            <table className="w-full text-[13px]">
                                <thead className="bg-muted/80 backdrop-blur-sm sticky top-0 z-10">
                                    <tr className="border-b border-border text-left">
                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Status</th>
                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">In-Time</th>
                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Out-Time</th>
                                        <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {history.map((record) => (
                                        <tr key={record.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                                                {format(new Date(record.date), "dd MMM yyyy")}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge
                                                    status={record.status}
                                                    variant={
                                                        record.status === 'PRESENT' ? 'success' :
                                                            record.status === 'ABSENT' ? 'danger' :
                                                                'warning'
                                                    }
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-muted-foreground">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Clock className="h-3 w-3 opacity-40" />
                                                    {record.inTime ? format(new Date(record.inTime), "hh:mm a") : "—"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-medium text-muted-foreground">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Clock className="h-3 w-3 opacity-40" />
                                                    {record.outTime ? format(new Date(record.outTime), "hh:mm a") : "—"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-[200px] truncate text-muted-foreground font-medium">
                                                {record.remarks || <span className="opacity-30 italic">No remarks</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        Total Records: {history.length}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TrainerHistoryModal;
