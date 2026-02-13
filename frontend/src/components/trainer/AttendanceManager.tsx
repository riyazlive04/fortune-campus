
import { useState, useEffect } from "react";
import { trainerApi, attendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

interface AttendanceManagerProps {
    batches: any[];
}

const AttendanceManager = ({ batches }: AttendanceManagerProps) => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await trainerApi.getBranchStudents();
            if (res.success) {
                setStudents(res.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch branch students",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleMarkAttendance = async (studentId: string, status: string, period: number) => {
        try {
            const res = await attendanceApi.markAttendance({
                studentId,
                status,
                period
            });

            if (res.success) {
                toast({
                    title: "Success",
                    description: `Hour ${period} marked as ${status}`,
                });
                fetchStudents();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to mark attendance",
            });
        }
    };

    const periodNumbers = [1, 2, 3, 4];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold">Branch Attendance (4-Hour Tracking)</h3>
                    <p className="text-sm text-muted-foreground">Mark attendance for each hour individually.</p>
                </div>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading student list...</div>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No students found in your branch.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Student Name</th>
                                    {periodNumbers.map(p => (
                                        <th key={p} className="px-4 py-4 text-center font-semibold border-l w-24 whitespace-nowrap">Hour {p}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y transition-all">
                                {students.map(s => {
                                    return (
                                        <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{s.user?.firstName} {s.user?.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{s.user?.email}</span>
                                                </div>
                                            </td>

                                            {periodNumbers.map(p => {
                                                const att = s.attendances?.find((a: any) => a.period === p);
                                                const status = att?.status;

                                                return (
                                                    <td key={p} className="px-2 py-4 text-center border-l bg-muted/5 group-hover:bg-transparent transition-colors">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="min-h-[24px]">
                                                                {status && (
                                                                    <StatusBadge
                                                                        status={status}
                                                                        variant={status === 'PRESENT' ? 'success' : 'danger'}
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="flex justify-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleMarkAttendance(s.id, 'PRESENT', p)}
                                                                    className={`p-1.5 rounded-lg transition-all ${status === 'PRESENT'
                                                                        ? 'bg-green-600 text-white shadow-sm scale-110'
                                                                        : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200'
                                                                        }`}
                                                                    title={`Mark Hour ${p} Present`}
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMarkAttendance(s.id, 'ABSENT', p)}
                                                                    className={`p-1.5 rounded-lg transition-all ${status === 'ABSENT'
                                                                        ? 'bg-red-600 text-white shadow-sm scale-110'
                                                                        : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200'
                                                                        }`}
                                                                    title={`Mark Hour ${p} Absent`}
                                                                >
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceManager;
