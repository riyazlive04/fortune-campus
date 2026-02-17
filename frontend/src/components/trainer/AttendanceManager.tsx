
import { useState, useEffect } from "react";
import { trainerApi, attendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, User, Phone, Mail, BookOpen, Calendar as CalendarIcon, ClipboardList, GraduationCap } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttendanceManagerProps {
    batches: any[];
}

const AttendanceManager = ({ batches }: AttendanceManagerProps) => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentDetails, setStudentDetails] = useState<any | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const { toast } = useToast();

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await trainerApi.getBranchStudents();
            if (res.success) {
                setStudents(res.data.students || []);
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

    const fetchStudentDetails = async (id: string) => {
        try {
            setDetailsLoading(true);
            const res = await trainerApi.getStudentDetails(id);
            if (res.success) {
                setStudentDetails(res.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch student details",
            });
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStudentId) {
            fetchStudentDetails(selectedStudentId);
        } else {
            setStudentDetails(null);
        }
    }, [selectedStudentId]);

    const handleMarkAttendance = async (studentId: string, status: string, period: number) => {
        // Optimistic Update
        const previousStudents = [...students];
        setStudents(prev => prev.map(s => {
            if (s.id === studentId) {
                const existingAtt = s.attendances || [];
                const otherAtts = existingAtt.filter((a: any) => a.period !== period);
                return {
                    ...s,
                    attendances: [...otherAtts, { period, status }]
                };
            }
            return s;
        }));

        try {
            const res = await attendanceApi.markAttendance({
                studentId,
                status,
                period
            });

            if (res.success) {
                toast({
                    title: "Success",
                    description: `Marked as ${status}`,
                    duration: 2000,
                });
            } else {
                setStudents(previousStudents);
            }
        } catch (error: any) {
            setStudents(previousStudents);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to mark attendance",
            });
        }
    };

    const periodNumbers = [1];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold">Branch Attendance</h3>
                    <p className="text-sm text-muted-foreground">Mark attendance for the student.</p>
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
                                        <th key={p} className="px-4 py-4 text-center font-semibold border-l w-24 whitespace-nowrap">Mark Attendance</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y transition-all">
                                {students.map(s => {
                                    const att = s.attendances?.find((a: any) => a.period === 1);
                                    const status = att?.status;
                                    let nameColor = "text-foreground";
                                    if (status === 'PRESENT') nameColor = "text-green-600";
                                    if (status === 'ABSENT') nameColor = "text-red-600";

                                    return (
                                        <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <button
                                                    onClick={() => setSelectedStudentId(s.id)}
                                                    className="flex flex-col text-left hover:opacity-70 transition-opacity"
                                                >
                                                    <span className={`font-medium ${nameColor} transition-colors underline decoration-dotted`}>
                                                        {s.user?.firstName} {s.user?.lastName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{s.user?.email}</span>
                                                </button>
                                            </td>

                                            {periodNumbers.map(p => {
                                                const att = s.attendances?.find((a: any) => a.period === p);
                                                const status = att?.status;

                                                return (
                                                    <td key={p} className="px-2 py-4 text-center border-l bg-muted/5 group-hover:bg-transparent transition-colors">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="min-h-[24px] flex items-center justify-center">
                                                                {status && (
                                                                    <span className={`font-bold text-sm ${status === 'PRESENT' ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {status}
                                                                    </span>
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

            <Dialog open={!!selectedStudentId} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Student Details</DialogTitle>
                        <DialogDescription>Full overview for the selected student.</DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="py-20 text-center text-muted-foreground">Loading details...</div>
                    ) : studentDetails ? (
                        <ScrollArea className="max-h-[60vh] pr-4">
                            <Tabs defaultValue="profile" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="profile">Profile</TabsTrigger>
                                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                                    <TabsTrigger value="progress">Progress</TabsTrigger>
                                    <TabsTrigger value="fees">Fees</TabsTrigger>
                                </TabsList>

                                <TabsContent value="profile" className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Name</p>
                                            <p className="font-semibold">{studentDetails.user?.firstName} {studentDetails.user?.lastName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                            <p className="font-medium underline">{studentDetails.user?.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                                            <p className="font-medium">{studentDetails.user?.phone || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="w-3 h-3" /> Enrollment</p>
                                            <p className="font-medium">{studentDetails.enrollmentNumber || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Course</p>
                                            <p className="font-medium">{studentDetails.course?.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Batch</p>
                                            <p className="font-medium">{studentDetails.batch?.name || 'Not assigned'}</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="attendance" className="space-y-4 py-4">
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                                        <div>
                                            <p className="text-sm font-medium">Overall Percentage</p>
                                            <p className={`text-2xl font-bold ${studentDetails.stats?.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                                {studentDetails.stats?.attendancePercentage}%
                                            </p>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p>Present: {studentDetails.stats?.presentAttendance}</p>
                                            <p>Total: {studentDetails.stats?.totalAttendance}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Recent History (Top 10)</p>
                                        {studentDetails.attendances?.slice(0, 10).map((a: any) => (
                                            <div key={a.id} className="flex justify-between items-center p-2 border rounded text-xs">
                                                <span>{new Date(a.date).toLocaleDateString()} (Hour {a.period})</span>
                                                <Badge className={a.status === 'PRESENT' ? 'bg-green-500' : 'bg-red-500'}>{a.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="progress" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Portfolio Submissions</p>
                                        {studentDetails.portfolioSubmissions?.length > 0 ? (
                                            studentDetails.portfolioSubmissions.map((ps: any) => (
                                                <div key={ps.id} className="flex justify-between items-center p-2 border rounded text-xs italic">
                                                    <span>{ps.task?.title}</span>
                                                    <Badge variant="outline">{ps.status}</Badge>
                                                </div>
                                            ))
                                        ) : <p className="text-center py-4 text-muted-foreground italic">No submissions yet.</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Test Scores</p>
                                        {studentDetails.testScores?.length > 0 ? (
                                            studentDetails.testScores.map((ts: any) => (
                                                <div key={ts.id} className="flex justify-between items-center p-2 border rounded text-xs font-bold">
                                                    <span>{ts.test?.title}</span>
                                                    <span>{ts.marks}/{ts.test?.maxMarks} ({ts.isPass ? 'PASS' : 'FAIL'})</span>
                                                </div>
                                            ))
                                        ) : <p className="text-center py-4 text-muted-foreground italic">No tests taken yet.</p>}
                                    </div>
                                </TabsContent>

                                <TabsContent value="fees" className="space-y-4 py-4">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 border rounded-lg bg-blue-50">
                                            <p className="text-xs text-blue-600 font-medium">Total Fee</p>
                                            <p className="text-lg font-bold">₹{studentDetails.admission?.feeAmount || 0}</p>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-green-50">
                                            <p className="text-xs text-green-600 font-medium">Paid</p>
                                            <p className="text-lg font-bold">₹{studentDetails.admission?.feePaid || 0}</p>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-red-50">
                                            <p className="text-xs text-red-600 font-medium">Balance</p>
                                            <p className="text-lg font-bold">₹{studentDetails.admission?.feeBalance || 0}</p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </ScrollArea>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AttendanceManager;
