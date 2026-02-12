
import { useState, useEffect } from "react";
import {
    Users,
    BarChart3,
    ClipboardCheck,
    LayoutDashboard,
    UserCheck,
    Receipt,
    FileText,
    Bell,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Search,
    Download
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { branchDashboardApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "#8b5cf6"];

const BranchHeadDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [admissions, setAdmissions] = useState<any>(null);
    const [attendance, setAttendance] = useState<any>(null);
    const [trainers, setTrainers] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const user = storage.getUser();

    const fetchData = async () => {
        try {
            setLoading(true);
            const [overviewRes, admissionsRes, attendanceRes, trainersRes] = await Promise.all([
                branchDashboardApi.getOverview(),
                branchDashboardApi.getAdmissions(),
                branchDashboardApi.getAttendance(),
                branchDashboardApi.getTrainers()
            ]);

            if (overviewRes.success) setStats(overviewRes.data);
            if (admissionsRes.success) setAdmissions(admissionsRes.data);
            if (attendanceRes.success) setAttendance(attendanceRes.data);
            if (trainersRes.success) setTrainers(trainersRes.data);

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch dashboard data",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (!stats) return null;

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
                    value={kpis.activeStudents.toString()}
                    icon={Users}
                    accentColor="bg-blue-500"
                />
                <KPICard
                    title="Admissions (Monthly)"
                    value={kpis.admissions.monthly.toString()}
                    change={`${kpis.admissions.conversionRate}% conversion`}
                    changeType="positive"
                    icon={TrendingUp}
                    accentColor="bg-emerald-500"
                />
                <KPICard
                    title="Attendance Today"
                    value={`${kpis.attendance.present}/${kpis.attendance.present + kpis.attendance.absent}`}
                    icon={ClipboardCheck}
                    accentColor="bg-amber-500"
                />
                <KPICard
                    title="Total Revenue"
                    value={`₹${kpis.revenue.collected.toLocaleString()}`}
                    change={`₹${kpis.revenue.pending.toLocaleString()} pending`}
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
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="fees">Fees</TabsTrigger>
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

                        <Card className="shadow-sm border-muted">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
                                    <AlertCircle className="w-5 h-5" />
                                    Security & Discipline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase text-red-600">Attendance Risk</span>
                                        <Badge variant="destructive" className="h-5 text-[10px]">Critical</Badge>
                                    </div>
                                    <p className="text-sm font-semibold text-red-900">15 Students &lt; 75%</p>
                                    <p className="text-xs text-red-700">Placement eligibility currently blocked.</p>
                                </div>
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase text-amber-600">Portfolio Delays</span>
                                        <Badge variant="outline" className="h-5 text-[10px] border-amber-200 text-amber-700">Warning</Badge>
                                    </div>
                                    <p className="text-sm font-semibold text-amber-900">8 Delayed Approvals</p>
                                    <p className="text-xs text-amber-700">Trainer response time &gt; 48 hours.</p>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase text-blue-600">New Admissions</span>
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-blue-900">{kpis.admissions.today} Enrolled Today</p>
                                    <p className="text-xs text-blue-700">Follow up with pending enquiries.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-sm border-muted">
                            <CardHeader><CardTitle className="text-md">Course Distribution</CardTitle></CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={admissions?.admissionsTrend || []}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={5} dataKey="_count"
                                        >
                                            {admissions?.admissionsTrend?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-muted">
                            <CardHeader><CardTitle className="text-md font-bold">Quick Report Center</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3">
                                <button className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg border text-sm transition-all">
                                    <Download className="w-4 h-4" /> Daily Admissions
                                </button>
                                <button className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg border text-sm transition-all">
                                    <Download className="w-4 h-4" /> Attendance Log
                                </button>
                                <button className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg border text-sm transition-all">
                                    <Download className="w-4 h-4" /> Revenue Summary
                                </button>
                                <button className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg border text-sm transition-all">
                                    <Download className="w-4 h-4" /> Trainer Stats
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ADMISSIONS TAB */}
                <TabsContent value="admissions" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Admissions & Leads Dashboard</CardTitle>
                            <Badge variant="outline">Branch: {user?.branchName}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Lead Source Analytics</h4>
                                    <div className="space-y-3">
                                        {admissions?.leadsBySource?.map((source: any) => (
                                            <div key={source.source} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="font-semibold">{source.source}</span>
                                                    <span>{source._count} leads</span>
                                                </div>
                                                <Progress value={(source._count / kpis.admissions.monthly) * 100} className="h-1.5" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-widest">Conversion Funnel</h4>
                                    <div className="p-6 bg-muted/30 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center">
                                        <p className="text-3xl font-black text-primary">{kpis.admissions.conversionRate}%</p>
                                        <p className="text-xs font-medium text-muted-foreground mt-1">Lead-to-Admission Rate</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ATTENDANCE TAB */}
                <TabsContent value="attendance" className="space-y-4">
                    <Card className="shadow-sm">
                        <CardHeader><CardTitle>Attendance Compliance</CardTitle></CardHeader>
                        <CardContent>
                            <div className="relative overflow-x-auto rounded-xl border">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
                                        <tr>
                                            <th className="px-4 py-3">Student</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {attendance?.latestAttendance?.map((entry: any) => (
                                            <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-medium">{entry.student.user.firstName} {entry.student.user.lastName}</td>
                                                <td className="px-4 py-3">
                                                    <Badge className={entry.status === 'PRESENT' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                                        {entry.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button className="text-[10px] font-bold text-primary hover:underline">Monitor Case</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PERFORMANCE TAB */}
                <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Trainer Productivity Ranking</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {trainers?.performance?.map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {t.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{t.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{t.batchesCount} Batches • {t.totalStudents} Students</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-success">{t.efficiency}</p>
                                            <p className="text-[10px] text-muted-foreground">Efficiency</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Academic Risks</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                                    <span>Students Failing Tests</span>
                                    <span className="font-bold text-destructive">4</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                                    <span>Software Delays</span>
                                    <span className="font-bold text-amber-500">12</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                                    <span>Ready for Placement</span>
                                    <span className="font-bold text-success">{kpis.placementEligible}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* FEES TAB */}
                <TabsContent value="fees" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Revenue Monitoring (Branch Only)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                    <p className="text-xs font-bold text-emerald-600 uppercase">Collected</p>
                                    <p className="text-2xl font-black text-emerald-900">₹{kpis.revenue.collected.toLocaleString()}</p>
                                </div>
                                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                                    <p className="text-xs font-bold text-amber-600 uppercase">Pending</p>
                                    <p className="text-2xl font-black text-amber-900">₹{kpis.revenue.pending.toLocaleString()}</p>
                                </div>
                                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                                    <p className="text-xs font-bold text-blue-600 uppercase">Total Expected</p>
                                    <p className="text-2xl font-black text-blue-900">₹{kpis.revenue.total.toLocaleString()}</p>
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground italic">* Read-only access to branch level financial data. Edit access restricted to Admin/CEO.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* REPORTS TAB */}
                <TabsContent value="reports" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {['Daily Admission', 'Student Discipline', 'Trainer Efficiency', 'Revenue Collection', 'Placement Readiness', 'Compliance Alert Log'].map((report) => (
                            <Card key={report} className="hover:border-primary transition-all cursor-pointer group">
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="space-y-1">
                                        <p className="font-bold group-hover:text-primary transition-colors">{report} Report</p>
                                        <p className="text-xs text-muted-foreground">Generated today at 09:00 AM</p>
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
