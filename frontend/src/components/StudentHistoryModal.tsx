import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { attendanceApi } from "@/lib/api";
import { Loader2, ChevronLeft, ChevronRight, UserCircle, CalendarDays, BookOpen, Clock, StickyNote, Verified } from "lucide-react";

interface StudentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any | null; // Pass the entire student object to get identifiers
}

const StudentHistoryModal = ({ isOpen, onClose, student }: StudentHistoryModalProps) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (isOpen && student?.id) {
            fetchHistory();
        }
    }, [isOpen, student?.id, currentMonth]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const start = startOfMonth(currentMonth).toISOString();
            const end = endOfMonth(currentMonth).toISOString();

            const res = await attendanceApi.getAttendance({
                studentId: student.id,
                startDate: start,
                endDate: end,
            });

            // The backend returns an array of attendances based on generic attendance.controller.ts
            // Typically nested inside `.data.attendance` or just `.data`
            const data = res.data?.attendance || res.data || [];

            // Sort by date descending
            data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setHistory(data);
        } catch (error) {
            console.error("Failed to fetch student history", error);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    if (!isOpen || !student) return null;

    // Summarize Data
    const stats = history.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background/95 backdrop-blur-sm border-muted">
                {/* Header */}
                <div className="bg-muted/30 px-6 py-5 border-b border-border/50">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <UserCircle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-foreground">
                                    {student.user?.firstName
                                        ? `${student.user.firstName} ${student.user.lastName || ''}`
                                        : (student.name || student.student || 'Unknown Student')}
                                </DialogTitle>
                                <div className="flex items-center gap-3 mt-1 5">
                                    <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                                        ID: {student.enrollmentNumber || student.id?.substring(0, 8)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Month Navigation */}
                        <div className="flex items-center gap-1 bg-background border border-border/50 rounded-lg p-1 shadow-sm">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <div className="flex items-center justify-center min-w-[110px] px-2">
                                <span className="text-sm font-bold text-foreground">
                                    {format(currentMonth, "MMMM yyyy")}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={nextMonth} disabled={currentMonth > new Date()}>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </DialogHeader>
                </div>

                {/* Table Content */}
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar bg-background">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-sm font-medium">Loading ledger records...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                            <CalendarDays className="h-10 w-10 opacity-20" />
                            <p className="text-sm font-semibold">No attendance records for {format(currentMonth, "MMMM yyyy")}</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted/80 backdrop-blur-md z-10 border-b border-border/50 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">Period</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Trainer / Course</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Observations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {history.map((record) => {
                                    /* Check if record is today */
                                    const isToday = new Date(record.date).toDateString() === new Date().toDateString();

                                    /* Status styling */
                                    let statusColor = "bg-muted/50 text-muted-foreground border-border";
                                    let statusText = record.status;

                                    if (record.status === "PRESENT") {
                                        statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                        statusText = "Present";
                                    } else if (record.status === "ABSENT") {
                                        statusColor = "bg-rose-50 text-rose-700 border-rose-200";
                                        statusText = "Absent";
                                    } else if (record.status === "LATE") {
                                        statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                                        statusText = "Late";
                                    } else if (record.status === "HALFDAY") {
                                        statusColor = "bg-violet-50 text-violet-700 border-violet-200";
                                        statusText = "Half Day";
                                    } else if (record.status === "HOLIDAY" || record.status === "LEAVE") {
                                        statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                                        statusText = record.status === "HOLIDAY" ? "Holiday" : "Leave";
                                    }

                                    return (
                                        <tr key={record.id} className={`hover:bg-muted/20 transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
                                            {/* Date Column */}
                                            <td className="px-6 py-3.5 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex flex-col items-center justify-center h-9 w-9 rounded-md border ${isToday ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border/60 bg-muted/30 text-muted-foreground'}`}>
                                                        <span className="text-[10px] font-bold uppercase leading-none mb-0.5">{format(new Date(record.date), "MMM")}</span>
                                                        <span className="text-sm font-bold leading-none">{format(new Date(record.date), "dd")}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                                                            {format(new Date(record.date), "EEEE")}
                                                        </span>
                                                        {isToday && <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Today</span>}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status Column */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
                                                    {statusText}
                                                    {record.isVerified && (
                                                        <Verified className="w-3 h-3 ml-1 opacity-70" />
                                                    )}
                                                </span>
                                            </td>

                                            {/* Period Column */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex flex-col items-start gap-1 justify-center h-full">
                                                    {record.period ? (
                                                        <span className="inline-flex items-center justify-center bg-muted/60 text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-md border border-border/50">
                                                            P {record.period}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/40 font-bold">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Trainer / Course Column */}
                                            <td className="px-4 py-3.5 align-middle">
                                                <div className="flex flex-col gap-1 items-start justify-center h-full">
                                                    <div className="flex items-center gap-1.5 max-w-[150px]" title={record.course?.name}>
                                                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        <span className="text-sm font-semibold text-foreground truncate">
                                                            {record.course?.name || "Multiple"}
                                                        </span>
                                                    </div>
                                                    {(record.trainer?.user?.firstName || record.batch?.name) && (
                                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                            <UserCircle className="h-3 w-3" />
                                                            {record.trainer?.user?.firstName || record.batch?.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Remarks Column */}
                                            <td className="px-6 py-3.5 align-middle w-[25%] max-w-[200px]">
                                                {record.remarks ? (
                                                    <div className="flex items-start gap-2 bg-muted/30 p-2 rounded-md border border-border/40">
                                                        <StickyNote className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                        <span className="text-xs font-medium text-muted-foreground line-clamp-2" title={record.remarks}>
                                                            {record.remarks}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center text-muted-foreground/30 font-bold h-full">
                                                        —
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="bg-muted/20 border-t border-border/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            <span className="text-sm font-semibold text-muted-foreground">Present: <strong className="text-foreground">{stats["PRESENT"] || 0}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                            <span className="text-sm font-semibold text-muted-foreground">Absent: <strong className="text-foreground">{stats["ABSENT"] || 0}</strong></span>
                        </div>
                        {((stats["LATE"] || 0) + (stats["HALFDAY"] || 0) + (stats["HOLIDAY"] || 0) + (stats["LEAVE"] || 0)) > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                <span className="text-sm font-semibold text-muted-foreground">Other: <strong className="text-foreground">
                                    {(stats["LATE"] || 0) + (stats["HALFDAY"] || 0) + (stats["HOLIDAY"] || 0) + (stats["LEAVE"] || 0)}
                                </strong></span>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default StudentHistoryModal;
