import { useState, useEffect } from "react";
import { Users, UserPlus, GraduationCap, Briefcase, Award, Zap, X, Loader2, Clock, Calendar } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TrainerHistoryModal from "@/components/TrainerHistoryModal";
import ModernBackground from "@/components/ModernBackground";

const COLORS = ["hsl(217, 71%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 60%, 55%)"];

const Dashboard = () => {
  const user = storage.getUser();

  // 1. ALL HOOKS MUST BE DECLARED FIRST
  const [viewingTrainerId, setViewingTrainerId] = useState<string | null>(null);
  const { toast } = useToast();

  const [modalType, setModalType] = useState<'leads' | 'students' | 'placements' | 'admissions' | 'revenue' | null>(null);
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isTopPerformerModalOpen, setIsTopPerformerModalOpen] = useState(false);
  const [selectedHistoryTrainer, setSelectedHistoryTrainer] = useState<{ id: string, name: string } | null>(null);

  const openModal = async (type: 'leads' | 'students' | 'placements' | 'admissions' | 'revenue') => {
    setModalType(type);

    // For CEO, we use the branchPerformance data already fetched, no need for separate API calls
    if (user?.role === 'CEO') {
      setModalLoading(false);
      return;
    }

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
        const res = await admissionsApi.getAdmissions({ limit: 100, status: 'all' });
        const admissions = res.data?.admissions || res.data || [];
        setModalData(Array.isArray(admissions) ? admissions : []);
      } else if (type === 'revenue') {
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

  const isMainDashboardRole = !['TRAINER', 'STUDENT', 'CHANNEL_PARTNER', 'TELECALLER'].includes(user?.role || '');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await dashboardApi.getStats();
      if (!res.success) throw new Error(res.message || "Failed to fetch stats");
      return res.data.stats || res.data;
    },
    enabled: isMainDashboardRole,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: perfData, isLoading: perfLoading } = useQuery({
    queryKey: ['trainerPerformance'],
    queryFn: async () => {
      const res = await reportsApi.getTrainerPerformance({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      return res.data || [];
    },
    enabled: isMainDashboardRole,
    staleTime: 10 * 60 * 1000,
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['trainerAttendanceHistory'],
    queryFn: async () => {
      const res = await trainerAttendanceApi.getHistory({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      return res.data || [];
    },
    enabled: isMainDashboardRole,
    staleTime: 2 * 60 * 1000,
  });

  const data = statsData;
  const performance = perfData || [];
  const trainerAttendance = attendanceData || [];
  const loading = statsLoading || perfLoading || attendanceLoading;

  // 2. EARLY RETURNS
  if (user?.role === 'TRAINER') {
    return <TrainerDashboard />;
  }

  if (viewingTrainerId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewingTrainerId(null)}
          className="flex items-center gap-2 text-primary hover:underline font-bold"
        >
          <Zap className="h-4 w-4 rotate-180" />
          Back to Campus Overview
        </button>
        <TrainerDashboard trainerId={viewingTrainerId} />
      </div>
    );
  }

  if (user?.role === 'STUDENT') {
    return <StudentDashboard />;
  }

  if (user?.role === 'CHANNEL_PARTNER') {
    return <BranchHeadDashboard />;
  }

  if (user?.role === 'TELECALLER') {
    // Safety redirect to telecaller dashboard
    window.location.href = '/telecaller/dashboard';
    return null;
  }

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0, filter: "blur(4px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div
      className="max-w-[1600px] mx-auto space-y-10 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <ModernBackground />

      <motion.div variants={itemVariants} className="flex flex-col gap-3 relative group">
        {/* Decorative background square design element */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/5 rounded-3xl -z-10 blur-2xl group-hover:bg-primary/10 transition-colors duration-700" />
        <div className="absolute top-0 right-0 w-20 h-20 border border-primary/10 rounded-2xl -z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />

        <h1 className="text-4xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
          CEO DASHBOARD_CEO
        </h1>
        <p className="text-[14px] text-muted-foreground font-medium max-w-2xl leading-relaxed">
          Monitor your institution's pulse with real-time tracking of academic performance, student success, and faculty excellence.
        </p>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          title="Overall Revenue"
          value={`₹${(data?.kpis?.revenue?.value || 0).toLocaleString('en-IN')}`}
          change="Click to view details"
          changeType="neutral"
          icon={Briefcase}
          accentColor="bg-emerald-500"
          onClick={() => openModal('revenue')}
        />
        <KPICard
          title="Active Students"
          value={data?.kpis?.activeStudents?.value?.toString() || "0"}
          change="Click to view details"
          changeType="neutral"
          icon={GraduationCap}
          accentColor="bg-amber-500"
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
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
        <div className="lg:col-span-2 glass-card rounded-3xl overflow-hidden flex flex-col h-full border border-border/40">
          <div className="p-8 border-b border-border/20 flex justify-between items-center bg-muted/5">
            <div>
              <h3 className="text-xl font-black text-foreground">Faculty Rankings</h3>
              <p className="text-[12px] text-muted-foreground font-semibold">Performance scores based on training quality</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl shadow-sm">
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
                    <tr
                      key={t.trainerId}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setViewingTrainerId(t.trainerId)}
                    >
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
                              style={{ width: `${Math.min(Number(t.score), 100)}% ` }}
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
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trainer Attendance Section */}
        <div className="lg:col-span-3 glass-card rounded-3xl overflow-hidden flex flex-col h-full border border-border/40">
          <div className="p-8 border-b border-border/20 flex justify-between items-center bg-muted/5">
            <div>
              <h3 className="text-xl font-black text-foreground">Live Attendance</h3>
              <p className="text-[12px] text-muted-foreground font-semibold">Daily trainer presence across all campus branches</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl shadow-sm">
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
                    trainerAttendance.map((att) => (
                      <tr key={att.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors group">
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => setSelectedHistoryTrainer({
                              id: att.trainer?.id,
                              name: `${att.trainer?.user?.firstName} ${att.trainer?.user?.lastName} `
                            })}
                            className="font-bold text-foreground hover:text-primary transition-colors text-left"
                          >
                            {att.trainer?.user?.firstName} {att.trainer?.user?.lastName}
                          </button>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{att.trainer?.branch?.name || "General"}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            status={att.status}
                            variant={att.status === 'PRESENT' ? 'success' : att.status === 'LATE' ? 'warning' : att.status === 'ABSENT' ? 'danger' : 'neutral'}
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
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={!!modalType} onOpenChange={(open) => !open && setModalType(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-card">
            <div>
              <DialogTitle className="text-xl font-black text-foreground capitalize">
                {modalType === 'leads' ? 'Total Leads' : modalType === 'students' ? 'Active Students' : modalType === 'admissions' ? 'Admissions' : modalType === 'revenue' ? 'Overall Revenue' : 'Placements'} Breakdown
              </DialogTitle>
              <p className="text-[12px] text-muted-foreground mt-1 font-medium">
                {modalLoading ? 'Loading statistics...' : user?.role === 'CEO' ? 'Detailed performance metrics across all branches' : `${modalData.length} records found`}
              </p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="overflow-auto flex-1 p-6 bg-background">
            {modalLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : user?.role === 'CEO' ? (
              <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr>
                      <th className="p-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Branch Name</th>
                      <th className="p-4 text-right font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Metric Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(data?.branchPerformance || []).map((branch: any) => (
                      <tr key={branch.branch} className="hover:bg-muted/20 transition-colors group">
                        <td className="p-4 font-bold text-foreground/90 group-hover:text-primary transition-colors">{branch.branch}</td>
                        <td className="p-4 text-right font-black text-foreground tabular-nums">
                          {modalType === 'leads' ? branch.leads :
                            modalType === 'admissions' ? branch.admissions :
                              modalType === 'students' ? branch.students :
                                modalType === 'revenue' ? `₹${(branch.revenue || 0).toLocaleString('en-IN')}` :
                                  branch.placements}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : modalData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <div className="bg-muted/20 p-4 rounded-full mb-3">
                  <GraduationCap className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-semibold italic">No records found for this category.</p>
              </div>
            ) : modalType === 'leads' ? (
              <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                <table className="w-full text-[13px]">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr className="text-left">
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Student Name</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Contact</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Course</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Branch</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {modalData.map((lead: any) => (
                      <tr key={lead.id} className="hover:bg-muted/20 transition-all group">
                        <td className="p-4 font-bold text-foreground group-hover:text-primary transition-colors">{lead.name || lead.firstName + ' ' + lead.lastName}</td>
                        <td className="p-4 text-muted-foreground selection:bg-primary/10">{lead.phone || lead.mobile || '—'}</td>
                        <td className="p-4 text-muted-foreground font-medium">{lead.course?.name || lead.courseName || '—'}</td>
                        <td className="p-4 text-muted-foreground font-medium">{lead.branch?.name || lead.branchName || '—'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-black tracking-wider shadow-sm ${lead.status === 'CONVERTED' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' :
                            lead.status === 'DEMO_SCHEDULED' ? 'bg-teal-100/50 text-teal-700 border border-teal-200/50' :
                              lead.status === 'NEGOTIATING' ? 'bg-amber-100/50 text-amber-700 border border-amber-200/50' :
                                lead.status === 'HOT' ? 'bg-red-100/50 text-red-700 border border-red-200/50' :
                                  lead.status === 'WARM' ? 'bg-orange-100/50 text-orange-700 border border-orange-200/50' :
                                    'bg-slate-100/50 text-slate-700 border border-slate-200/50'
                            } `}>{lead.status || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : modalType === 'students' ? (
              <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                <table className="w-full text-[13px]">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr className="text-left">
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Student</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Enrolled Course</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Branch</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Batch Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {modalData.map((student: any) => (
                      <tr key={student.id} className="hover:bg-muted/20 transition-all group">
                        <td className="p-4 font-bold text-foreground group-hover:text-primary transition-colors">
                          {student.user?.firstName} {student.user?.lastName}
                        </td>
                        <td className="p-4 text-muted-foreground font-medium">{student.course?.name || '—'}</td>
                        <td className="p-4 text-muted-foreground font-medium">{student.branch?.name || '—'}</td>
                        <td className="p-4 text-muted-foreground font-bold">{student.batch?.name || student.batchCode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (modalType === 'admissions' || modalType === 'revenue') ? (
              <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                <table className="w-full text-[13px]">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr className="text-left">
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Student</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Phone</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Course</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Branch</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Admission Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {modalData.map((admission: any) => (
                      <tr key={admission.id} className="hover:bg-muted/20 transition-all group">
                        <td className="p-4 font-bold text-foreground group-hover:text-primary transition-colors">
                          {admission.firstName} {admission.lastName}
                        </td>
                        <td className="p-4 text-muted-foreground">{admission.phone || '—'}</td>
                        <td className="p-4 text-muted-foreground font-medium">{admission.course?.name || '—'}</td>
                        <td className="p-4 text-muted-foreground font-medium">{admission.branch?.name || '—'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-black tracking-wider shadow-sm ${admission.status === 'CONVERTED' || admission.status === 'APPROVED' || admission.status === 'ADMITTED' || admission.status === 'CONFIRMED' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' :
                            admission.status === 'PENDING' || admission.status === 'NEW' ? 'bg-amber-100/50 text-amber-700 border border-amber-200/50' :
                              admission.status === 'DROPOUT' ? 'bg-red-100/50 text-red-700 border border-red-200/50' :
                                'bg-slate-100/50 text-slate-700 border border-slate-200/50'
                            } `}>{admission.status || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                <table className="w-full text-[13px]">
                  <thead className="bg-muted/40 border-b border-border/60">
                    <tr className="text-left">
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Student</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Company</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Role</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Package Details</th>
                      <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {modalData.map((p: any) => (
                      <tr key={p.id} className="hover:bg-muted/20 transition-all group">
                        <td className="p-4 font-bold text-foreground group-hover:text-primary transition-colors">
                          {p.student?.user?.firstName} {p.student?.user?.lastName}
                        </td>
                        <td className="p-4 text-muted-foreground font-semibold">{p.company?.name || p.companyName || '—'}</td>
                        <td className="p-4 text-muted-foreground font-medium">{p.role || p.jobTitle || '—'}</td>
                        <td className="p-4 text-muted-foreground font-black">{p.package || p.salary ? `₹${p.package || p.salary} ` : '—'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[10px] font-black tracking-wider shadow-sm ${p.status === 'PLACED' ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200/50' :
                            p.status === 'PENDING' ? 'bg-amber-100/50 text-amber-700 border border-amber-200/50' :
                              'bg-slate-100/50 text-slate-700 border border-slate-200/50'
                            } `}>{p.status || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Trainer Attendance History Modal */}
      <TrainerHistoryModal
        isOpen={!!selectedHistoryTrainer}
        onClose={() => setSelectedHistoryTrainer(null)}
        trainerId={selectedHistoryTrainer?.id || null}
        trainerName={selectedHistoryTrainer?.name || null}
      />
    </motion.div>
  );
};

export default Dashboard;
