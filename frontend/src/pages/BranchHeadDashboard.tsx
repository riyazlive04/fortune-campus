import { useState, useEffect } from "react";
import {
    Users,
    UserPlus,
    TrendingUp,
    IndianRupee,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Briefcase,
    LayoutDashboard,
    ArrowRightLeft,
    Loader2,
    AlertCircle
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { branchDashboardApi, trainerAttendanceApi, storage } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import AdmissionModal from "@/components/AdmissionModal";

const BranchHeadDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const { toast } = useToast();

    // Admission Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAdmission, setSelectedAdmission] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<any>(null);
    const [conversionLeadId, setConversionLeadId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Helper to fetch and prevent single promise failure from breaking everything
            const safeFetch = async (promise: Promise<any>, fallback: any = []) => {
                try {
                    const res = await promise;
                    return res.data || res;
                } catch (e) {
                    console.error("Fetch failed:", e);
                    return fallback;
                }
            };

            const [overviewData, admissionsData, attendanceData, performanceData, trainerAttendanceData, branchReportsData] = await Promise.all([
                branchDashboardApi.getOverview().then(res => res.data).catch(() => null),
                safeFetch(branchDashboardApi.getAdmissions(), { recentLeads: [], pendingAdmissions: [] }),
                safeFetch(branchDashboardApi.getAttendance(), []),
                safeFetch(branchDashboardApi.getPortfolio(), []),
                safeFetch(trainerAttendanceApi.getHistory({
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                }), []),
                safeFetch(branchDashboardApi.getBranchReports(), { reports: [] })
            ]);

            if (!overviewData) {
                // If core overview fails, we still want to show something or error out normally
                // But we don't want to crash the whole component
            }

            setStats({
                ...overviewData?.kpis,
                recentLeads: admissionsData?.recentLeads || [],
                pendingAdmissionsList: admissionsData?.pendingAdmissions || [],
                attendanceStats: attendanceData,
                performanceStats: performanceData,
                trainerAttendanceStats: (trainerAttendanceData?.data || (Array.isArray(trainerAttendanceData) ? trainerAttendanceData : [])),
                branchReports: branchReportsData?.reports || (Array.isArray(branchReportsData) ? branchReportsData : [])
            });
        } catch (error) {
            console.error("Dashboard error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch dashboard data"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleConvertLead = (lead: any) => {
        setInitialData({
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            courseId: lead.courseId,
            branchId: lead.branchId
        });
        setConversionLeadId(lead.id);
        setSelectedAdmission(null);
        setModalOpen(true);
    };

    const handleEditAdmission = (admissionId: string) => {
        setSelectedAdmission(admissionId);
        setInitialData(null);
        setConversionLeadId(null);
        setModalOpen(true);
    };

    const handleModalSuccess = () => {
        fetchData();
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            <PageHeader
                title="Branch Dashboard"
                description={`Welcome back! Here's what's happening at your branch.`}
            />

            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Leads"
                    value={stats?.totalLeads || 0}
                    icon={Users}
                    accentColor="bg-blue-500"
                    change="+12% from last month"
                    changeType="positive"
                />
                <KPICard
                    title="Admissions"
                    value={stats?.totalAdmissions || 0}
                    icon={UserPlus}
                    accentColor="bg-green-500"
                    change="+8% from last month"
                    changeType="positive"
                />
                <KPICard
                    title="Active Students"
                    value={stats?.activeStudents || 0}
                    icon={CheckCircle}
                    accentColor="bg-yellow-500"
                />

                {/* Attendance Status Widget */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Attendance</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 pt-2">
                            {/* Students */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Students</span>
                                    {stats?.attendance?.studentsMarked ? (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                                                P: {stats?.attendance?.present}
                                            </span>
                                            <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                                                A: {stats?.attendance?.absent}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Trainers */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Trainers</span>
                                    {stats?.attendance?.trainersMarked ? (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                                                P: {stats?.attendance?.trainerPresent}
                                            </span>
                                            <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                                                A: {stats?.attendance?.trainerAbsent}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <KPICard
                    title="Revenue"
                    value={`₹${stats?.revenue?.collected?.toLocaleString() || 0}`}
                    icon={IndianRupee}
                    accentColor="bg-purple-500"
                    change="+15% from last month"
                    changeType="positive"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="leads">Leads & Admissions</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                {/* OVERVIEW CONTENT */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Leads</CardTitle>
                                <CardDescription>Latest enquiries from various sources.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(stats?.recentLeads || []).slice(0, 5).map((lead: any) => (
                                        <div key={lead.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {(lead.firstName?.[0] || '')}{(lead.lastName?.[0] || '')}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => handleConvertLead(lead)}>
                                                <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                                                Convert
                                            </Button>
                                        </div>
                                    ))}
                                    {(!stats?.recentLeads || stats.recentLeads.length === 0) && (
                                        <div className="text-center py-6 text-muted-foreground italic text-sm">No recent leads found.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Admissions for Approval</CardTitle>
                                <CardDescription>Verify and approve new student enrollments.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(stats?.pendingAdmissionsList || []).slice(0, 5).map((adm: any) => (
                                        <div key={adm.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                                            <div>
                                                <p className="text-sm font-medium">{adm.firstName} {adm.lastName}</p>
                                                <p className="text-xs text-muted-foreground">{adm.course?.name || '---'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={adm.status} variant="warning" />
                                                <Button size="sm" variant="ghost" className="h-8" onClick={() => handleEditAdmission(adm.id)}>Review</Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.pendingAdmissionsList || stats.pendingAdmissionsList.length === 0) && (
                                        <div className="text-center py-6 text-muted-foreground italic text-sm">No pending admissions.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* LEADS & ADMISSIONS CONTENT */}
                <TabsContent value="leads">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Full tables would go here, simplified for reconstruction */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Management Console</CardTitle>
                                    <CardDescription>Comprehensive view of branch pipeline.</CardDescription>
                                </div>
                                <Button size="sm" onClick={() => handleEditAdmission(null)}>+ New Admission</Button>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Manage your leads and admissions efficiently from the overview or use the specialized modules.</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ATTENDANCE CONTENT */}
                <TabsContent value="attendance">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Student Attendance</CardTitle>
                                    <CardDescription>Daily presence tracking across batches.</CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">{stats?.attendanceStats?.averageAttendance || 0}%</p>
                                    <p className="text-xs text-muted-foreground">Avg. Attendance</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(stats?.attendanceStats?.lowAttendanceStudents || []).map((s: any) => (
                                        <div key={s.id} className="flex items-center justify-between p-2 border-b last:border-0">
                                            <span className="text-sm font-medium">{s.user?.firstName} {s.user?.lastName}</span>
                                            <span className="text-xs font-bold text-red-500">{s._count?.attendances || 0} classes</span>
                                        </div>
                                    ))}
                                    {(!stats?.attendanceStats?.lowAttendanceStudents || stats.attendanceStats.lowAttendanceStudents.length === 0) && (
                                        <div className="text-center py-6 text-muted-foreground text-sm">All students have good attendance records.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Trainer Presence</CardTitle>
                                <CardDescription>Monitor faculty engagement today.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-48 overflow-y-auto">
                                <div className="space-y-3">
                                    {(stats?.trainerAttendanceStats || []).map((att: any) => (
                                        <div key={att.id} className="flex items-center justify-between p-2 border-b last:border-0 text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-xs">
                                                    {att.trainer?.user?.firstName} {att.trainer?.user?.lastName}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {att.inTime && new Date(att.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {att.outTime ? ` - ${new Date(att.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Active)'}
                                                </span>
                                            </div>
                                            <StatusBadge
                                                status={att.status}
                                                variant={att.status === 'PRESENT' ? 'success' : att.status === 'ABSENT' ? 'danger' : 'warning'}
                                            />
                                        </div>
                                    ))}
                                    {(!stats?.trainerAttendanceStats || stats.trainerAttendanceStats.length === 0) && (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-4">
                                            <Clock className="h-6 w-6 mb-2 opacity-20" />
                                            <p className="text-xs italic">No trainer attendance marked for today.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* PERFORMANCE CONTENT */}
                <TabsContent value="performance">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle>Portfolio Submissions</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center p-8">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-blue-600">{stats?.performanceStats?.submissions || 0}</div>
                                        <p className="text-sm text-muted-foreground">Total Submissions</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Pending Reviews</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center p-8">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-orange-600">{stats?.performanceStats?.pendingApprovals || 0}</div>
                                        <p className="text-sm text-muted-foreground">Awaiting Approval</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                {/* REPORTS CONTENT */}
                <TabsContent value="reports">
                    <BranchReportsList reports={stats?.branchReports || []} />
                </TabsContent>
            </Tabs>

            <AdmissionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleModalSuccess}
                admissionId={selectedAdmission}
                initialData={initialData}
                leadId={conversionLeadId}
            />
        </div>
    );
};

const BranchReportsList = ({ reports }: { reports: any[] }) => {
    if (!reports) return <div className="text-center py-8">Loading reports...</div>;

    if (!Array.isArray(reports) || reports.length === 0) {
        return (
            <div className="bg-card border rounded-xl overflow-hidden p-8 text-center text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                <p>No branch reports available at this time.</p>
                <p className="text-xs mt-1">Branch performance reports are typically generated monthly.</p>
            </div>
        );
    }

    const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Branch Performance Reports
            </h3>
            <div className="grid gap-4">
                {reports.map((report: any, i: number) => (
                    <div key={i} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-semibold text-lg">{report.month || "Monthly Report"}</h4>
                                <p className="text-sm text-muted-foreground">Branch ID: {report.branchId || "N/A"}</p>
                            </div>
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20">
                                {report.status || "Finalized"}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-muted/50 p-3 rounded-lg border">
                                <p className="text-xs text-muted-foreground mb-1">Total Collections</p>
                                <p className="font-bold text-success">{formatCurrency(report.totalCollections || 0)}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg border">
                                <p className="text-xs text-muted-foreground mb-1">Total Enrollments</p>
                                <p className="font-bold">{report.totalEnrollments || 0}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg border">
                                <p className="text-xs text-muted-foreground mb-1">Branch Share (Allocated)</p>
                                <p className="font-bold text-warning">{formatCurrency(report.branchShare || 0)}</p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg border">
                                <p className="text-xs text-muted-foreground mb-1">Trainer Expense</p>
                                <p className="font-bold text-destructive">{formatCurrency(report.trainerExpense || 0)}</p>
                            </div>
                        </div>
                        {report.notes && (
                            <div className="mt-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded border">
                                <strong>Notes:</strong> {report.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BranchHeadDashboard;

