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
    AlertCircle,
    X
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { branchDashboardApi, trainerAttendanceApi, leadsApi, admissionsApi, studentsApi, storage } from "@/lib/api";
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

    // Detail Modal State
    const [modalType, setModalType] = useState<'leads' | 'admissions' | 'students' | 'attendance' | 'revenue' | null>(null);
    const [modalData, setModalData] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

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

    const openModal = async (type: 'leads' | 'admissions' | 'students' | 'attendance' | 'revenue') => {
        setModalType(type);
        setModalData([]);
        setModalLoading(true);
        try {
            if (type === 'leads') {
                const res = await leadsApi.getLeads({ limit: 100 });
                const leads = res.data?.leads || res.data || [];
                setModalData(Array.isArray(leads) ? leads : []);
            } else if (type === 'admissions') {
                const res = await admissionsApi.getAdmissions({ limit: 100 });
                const admissions = res.data?.admissions || res.data || [];
                setModalData(Array.isArray(admissions) ? admissions : []);
            } else if (type === 'students') {
                const res = await studentsApi.getStudents({ limit: 100 });
                const students = res.data?.students || res.data || [];
                setModalData(Array.isArray(students) ? students : []);
            } else if (type === 'attendance') {
                const res = await branchDashboardApi.getAttendance();
                setModalData(res.data?.summary || res.data || []);
            } else if (type === 'revenue') {
                const res = await branchDashboardApi.getBranchReports();
                setModalData(res.data?.reports || res.data || []);
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to load ${type} details` });
        } finally {
            setModalLoading(false);
        }
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
                    change="Click to view details"
                    changeType="neutral"
                    onClick={() => openModal('leads')}
                />
                <KPICard
                    title="Admissions"
                    value={stats?.totalAdmissions || 0}
                    icon={UserPlus}
                    accentColor="bg-green-500"
                    change="Click to view details"
                    changeType="neutral"
                    onClick={() => openModal('admissions')}
                />
                <KPICard
                    title="Active Students"
                    value={stats?.activeStudents || 0}
                    icon={CheckCircle}
                    accentColor="bg-yellow-500"
                    change="Click to view details"
                    changeType="neutral"
                    onClick={() => openModal('students')}
                />

                {/* Attendance Status Widget */}
                <Card
                    className="relative overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg group hover:border-primary/40 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                    onClick={() => openModal('attendance')}
                >
                    {/* Top Border Accent */}
                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-orange-500" />

                    {/* Corner Glowing Blob */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 transition-opacity duration-300 group-hover:opacity-40 bg-orange-500" />

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10 h-auto">
                        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 pt-1">Daily Attendance</CardTitle>
                        <div className="rounded-full p-2.5 transition-colors bg-orange-500 bg-opacity-10 group-hover:bg-opacity-20 text-orange-600">
                            <Clock className="h-4.5 w-4.5" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex flex-col gap-3 pt-0">
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
                                            <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                L: {stats?.attendance?.late || 0}
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
                                            <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                L: {stats?.attendance?.trainerLate || 0}
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
                    change="Click to view details"
                    changeType="neutral"
                    onClick={() => openModal('revenue')}
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

            {/* Detail Modal */}
            {modalType && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px] p-4"
                    onClick={() => setModalType(null)}
                >
                    <div
                        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-xl font-black text-foreground capitalize flex items-center gap-2">
                                    {modalType === 'leads' && <Users className="w-5 h-5 text-blue-500" />}
                                    {modalType === 'admissions' && <UserPlus className="w-5 h-5 text-green-500" />}
                                    {modalType === 'students' && <CheckCircle className="w-5 h-5 text-yellow-500" />}
                                    {modalType === 'attendance' && <Clock className="w-5 h-5 text-primary" />}
                                    {modalType === 'revenue' && <IndianRupee className="w-5 h-5 text-purple-500" />}
                                    {modalType} Details
                                </h2>
                                <p className="text-[12px] text-muted-foreground mt-0.5">
                                    {modalLoading ? 'Loading...' : `${modalData.length} record${modalData.length !== 1 ? 's' : ''} found`}
                                </p>
                            </div>
                            <button
                                onClick={() => setModalType(null)}
                                className="p-2 rounded-full hover:bg-muted transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-auto flex-1 p-4">
                            {modalLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : modalData.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground font-semibold">No records found</div>
                            ) : modalType === 'leads' ? (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Name</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Phone</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Course</th>
                                            <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.map((lead: any) => (
                                            <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 pr-4 font-semibold text-foreground">{lead.firstName} {lead.lastName}</td>
                                                <td className="py-3 pr-4 text-muted-foreground">{lead.phone || '—'}</td>
                                                <td className="py-3 pr-4 text-muted-foreground">{lead.course?.name || lead.interestedCourse || '—'}</td>
                                                <td className="py-3">
                                                    <StatusBadge status={lead.status} variant={lead.status === 'CONVERTED' ? 'success' : 'warning'} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : modalType === 'admissions' ? (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Name</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Course</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Fee Balance</th>
                                            <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.map((adm: any) => (
                                            <tr key={adm.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 pr-4 font-semibold text-foreground">{adm.firstName} {adm.lastName}</td>
                                                <td className="py-3 pr-4 text-muted-foreground">{adm.course?.name || '—'}</td>
                                                <td className="py-3 pr-4 text-muted-foreground">₹{adm.feeBalance !== undefined ? adm.feeBalance : '0'}</td>
                                                <td className="py-3">
                                                    <StatusBadge status={adm.status} variant={adm.status === 'CONFIRMED' ? 'success' : 'warning'} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : modalType === 'students' ? (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Name</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Course</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Batch</th>
                                            <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.map((student: any) => (
                                            <tr key={student.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 pr-4 font-semibold text-foreground">{student.user?.firstName} {student.user?.lastName}</td>
                                                <td className="py-3 pr-4 text-muted-foreground">{student.course?.name || '—'}</td>
                                                <td className="py-3 pr-4 text-muted-foreground">{student.batch?.name || student.batchCode || '—'}</td>
                                                <td className="py-3">
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700">Active</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : modalType === 'attendance' ? (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Student Name</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Course</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider text-center" title="Present">P</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider text-center" title="Absent">A</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider text-center" title="Late">L</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider text-center">Total Days</th>
                                            <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Attendance %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.map((att: any) => (
                                            <tr key={att.id || att.student} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 pr-4 font-semibold text-foreground">{att.student}</td>
                                                <td className="py-3 pr-4 text-muted-foreground">{att.course}</td>
                                                <td className="py-3 pr-4 text-center">
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{att.present || 0}</span>
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{att.absent || 0}</span>
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{att.late || 0}</span>
                                                </td>
                                                <td className="py-3 pr-4 text-center font-bold text-muted-foreground text-[12px]">
                                                    {att.total || 0}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${parseInt(att.percentage) < 75 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                        {att.percentage}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="grid gap-4">
                                    {modalData.map((report: any, i: number) => (
                                        <div key={i} className="bg-muted/30 border rounded-xl p-4 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-sm">{report.month || "Monthly Report"}</h4>
                                                <p className="text-xs text-muted-foreground">Total Enrollments: {report.totalEnrollments || 0}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-lg text-success">₹{(report.totalCollections || 0).toLocaleString('en-IN')}</p>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Collections</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
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

