import { useState, useEffect } from "react";
import { Users, UserPlus, GraduationCap, Briefcase, Award, Zap, X, Loader2, Clock, Calendar } from "lucide-react";
import KPICard from "@/components/KPICard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { dashboardApi, reportsApi, storage, leadsApi, studentsApi, placementsApi, admissionsApi, trainerAttendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TrainerDashboard from "./TrainerDashboard";
import StudentDashboard from "./StudentDashboard";
import BranchHeadDashboard from "./BranchHeadDashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLORS = ["hsl(217, 71%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 60%, 55%)"];

const Dashboard = () => {
  const user = storage.getUser();

  if (user?.role === 'TRAINER') {
    return <TrainerDashboard />;
  }

  if (user?.role === 'STUDENT') {
    return <StudentDashboard />;
  }

  if (user?.role === 'CHANNEL_PARTNER') {
    return <BranchHeadDashboard />;
  }

  const [data, setData] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [trainerAttendance, setTrainerAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Detail modal state
  const [modalType, setModalType] = useState<'leads' | 'students' | 'placements' | 'admissions' | null>(null);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isTopPerformerModalOpen, setIsTopPerformerModalOpen] = useState(false);

  const openModal = async (type: 'leads' | 'students' | 'placements' | 'admissions') => {
    setModalType(type);
    setModalData([]);
    setModalLoading(true);
    try {
      if (type === 'leads') {
        const res = await leadsApi.getLeads({ limit: 100 });
        const leads = res.data?.leads || res.data || [];
        setModalData(Array.isArray(leads) ? leads : []);
      } else if (type === 'students') {
        const res = await studentsApi.getStudents({ limit: 100 });
        const students = res.data?.students || res.data || [];
        setModalData(Array.isArray(students) ? students : []);
      } else if (type === 'placements') {
        const res = await placementsApi.getPlacements({ limit: 100 });
        const placements = res.data?.placements || res.data || [];
        setModalData(Array.isArray(placements) ? placements : []);
      } else if (type === 'admissions') {
        const res = await admissionsApi.getAdmissions({ limit: 100 });
        const admissions = res.data?.admissions || res.data || [];
        setModalData(Array.isArray(admissions) ? admissions : []);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to load ${type}` });
    } finally {
      setModalLoading(false);
    }
  };

  const fetchStats = async () => {
    console.log("🚀 Starting fetchStats...");
    try {
      setLoading(true);

      // Add a timeout to the fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15s

      const [statsRes, perfRes, attendanceRes] = await Promise.all([
        dashboardApi.getStats().then(res => {
          console.log("✅ getStats resolved");
          return res;
        }),
        reportsApi.getTrainerPerformance({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }).catch((err) => {
          console.warn("⚠️ getTrainerPerformance failed:", err);
          return { success: true, data: [] };
        }),
        trainerAttendanceApi.getHistory({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }).catch((err) => {
          console.warn("⚠️ getTrainerAttendance failed:", err);
          return { success: true, data: [] };
        })
      ]);

      clearTimeout(timeoutId);

      if (statsRes.success) {
        console.log("📊 Dashboard Stats Content:", statsRes.data);
        setData(statsRes.data.stats || statsRes.data);
      } else {
        console.error("❌ Dashboard Stats Failed:", statsRes);
      }

      if (perfRes.success) {
        setPerformance(perfRes.data);
      }

      if (attendanceRes?.data) {
        setTrainerAttendance(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
      }

    } catch (error: any) {
      console.error("🔥 Dashboard Fetch Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch dashboard stats",
      });
    } finally {
      console.log("🏁 fetchStats finished");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <PageHeader title="Dashboard Unavailable" description="We encountered an issue while loading your metrics." />
        <p className="text-muted-foreground">Please try refreshing the page or check your connection.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Refresh Dashboard
        </button>
      </div>
    );
  }

  const dashboardTitle = user?.role === 'CEO'
    ? `${user?.firstName} ${user?.lastName} (CEO)`
    : `${user?.firstName} ${user?.lastName} (${user?.branch?.name || 'Branch'})`;
  const dashboardDescription = user?.role === 'CEO'
    ? "Overview of all branches and operations"
    : `Overview of ${user?.branch?.name || 'branch'} operations`;

  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Campus Performance Dashboard
        </h1>
        <p className="text-[13px] text-muted-foreground font-medium">
          Visualize academic performance, student success rates, and faculty delivery excellence.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Leads"
          value={data?.kpis?.leads?.value?.toString() || "0"}
          change="Click to view details"
          changeType="neutral"
          icon={UserPlus}
          accentColor="bg-primary"
          onClick={() => openModal('leads')}
        />
        <KPICard
          title="Admissions"
          value={data?.kpis?.admissions?.value?.toString() || "0"}
          change="Click to view details"
          changeType="neutral"
          icon={Users}
          accentColor="bg-success"
          onClick={() => openModal('admissions')}
        />
        <KPICard
          title="Active Students"
          value={data?.kpis?.activeStudents?.value?.toString() || "0"}
          change="Click to view details"
          changeType="neutral"
          icon={GraduationCap}
          accentColor="bg-warning"
          onClick={() => openModal('students')}
        />
        <KPICard
          title="Placements"
          value={data?.kpis?.placements?.value?.toString() || "0"}
          change="Click to view details"
          changeType="neutral"
          icon={Briefcase}
          accentColor="bg-purple-500"
          onClick={() => openModal('placements')}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile/Standing Section */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div
            className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center relative overflow-hidden h-full min-h-[400px] cursor-pointer hover:border-primary/50 hover:bg-muted/10 transition-colors"
            onClick={() => setIsTopPerformerModalOpen(true)}
          >
            <div className="absolute top-4 right-4 bg-muted/50 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Top Performer
            </div>
            <div className="mb-6 bg-primary/5 p-4 rounded-full ring-8 ring-primary/5">
              <Award className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-1">
              {performance.length > 0 ? performance[0].name : "Evaluating..."}
            </h3>
            <p className="text-[12px] text-muted-foreground font-semibold mb-10">
              {performance.length > 0 ? (performance[0].branch ? performance[0].branch : 'General') : 'Gathering details...'}
            </p>

            <div className="flex gap-12 mb-10">
              <div className="flex flex-col items-center">
                <div className="relative h-20 w-20 flex items-center justify-center rounded-full border-[6px] border-primary mb-2">
                  <span className="text-xl font-black text-primary">
                    {performance.length > 0 ? (Number(performance[0].avgQuality) * 10).toFixed(0) : "85"}%
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Top Performance</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative h-20 w-20 flex items-center justify-center rounded-full border-[6px] border-secondary mb-2">
                  <span className="text-xl font-black text-secondary">
                    {data?.kpis?.admissions?.value > 0
                      ? ((data?.kpis?.placements?.value / data?.kpis?.admissions?.value) * 100).toFixed(0)
                      : "72"}%
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Placement Rate</span>
              </div>
            </div>

            <div className="mt-auto w-full bg-muted/30 border border-border rounded-xl p-4 text-left">
              <p className="text-[10px] font-bold uppercase text-primary mb-1">Next Tier: <span className="text-emerald-500 underline">Platinum Leader</span></p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Increase your overall performance score through successful student outcomes and consistent batch engagement.
              </p>
            </div>
          </div>
        </div>

        {/* Rankings Section */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-border flex justify-between items-center bg-muted/5">
            <div>
              <h3 className="text-lg font-black text-foreground">Faculty Performance Rankings</h3>
              <p className="text-[11px] text-muted-foreground font-semibold">Ranked by training quality and success scores</p>
            </div>
            <div className="bg-primary/5 p-3 rounded-full">
              <Award className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <tbody>
                  {performance.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-20 text-muted-foreground font-semibold">Gathering ranking data...</td></tr>
                  ) : performance.slice(0, 5).map((t, idx) => (
                    <tr key={t.trainerId} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary border border-primary/20">
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="text-[14px] text-foreground mb-0.5 font-bold">{t.name}</p>
                            <p className="text-[11px] text-muted-foreground mb-1">{t.branch ? t.branch : 'General'}</p>
                            <p className="text-[12px] font-bold text-primary flex items-center gap-1.5">
                              <Zap className="h-3 w-3 fill-primary" />
                              FACULTY ⚡ {(Number(t.avgQuality) * 10).toFixed(0)}% Performance
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground/70 tracking-tighter">
                            <span>Delivery Band</span>
                            <span>Target</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/50">
                            <div
                              className="h-full bg-primary transition-all duration-1000"
                              style={{ width: `${Math.min(Number(t.score), 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[18px] font-black tracking-tighter text-foreground leading-none">
                            {t.score}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mt-1">SCORE</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trainer Attendance Section */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-border flex justify-between items-center bg-muted/5">
            <div>
              <h3 className="text-lg font-black text-foreground">Trainer Attendance (Today)</h3>
              <p className="text-[11px] text-muted-foreground font-semibold">Live tracking of all trainers across branches</p>
            </div>
            <div className="bg-primary/5 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Trainer</th>
                    <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Branch</th>
                    <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                    <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">In-Time</th>
                    <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Out-Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trainerAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Clock className="h-6 w-6 mb-2 opacity-20" />
                          <p className="text-xs italic font-semibold">No trainer attendance marked for today.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    trainerAttendance.map((att: any) => (
                      <tr key={att.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-foreground">
                          {att.trainer?.user?.firstName} {att.trainer?.user?.lastName}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {att.trainer?.branch?.name || "General"}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            status={att.status}
                            variant={att.status === 'PRESENT' ? 'success' : att.status === 'ABSENT' ? 'danger' : 'warning'}
                          />
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground font-medium">
                          {att.inTime ? new Date(att.inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                        </td>
                        <td className="py-3 font-medium text-muted-foreground">
                          {att.outTime ? new Date(att.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
                  {modalType === 'leads' ? '📋 Total Leads' : modalType === 'students' ? '🎓 Active Students' : modalType === 'admissions' ? '✅ Admissions' : '💼 Placements'}
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
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Branch</th>
                      <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((lead: any) => (
                      <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-foreground">{lead.name || lead.firstName + ' ' + lead.lastName}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{lead.phone || lead.mobile || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{lead.course?.name || lead.courseName || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{lead.branch?.name || lead.branchName || '—'}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${lead.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700' :
                            lead.status === 'HOT' ? 'bg-red-50 text-red-700' :
                              lead.status === 'WARM' ? 'bg-orange-50 text-orange-700' :
                                'bg-gray-50 text-gray-700'
                            }`}>{lead.status || '—'}</span>
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
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Branch</th>
                      <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((student: any) => (
                      <tr key={student.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-foreground">
                          {student.user?.firstName} {student.user?.lastName}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{student.course?.name || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{student.branch?.name || '—'}</td>
                        <td className="py-3 text-muted-foreground">{student.batch?.name || student.batchCode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : modalType === 'admissions' ? (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Name</th>
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Phone</th>
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Course</th>
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Branch</th>
                      <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((admission: any) => (
                      <tr key={admission.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-foreground">
                          {admission.firstName} {admission.lastName}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{admission.phone || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{admission.course?.name || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{admission.branch?.name || '—'}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${admission.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                            admission.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                              admission.status === 'DROPOUT' ? 'bg-red-50 text-red-700' :
                                'bg-gray-50 text-gray-700'
                            }`}>{admission.status || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Student</th>
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Company</th>
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Role</th>
                      <th className="pb-3 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Package</th>
                      <th className="pb-3 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((p: any) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-foreground">
                          {p.student?.user?.firstName} {p.student?.user?.lastName}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.company?.name || p.companyName || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.role || p.jobTitle || '—'}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.package || p.salary ? `₹${p.package || p.salary}` : '—'}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === 'PLACED' ? 'bg-emerald-50 text-emerald-700' :
                            p.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>{p.status || '—'}</span>
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

      {/* Top Performer Details Modal */}
      <Dialog open={isTopPerformerModalOpen} onOpenChange={setIsTopPerformerModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Top Performer Breakdown</DialogTitle>
          </DialogHeader>
          {performance.length > 0 && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 border-b pb-4 border-border">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-bold">{performance[0].name}</h4>
                  <p className="text-sm text-muted-foreground">{performance[0].branch ? performance[0].branch : "General"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 tracking-wider">Quality Score</p>
                  <p className="text-2xl font-black text-primary">{(Number(performance[0].avgQuality) * 10).toFixed(0)}%</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 tracking-wider">Doubt Clearance</p>
                  <p className="text-2xl font-black text-secondary">{(Number(performance[0].avgDoubt) * 10).toFixed(0)}%</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 tracking-wider">Total Classes</p>
                  <p className="text-2xl font-black text-foreground">{performance[0].totalReports}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 tracking-wider">Overall Metric</p>
                  <p className="text-2xl font-black text-emerald-500">{performance[0].score}</p>
                </div>
                <div className="col-span-2 bg-muted/30 p-3 rounded-xl border border-border/50 flex justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 tracking-wider">Portfolio Checks</p>
                    <p className="text-xl font-bold text-foreground">{performance[0].portfolioChecks}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1 tracking-wider">Class Follow-ups</p>
                    <p className="text-xl font-bold text-foreground">{performance[0].classFollowUps}</p>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground mt-4 pt-4 border-t border-border leading-relaxed">
                <span className="font-bold">Why are they the best?</span> This faculty member was selected based on a weighted algorithm prioritizing exceptional teaching quality ({(Number(performance[0].avgQuality) * 10).toFixed(0)}%), proactive doubt clearance, and unmatched consistency across their last {performance[0].totalReports} sessions.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
