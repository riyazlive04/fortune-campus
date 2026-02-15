import { useState, useEffect } from "react";
import {
    Users, BookOpen, GraduationCap, DollarSign,
    TrendingUp, Briefcase, CalendarCheck, AlertTriangle,
    Download, CheckCircle2, AlertCircle, FileText, Upload,
    Receipt, BarChart3, ClipboardCheck, Shield, Clock, Pencil
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";

const safeString = (val: any) => String(val ?? "");
const safeNumber = (val: any) => Number(val ?? 0);
const safePercent = (val: any) => `${safeNumber(val)}%`;
const safeCurrency = (val: any) => `₹${safeNumber(val).toLocaleString()}`;
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { branchDashboardApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import StatusBadge from "@/components/StatusBadge";

import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "#8b5cf6"];

const BranchAttendanceList = () => {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await branchDashboardApi.getAttendanceList(page);
            if (res.success && res.data) {
                setAttendance(res.data.attendance || []);
                const total = res.data.total || 0;
                setTotalPages(Math.ceil(total / 20));
            }
        } catch (error) {
            console.error("Failed to fetch attendance list:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [page]);

    return (
        <div className="space-y-4">
            <div className="relative overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Course / Batch</th>
                            <th className="px-4 py-3">Periods</th>
                            <th className="px-4 py-3">Overall</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                        ) : attendance.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No attendance records found</td></tr>
                        ) : (
                            attendance.map((record) => {
                                const presentCount = record.periods?.filter((p: any) => p.status === 'PRESENT').length || 0;
                                const totalPeriods = record.periods?.length || 0;
                                const isAllPresent = presentCount === totalPeriods && totalPeriods > 0;
                                const isAnyPresent = presentCount > 0;

                                return (
                                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                                            {new Date(record.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {record.student?.user?.firstName} {record.student?.user?.lastName}
                                            <div className="text-[10px] text-muted-foreground">{record.student?.enrollmentNumber}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <div className="font-medium">{record.course?.code}</div>
                                            <div className="text-[10px] text-muted-foreground">{record.batch?.name || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {record.periods?.map((p: any) => (
                                                    <div key={p.period}
                                                        className={`
                                                        text-[10px] px-1.5 py-0.5 rounded border font-medium
                                                        ${p.status === 'PRESENT' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                p.status === 'ABSENT' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'}
                                                    `}
                                                        title={`Period ${p.period}: ${p.status}`}
                                                    >
                                                        P{p.period}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={
                                                isAllPresent ? 'bg-green-100 text-green-700 border-green-200' :
                                                    isAnyPresent ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                        'bg-red-100 text-red-700 border-red-200'
                                            }>
                                                {isAllPresent ? 'Present' : isAnyPresent ? 'Partial' : 'Absent'}
                                            </Badge>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

const BranchProgressList = () => {
    const [progressData, setProgressData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProgress = async () => {
        setLoading(true);
        try {
            const res = await branchDashboardApi.getProgressStats(page);
            if (res.success && res.data) {
                setProgressData(res.data.softwareProgress || []);
                const total = res.data.total || 0;
                setTotalPages(Math.ceil(total / 20));
            }
        } catch (error) {
            console.error("Failed to fetch progress list:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, [page]);

    return (
        <div className="space-y-4">
            <div className="relative overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
                        <tr>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Course / Enrollment</th>
                            <th className="px-4 py-3">Software Progress</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={3} className="p-4 text-center">Loading...</td></tr>
                        ) : progressData.length === 0 ? (
                            <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No progress records found</td></tr>
                        ) : (
                            progressData.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                        {p.student?.user?.firstName} {p.student?.user?.lastName}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-xs font-medium">{p.course?.name || '-'}</div>
                                        <div className="text-[10px] text-muted-foreground">{p.student?.enrollmentNumber}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Progress value={p.progress} className="w-32 h-2" />
                                            <span className="text-xs font-bold">{p.progress}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

const BranchTrainersList = () => {
    const [trainers, setTrainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrainers = async () => {
        setLoading(true);
        try {
            const res = await branchDashboardApi.getTrainers();
            if (res.success && res.data) {
                setTrainers(res.data.performance || []);
            }
        } catch (error) {
            console.error("Failed to fetch trainers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainers();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
                <p className="text-center col-span-full">Loading trainers...</p>
            ) : trainers.length === 0 ? (
                <p className="text-center col-span-full text-muted-foreground">No trainers found for this branch.</p>
            ) : (
                trainers.map((trainer: any) => (
                    <Card key={trainer.id} className="overflow-hidden">
                        <div className="h-2 bg-primary/10" />
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{trainer.name}</CardTitle>
                                    <CardDescription className="text-xs">
                                        Trainer ID: {trainer.id.substring(0, 8)}
                                    </CardDescription>
                                </div>
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">Batches</p>
                                    <p className="font-bold text-lg">{trainer.batchesCount}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Students</p>
                                    <p className="font-bold text-lg">{trainer.totalStudents}</p>
                                </div>
                                {/* <div>
                                    <p className="text-muted-foreground text-xs">Rating</p>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold">{trainer.rating}</span>
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    </div>
                                </div> */}
                                <div>
                                    <p className="text-muted-foreground text-xs">Efficiency</p>
                                    <p className="font-bold text-green-600">{trainer.efficiency}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};

const FeeEditDialog = ({ student, open, onOpenChange, onSuccess }: { student: any, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        feeAmount: student?.feeAmount || 0,
        feePaid: student?.feePaid || 0
    });
    const { toast } = useToast();

    useEffect(() => {
        if (student) {
            setFormData({
                feeAmount: student.feeAmount || 0,
                feePaid: student.feePaid || 0
            });
        }
    }, [student]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await branchDashboardApi.updateStudentFee(student.id, formData);
            toast({ title: "Success", description: "Fees updated successfully" });
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Fees - {student?.student?.user?.firstName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Total Fee</Label>
                        <Input
                            type="number"
                            value={formData.feeAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, feeAmount: parseFloat(e.target.value) }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Paid Amount</Label>
                        <Input
                            type="number"
                            value={formData.feePaid}
                            onChange={(e) => setFormData(prev => ({ ...prev, feePaid: parseFloat(e.target.value) }))}
                            required
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const BranchFeesList = () => {
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingStudent, setEditingStudent] = useState<any>(null);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const res = await branchDashboardApi.getFeeStats(page);
            if (res.success && res.data) {
                setFees(res.data.studentFees || []);
                const total = res.data.total || 0;
                setTotalPages(Math.ceil(total / 20));
            }
        } catch (error) {
            console.error("Failed to fetch fee list:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFees();
    }, [page]);

    return (
        <div className="space-y-4">
            <div className="relative overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
                        <tr>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Course / Batch</th>
                            <th className="px-4 py-3 text-right">Total Fee</th>
                            <th className="px-4 py-3 text-right">Paid</th>
                            <th className="px-4 py-3 text-right">Balance</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                        ) : fees.length === 0 ? (
                            <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No fee records found</td></tr>
                        ) : (
                            fees.map((record) => {
                                const total = record.feeAmount || 0; // Use feeAmount instead of totalFee
                                const paid = record.feePaid || 0;
                                const balance = record.feeBalance || 0;
                                const status = balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING';

                                return (
                                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            {record.student?.user?.firstName} {record.student?.user?.lastName}
                                            <div className="text-[10px] text-muted-foreground">{record.enrollmentNumber}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <div className="font-medium">{record.course?.code}</div>
                                            <div className="text-[10px] text-muted-foreground">{record.batchId || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">₹{total.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-green-600 font-medium">₹{paid.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-red-600 font-medium">₹{balance.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge className={
                                                status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                        'bg-red-100 text-red-700 border-red-200'
                                            }>
                                                {status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingStudent(record)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {editingStudent && (
                <FeeEditDialog
                    student={editingStudent}
                    open={!!editingStudent}
                    onOpenChange={(open) => !open && setEditingStudent(null)}
                    onSuccess={fetchFees}
                />
            )}
        </div>
    );
};

const BranchHeadDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [admissions, setAdmissions] = useState<any>(null);
    const [attendance, setAttendance] = useState<any>(null);
    const [trainers, setTrainers] = useState<any>(null);
    const [compliance, setCompliance] = useState<any>(null);
    const [placements, setPlacements] = useState<any>(null);
    const [readiness, setReadiness] = useState<any>(null);
    const [fees, setFees] = useState<any>(null);
    const [portfolio, setPortfolio] = useState<any>(null);
    const [studentProgress, setStudentProgress] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const user = storage.getUser();

    const fetchData = async () => {
        try {
            setLoading(true);
            const results = await Promise.allSettled([
                branchDashboardApi.getOverview(),
                branchDashboardApi.getAdmissions(),
                branchDashboardApi.getAttendance(),
                branchDashboardApi.getTrainers(),
                branchDashboardApi.getCompliance(),
                branchDashboardApi.getPlacementStats(),
                branchDashboardApi.getPlacementReadiness(),
                branchDashboardApi.getFeeStats(),
                branchDashboardApi.getPortfolioStats(),
                branchDashboardApi.getProgressStats()
            ]);

            // Helper to safe extract data
            const getResult = (index: number) => {
                const res = results[index];
                return res.status === 'fulfilled' && res.value.success ? res.value.data : null;
            };

            setStats(getResult(0));
            setAdmissions(getResult(1));
            setAttendance(getResult(2));
            setTrainers(getResult(3));
            setCompliance(getResult(4));
            setPlacements(getResult(5));
            setReadiness(getResult(6));
            setFees(getResult(7));
            setPortfolio(getResult(8));
            setStudentProgress(getResult(9));

        } catch (error: any) {
            console.error("Critical dashboard error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Critical failure loading dashboard.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (reportType: string) => {
        try {
            toast({ title: "Generating Report", description: `Please wait while we generate the ${reportType} report...` });
            const blob = await branchDashboardApi.downloadReport(reportType);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType.replace(/ /g, '-')}-Report.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ title: "Success", description: "Report downloaded successfully" });
        } catch (error) {
            console.error("Download failed:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to download report" });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <DashboardSkeleton />;

    // If stats are missing after loading, show error state instead of null
    if (!stats || !stats.kpis) {
        return (
            <div className="p-8 text-center space-y-4">
                <PageHeader
                    title={`Branch Control Center: ${user?.branchName || 'My Branch'}`}
                    description="Operational command center."
                />
                <div className="p-6 border rounded-xl bg-destructive/5 text-destructive">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                    <h3 className="font-bold text-lg">Failed to load dashboard data</h3>
                    <p className="text-sm opacity-90">Please check your connection or contact support.</p>
                    <p className="text-xs mt-2 text-muted-foreground p-2 bg-white/50 rounded inline-block">
                        Error: Data could not be retrieved.
                    </p>
                </div>
            </div>
        );
    }

    const { kpis } = stats;

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <PageHeader
                title={`Branch Control Center: ${user?.branchName || 'My Branch'}`}
                description="Operational command center for admissions, monitoring, and compliance."
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Active Students"
                    value={safeString(kpis?.activeStudents)}
                    icon={Users}
                    accentColor="bg-blue-500"
                />
                <KPICard
                    title="Admissions (Monthly)"
                    value={safeString(kpis?.admissions?.monthly)}
                    change={`${safeNumber(kpis?.admissions?.conversionRate)}% conversion`}
                    changeType="positive"
                    icon={TrendingUp}
                    accentColor="bg-emerald-500"
                />
                <KPICard
                    title="Attendance Today"
                    value={`${safeNumber(kpis?.attendance?.present)}/${safeNumber(kpis?.attendance?.present) + safeNumber(kpis?.attendance?.absent)}`}
                    icon={ClipboardCheck}
                    accentColor="bg-amber-500"
                />
                <KPICard
                    title="Total Revenue"
                    value={safeCurrency(kpis?.revenue?.collected)}
                    change={`${safeCurrency(kpis?.revenue?.pending)} pending`}
                    changeType="negative"
                    icon={Receipt}
                    accentColor="bg-violet-500"
                />
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-card border p-1 rounded-xl w-full justify-start overflow-x-auto min-h-12">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="admissions">Admissions</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                    <TabsTrigger value="trainers">Trainers</TabsTrigger>
                    <TabsTrigger value="fees">Fees</TabsTrigger>
                    <TabsTrigger value="placements">Placements</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2 shadow-sm border-muted">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    Admissions & Revenue Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={admissions?.leadsBySource || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="source" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                                        />
                                        <Bar dataKey="_count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* COMPLIANCE WIDGET */}
                        <Card className="shadow-sm border-muted">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                                    <AlertCircle className="w-5 h-5" />
                                    Compliance & Risks
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {compliance?.attendanceRisks?.length > 0 && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold uppercase text-red-600">Attendance Risk</span>
                                            <Badge variant="destructive" className="h-5 text-[10px]">Critical</Badge>
                                        </div>
                                        <p className="text-sm font-semibold text-red-900">{compliance?.attendanceRisks?.length || 0} Students &lt; 75%</p>
                                        <p className="text-xs text-red-700">Placement eligibility blocked.</p>
                                    </div>
                                )}
                                {compliance?.portfolioDelays?.length > 0 && (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold uppercase text-amber-600">Portfolio Delays</span>
                                            <Badge variant="outline" className="h-5 text-[10px] border-amber-200 text-amber-700">Warning</Badge>
                                        </div>
                                        <p className="text-sm font-semibold text-amber-900">{compliance?.portfolioDelays?.length || 0} Pending Approvals</p>
                                        <p className="text-xs text-amber-700">Waiting for trainer action &gt; 7 days.</p>
                                    </div>
                                )}
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase text-blue-600">New Admissions</span>
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-blue-900">{safeNumber(kpis?.admissions?.today)} Enrolled Today</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ADMISSIONS TAB */}
                <TabsContent value="admissions" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Admissions & Leads Dashboard</CardTitle>
                            <Badge variant="outline">Branch: {user?.branch?.name || "Unknown"}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Lead Source Analytics</h4>
                                    <div className="space-y-3">
                                        {admissions?.leadsBySource?.length > 0 ? (
                                            admissions.leadsBySource.map((source: any) => (
                                                <div key={source.source} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-semibold">{source.source}</span>
                                                        <span>{source._count} leads</span>
                                                    </div>
                                                    <Progress value={(source._count / (kpis?.admissions?.monthly || 1)) * 100} className="h-1.5" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                                No leads data available for this branch.
                                            </div>
                                        )}
                                    </div>

                                    <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-widest mt-6">Recent Leads (New)</h4>
                                    <div className="relative overflow-x-auto rounded-xl border">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted text-muted-foreground uppercase font-bold">
                                                <tr>
                                                    <th className="px-3 py-2">Name</th>
                                                    <th className="px-3 py-2">Phone</th>
                                                    <th className="px-3 py-2">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {admissions?.recentLeads?.length > 0 ? (
                                                    admissions.recentLeads.map((lead: any) => (
                                                        <tr key={lead.id} className="hover:bg-muted/30">
                                                            <td className="px-3 py-2 font-medium">{lead.firstName} {lead.lastName}</td>
                                                            <td className="px-3 py-2 text-muted-foreground">{lead.phone}</td>
                                                            <td className="px-3 py-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        console.log("Converting lead:", lead.id);
                                                                        try {
                                                                            await branchDashboardApi.convertLead(lead.id);
                                                                            toast({ title: "Success", description: "Lead converted to admission successfully" });
                                                                            fetchData(); // Refresh data
                                                                        } catch (e: any) {
                                                                            console.error("Conversion failed:", e);
                                                                            toast({
                                                                                title: "Error",
                                                                                description: e.message || "Failed to convert lead",
                                                                                variant: "destructive"
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={`px-2 py-1 rounded text-[10px] transition-colors ${lead.status === 'CONVERTED'
                                                                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                                        }`}
                                                                    disabled={lead.status === 'CONVERTED'}
                                                                >
                                                                    {lead.status === 'CONVERTED' ? 'Converted' : 'Convert'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">No new leads pending.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Conversion Funnel</h4>
                                    <div className="p-6 bg-muted/30 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center">
                                        <p className="text-3xl font-black text-primary">{safeNumber(kpis?.admissions?.conversionRate)}%</p>
                                        <p className="text-xs font-medium text-muted-foreground mt-1">Lead-to-Admission Rate</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Branch Attendance Log</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => fetchData()}>
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <BranchAttendanceList />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trainers" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight">Branch Trainers</h2>
                    </div>
                    <BranchTrainersList />
                </TabsContent>

                {/* FEES TAB */}
                <TabsContent value="fees" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle>Fee Collection & Status</CardTitle>
                                    <CardDescription>
                                        Detailed breakdown of student fees, payments, and outstanding balances.
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-[200px] h-[80px]">
                                        <KPICard
                                            title="Total Revenue"
                                            value={safeCurrency(fees?.overallStats?._sum?.feePaid || 0)}
                                            icon={Receipt}
                                            accentColor="bg-violet-500"
                                        />
                                    </div>
                                    <div className="w-[200px] h-[80px]">
                                        <KPICard
                                            title="Pending"
                                            value={safeCurrency(fees?.overallStats?._sum?.feeBalance || 0)}
                                            icon={AlertCircle}
                                            accentColor="bg-red-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <BranchFeesList />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PROGRESS TAB */}
                <TabsContent value="progress" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Student Academic Progress</CardTitle>
                                <Button variant="outline" size="sm" onClick={() => fetchData()}>
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="border shadow-none md:col-span-1">
                                    <CardHeader><CardTitle className="text-sm">Course Distribution</CardTitle></CardHeader>
                                    <CardContent className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={studentProgress?.courseDistribution || []}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60} outerRadius={80}
                                                    paddingAngle={5} dataKey="_count"
                                                >
                                                    {studentProgress?.courseDistribution?.map((_: any, i: number) => (
                                                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                <div className="space-y-4 md:col-span-2">
                                    <h4 className="text-sm font-bold">Branch Student Progress List</h4>
                                    <BranchProgressList />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PORTFOLIO TAB */}
                <TabsContent value="portfolio" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <KPICard
                            title="Total Submissions"
                            value={portfolio?.submissions?.toString() || "0"}
                            icon={Briefcase}
                            accentColor="bg-blue-500"
                        />
                        <KPICard
                            title="Pending Approvals"
                            value={portfolio?.pendingApprovals?.toString() || "0"}
                            icon={Clock}
                            accentColor="bg-amber-500"
                        />
                    </div>
                </TabsContent>

                {/* PLACEMENTS TAB */}
                <TabsContent value="placements" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-2">
                            <CardHeader><CardTitle>Placement Readiness</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {readiness?.students?.filter((s: any) => s.status === 'NOT_READY').slice(0, 5).map((s: any) => (
                                        <div key={s.id} className="p-4 border rounded-xl flex justify-between items-start bg-red-50/50">
                                            <div>
                                                <p className="font-bold">{s.name}</p>
                                                <p className="text-xs text-muted-foreground">{s.course}</p>
                                                <div className="flex gap-2 mt-2">
                                                    {s.missingRequirements.map((req: string) => (
                                                        <Badge key={req} variant="destructive" className="text-[10px]">{req}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-white">Action Needed</Badge>
                                        </div>
                                    ))}
                                    {(!readiness?.students || readiness.students.length === 0) && (
                                        <p className="text-muted-foreground italic">No data available.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Recent Placements</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {placements?.recentPlacements?.map((p: any) => (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                            {p.student.user.firstName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{p.student.user.firstName}</p>
                                            <p className="text-xs text-muted-foreground">Placed at {p.company.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* COMPLIANCE TAB (Detailed) */}
                <TabsContent value="compliance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <Shield className="w-5 h-5" /> Discipline & Compliance Log
                            </CardTitle>
                            <CardDescription>Comprehensive list of students requiring attention.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="attendance_risk" className="w-full">
                                <TabsList className="w-full justify-start bg-muted/50 p-0 h-auto gap-4">
                                    <TabsTrigger value="attendance_risk" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:underline data-[state=active]:shadow-none">High Absenteeism</TabsTrigger>
                                    <TabsTrigger value="fee_risk" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:underline data-[state=active]:shadow-none">Fee Overdue</TabsTrigger>
                                    <TabsTrigger value="portfolio_risk" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:underline data-[state=active]:shadow-none">Portfolio Delays</TabsTrigger>
                                </TabsList>
                                <TabsContent value="attendance_risk" className="mt-4">
                                    <div className="space-y-2">
                                        {compliance?.attendanceRisks?.map((s: any) => (
                                            <div key={s.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-destructive" />
                                                    <span className="font-medium">{s.name}</span>
                                                    <span className="text-xs text-muted-foreground">({s.course})</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-destructive font-bold">{s.absentDays} Days Absent</span>
                                                    <p className="text-[10px] text-muted-foreground">In last 30 days</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                                <TabsContent value="fee_risk" className="mt-4">
                                    <div className="space-y-2">
                                        {compliance?.feeRisks?.map((s: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                                    <span className="font-medium">{s.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-amber-600 font-bold">₹{s.pending.toLocaleString()}</span>
                                                    <p className="text-[10px] text-muted-foreground">Total: ₹{s.total.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                                <TabsContent value="portfolio_risk" className="mt-4">
                                    <div className="space-y-2">
                                        {compliance?.portfolioDelays?.map((p: any) => (
                                            <div key={p.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                    <span className="font-medium">{p.studentName}</span>
                                                    <Badge variant="secondary" className="text-[10px]">{p.taskTitle}</Badge>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-muted-foreground text-xs">Submitted on {new Date(p.submittedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* REPORTS TAB */}
                <TabsContent value="reports" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Branch Reports</h3>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Upload className="w-4 h-4" />
                                    Upload Report
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Upload Branch Report</DialogTitle>
                                    <DialogDescription>
                                        Share reports with your branch trainers.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    try {
                                        toast({ title: "Uploading...", description: "Please wait." });
                                        await branchDashboardApi.uploadReport(formData);
                                        toast({ title: "Success", description: "Report uploaded successfully." });
                                        (e.target as any).reset();
                                    } catch (err: any) {
                                        toast({ variant: "destructive", title: "Error", description: err.message });
                                    }
                                }} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Report Title</Label>
                                        <Input id="title" name="title" required placeholder="e.g., Weekly Performance" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Report Type</Label>
                                        <Select name="type" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Daily Admission">Daily Admission</SelectItem>
                                                <SelectItem value="Student Discipline">Student Discipline</SelectItem>
                                                <SelectItem value="Trainer Efficiency">Trainer Efficiency</SelectItem>
                                                <SelectItem value="Revenue Collection">Revenue Collection</SelectItem>
                                                <SelectItem value="Placement Readiness">Placement Readiness</SelectItem>
                                                <SelectItem value="Compliance Alert Log">Compliance Alert Log</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Textarea id="description" name="description" placeholder="Add some details..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="file">File (PDF/CSV)</Label>
                                        <Input id="file" name="file" type="file" required accept=".pdf,.csv,.xlsx" />
                                    </div>
                                    <Button type="submit" className="w-full">Upload</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {['Daily Admission', 'Student Discipline', 'Trainer Efficiency', 'Revenue Collection', 'Placement Readiness', 'Compliance Alert Log'].map((report) => (
                            <Card key={report} className="hover:border-primary transition-all cursor-pointer group" onClick={() => handleDownloadReport(report)}>
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="space-y-1">
                                        <p className="font-bold group-hover:text-primary transition-colors">{report} Report</p>
                                        <p className="text-xs text-muted-foreground">System Generated</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary group-hover:text-white transition-all">
                                        <Download className="w-5 h-5" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
};

export default BranchHeadDashboard;
