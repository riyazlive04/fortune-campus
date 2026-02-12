
import { useState, useEffect } from "react";
import { trainerApi, attendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

interface AttendanceManagerProps {
    batches: any[];
}

const AttendanceManager = ({ batches }: AttendanceManagerProps) => {
    const [selectedBatch, setSelectedBatch] = useState<string>(batches[0]?.id || "");
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchStudents = async () => {
        if (!selectedBatch) return;
        try {
            setLoading(true);
            const res = await trainerApi.getBatchStudents(selectedBatch);
            if (res.success) {
                setStudents(res.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch batch students",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [selectedBatch]);

    const handleEntry = async (studentId: string) => {
        if (!navigator.geolocation) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Geolocation is not supported by your browser",
            });
            return;
        }

        const getPosition = () => {
            return new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
        };

        try {
            // Get real GPS coordinates
            const position = await getPosition();
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const res = await attendanceApi.markEntry({
                studentId,
                batchId: selectedBatch,
                latitude: lat,
                longitude: lng
            });

            if (res.success) {
                toast({
                    title: "Success",
                    description: "Entry marked successfully",
                });
                fetchStudents();
            }
        } catch (error: any) {
            let errorMessage = "Failed to mark entry";
            if (error.code === error.PERMISSION_DENIED) {
                errorMessage = "Location permission denied. Please enable location access.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
        }
    };

    const handleExit = async (attendanceId: string) => {
        try {
            const res = await attendanceApi.markExit(attendanceId);
            if (res.success) {
                toast({
                    title: "Success",
                    description: "Exit marked successfully",
                });
                fetchStudents();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to mark exit",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold">Attendance Tracking</h3>
                    <p className="text-sm text-muted-foreground">Manage student entry/exit and GPS verification.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Active Batch:</span>
                    <select
                        className="bg-background border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading student list...</div>
                ) : students.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No students found in this batch.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Student Name</th>
                                    <th className="px-6 py-4 text-left font-semibold">Today's Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">In Time</th>
                                    <th className="px-6 py-4 text-left font-semibold">Out Time</th>
                                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y transition-all">
                                {students.map(s => {
                                    const todayAtt = s.attendances?.[0];
                                    return (
                                        <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{s.user.firstName} {s.user.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{s.user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {todayAtt ? (
                                                    <StatusBadge
                                                        status={todayAtt.status}
                                                        variant={todayAtt.status === 'PRESENT' ? 'success' : 'danger'}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">Not marked yet</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-primary/70" />
                                                    <span>{todayAtt?.inTime ? new Date(todayAtt.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-orange-400/70" />
                                                    <span>{todayAtt?.outTime ? new Date(todayAtt.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!todayAtt ? (
                                                    <button
                                                        onClick={() => handleEntry(s.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        <MapPin className="w-3.5 h-3.5" /> Mark Entry
                                                    </button>
                                                ) : !todayAtt.outTime ? (
                                                    <button
                                                        onClick={() => handleExit(todayAtt.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Mark Exit
                                                    </button>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success text-xs font-bold rounded-lg border border-success/20">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Fully Marked
                                                    </div>
                                                )}
                                            </td>
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
