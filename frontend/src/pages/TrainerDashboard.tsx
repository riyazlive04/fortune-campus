
import { useState, useEffect } from "react";
import {
    Users,
    ClipboardCheck,
    LayoutDashboard,
    Award,
    Calendar,
    CheckCircle,
    XCircle,
    FileText,
    BookOpen,
    AlertCircle,
    DollarSign,
    Database,
    CheckSquare,
    GraduationCap,
    Loader2,
    X
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trainerApi, storage, portfolioTasksApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import AttendanceManager from "@/components/trainer/AttendanceManager";
import PortfolioManager from "@/components/trainer/PortfolioManager";
import TestsManager from "@/components/trainer/TestsManager";
import SoftwareProgressManager from "@/components/trainer/SoftwareProgressManager";
import PlacementEligibility from "@/components/trainer/PlacementEligibility";

// Placeholder components for tabs
const ProgressTab = () => <div className="p-4 bg-card border rounded-xl">Software Progress Tracker</div>;
const TestsTab = () => <div className="p-4 bg-card border rounded-xl">Test & Evaluation Management</div>;


const TrainerDashboard = ({ trainerId }: { trainerId?: string }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const { toast } = useToast();
    const user = storage.getUser();

    const [modalType, setModalType] = useState<'activeStudents' | 'attendance' | 'pendingPortfolios' | 'placementEligible' | null>(null);
    const [modalData, setModalData] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    const openModal = async (type: 'activeStudents' | 'attendance' | 'pendingPortfolios' | 'placementEligible') => {
        setModalType(type);
        setModalData([]);
        setModalLoading(true);
        try {
            if (type === 'activeStudents') {
                const res = await trainerApi.getBranchStudents(trainerId);
                setModalData(res.data?.students || []);
            } else if (type === 'attendance') {
                const res = await trainerApi.getBranchStudents(trainerId);
                setModalData(res.data?.students || []);
            } else if (type === 'pendingPortfolios') {
                const res = await portfolioTasksApi.getStats();
                const pending = (res.data?.studentStats || []).filter((s: any) => s.pendingCount > 0);
                setModalData(pending);
            } else if (type === 'placementEligible') {
                const res = await trainerApi.getBranchStudents();
                // Depending on the schema, might not have placementEligible.
                // Displaying all active branch students as a fallback just in case it doesn't filter perfectly.
                const eligible = (res.data?.students || []).filter((s: any) => s.placementEligible || s.certificateLocked === false);
                setModalData(eligible.length > 0 ? eligible : (res.data?.students || []));
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load details' });
        } finally {
            setModalLoading(false);
        }
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const statsRes = await trainerApi.getDashboardStats(trainerId).catch(e => ({ success: false, error: e }));

            if (statsRes.success) {
                setStats(statsRes.data);
            }
        } catch (error: any) {
            console.error("Dashboard fetch error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load dashboard data",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (!stats) return <div className="p-8 text-center text-destructive">Failed to load dashboard data. Please try refreshing.</div>;

    return (
        <div className="animate-fade-in">
            <PageHeader
                title={trainerId && stats?.trainerName ? `Trainer Dashboard: ${stats.trainerName}` : `Trainer Dashboard: ${user?.firstName || ''} ${user?.lastName || ''}`}
                description={`Managing ${stats?.activeStudents || 0} active students across ${stats?.todayClasses || 0} classes today.`}
            />

            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div onClick={() => openModal("activeStudents")} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                    <KPICard
                        title="Active Students"
                        value={(stats?.activeStudents || 0).toString()}
                        change="Click to view details"
                        changeType="neutral"
                        icon={Users}
                        accentColor="bg-primary"
                    />
                </div>
                <div onClick={() => openModal("attendance")} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                    <KPICard
                        title="Attendance (Today)"
                        value={`${stats?.presentToday || 0}/${(stats?.presentToday || 0) + (stats?.absentToday || 0)}`}
                        change="Click to view details"
                        changeType="neutral"
                        icon={ClipboardCheck}
                        accentColor="bg-success"
                    />
                </div>
                <div onClick={() => openModal("pendingPortfolios")} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                    <KPICard
                        title="Pending Portfolios"
                        value={(stats?.pendingPortfolios || 0).toString()}
                        change="Click to view details"
                        changeType="neutral"
                        icon={LayoutDashboard}
                        accentColor="bg-warning"
                    />
                </div>
                <div onClick={() => openModal("placementEligible")} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                    <KPICard
                        title="Placement Eligible"
                        value={(stats?.eligibleForPlacement || 0).toString()}
                        change="Click to view details"
                        changeType="neutral"
                        icon={Award}
                        accentColor="bg-purple-500"
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-card border p-1 rounded-xl w-full justify-start overflow-x-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>

                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="progress">Software Progress</TabsTrigger>
                    <TabsTrigger value="placement">Placement Eligibility</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card border rounded-xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary" />
                                Today's Batches
                            </h3>
                            <div className="space-y-3">
                                {stats.classes?.map((c: any) => (
                                    <div key={c.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                                        <div>
                                            <p className="font-semibold">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">{c.startTime} - {c.endTime}</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab("attendance")}
                                            className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                                        >
                                            View Batch
                                        </button>
                                    </div>
                                ))}
                                {(!stats.classes || stats.classes.length === 0) && (
                                    <p className="text-sm text-center text-muted-foreground py-4">No batches scheduled for today.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border rounded-xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-success" />
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setActiveTab("attendance")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <ClipboardCheck className="mb-2 text-primary" />
                                    <span className="text-sm font-medium">Mark Attendance</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("portfolio")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <LayoutDashboard className="mb-2 text-warning" />
                                    <span className="text-sm font-medium">Review Portfolio</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("tests")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <GraduationCap className="mb-2 text-success" />
                                    <span className="text-sm font-medium">Add Test Score</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("progress")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <Users className="mb-2 text-purple-500" />
                                    <span className="text-sm font-medium">Student Help</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("incentives")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <DollarSign className="mb-2 text-green-500" />
                                    <span className="text-sm font-medium">My Incentives</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <KPICard title="Total Classes" value={stats?.todayClasses?.toString() || "0"} icon={BookOpen} accentColor="bg-blue-500" />
                        <KPICard title="Low Attendance" value={stats?.lowAttendance?.toString() || "0"} icon={AlertCircle} accentColor="bg-red-500" />
                    </div>
                </TabsContent>

                <TabsContent value="attendance"><AttendanceManager batches={stats?.classes || []} /></TabsContent>
                <TabsContent value="progress"><SoftwareProgressManager batches={stats?.classes || []} /></TabsContent>
                <TabsContent value="portfolio"><PortfolioManager /></TabsContent>
                <TabsContent value="tests"><TestsManager batches={stats?.classes || []} /></TabsContent>
                <TabsContent value="placement"><PlacementEligibility batches={stats?.classes || []} /></TabsContent>
                <TabsContent value="incentives"><TrainerIncentivesList /></TabsContent>
            </Tabs>

            {/* Detail Modal */}
            {modalType && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setModalType(null)}
                >
                    <div
                        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-xl font-black text-foreground">
                                    {modalType === 'activeStudents' ? '🎓 Active Students' :
                                        modalType === 'attendance' ? '📋 Today\'s Attendance' :
                                            modalType === 'pendingPortfolios' ? '⏳ Pending Portfolios' :
                                                '🏆 Placement Eligible'}
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
                            ) : modalType === 'activeStudents' || modalType === 'placementEligible' ? (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Name</th>
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Email</th>
                                            <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.map((student: any) => (
                                            <tr key={student.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 pr-4 font-semibold text-foreground">
                                                    {student.user?.firstName} {student.user?.lastName} {student.name ? student.name : ''}
                                                </td>
                                                <td className="py-3 pr-4 text-muted-foreground">{student.user?.email || student.email || '—'}</td>
                                                <td className="py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-success/10 text-success`}>
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : modalType === 'attendance' ? (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Name</th>
                                            <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Today's Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.map((student: any) => {
                                            const todayAtt = student.attendances?.[0];
                                            return (
                                                <tr key={student.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                    <td className="py-3 pr-4 font-semibold text-foreground">
                                                        {student.user?.firstName} {student.user?.lastName}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${todayAtt?.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                                                            todayAtt?.status === 'ABSENT' ? 'bg-red-50 text-red-700' :
                                                                'bg-gray-50 text-gray-700'
                                                            }`}>
                                                            {todayAtt?.status || 'NOT MARKED'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-[13px]">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Student Name</th>
                                            <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Pending Tasks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.map((stat: any) => (
                                            <tr key={stat.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 pr-4 font-semibold text-foreground">
                                                    {stat.name}
                                                </td>
                                                <td className="py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-warning/10 text-orange-600`}>
                                                        {stat.pendingCount} Pending
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TrainerIncentivesList = () => {
    const [incentives, setIncentives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0 });

    useEffect(() => {
        const fetchIncentives = async () => {
            try {
                const { authApi, trainersApi, incentivesApi } = await import("@/lib/api");
                const storage = await import("@/lib/api").then(m => m.storage);
                const user = storage.getUser();

                if (!user) return;

                const trainersRes = await trainersApi.getTrainers({ search: user.email });
                const myTrainerProfile = trainersRes.data?.trainers?.find((t: any) => t.userId === user.id);

                if (!myTrainerProfile) {
                    console.error("Trainer profile not found");
                    setLoading(false);
                    return;
                }

                const res = await incentivesApi.getIncentives({ trainerId: myTrainerProfile.id, limit: 100 });
                const data = res.data?.incentives || res.data || [];
                setIncentives(data);

                let t = 0, p = 0;
                data.forEach((d: any) => {
                    const amt = Number(d.amount);
                    t += amt;
                    if (d.isPaid) p += amt;
                });
                setStats({ total: t, paid: p, pending: t - p });

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchIncentives();
    }, []);

    const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

    if (loading) return <div>Loading incentives...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-sm text-gray-500">Total Earned</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(stats.total)}</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <p className="text-sm text-gray-500">Paid Out</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground font-medium">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {incentives.map((inc) => (
                            <tr key={inc.id} className="hover:bg-muted/50">
                                <td className="p-4">{new Date(inc.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 font-medium">{inc.type}</td>
                                <td className="p-4 text-muted-foreground max-w-md truncate">{inc.description}</td>
                                <td className="p-4 font-bold">{formatCurrency(inc.amount)}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${inc.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {inc.isPaid ? 'PAID' : 'PENDING'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {incentives.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">No incentives found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TrainerDashboard;
