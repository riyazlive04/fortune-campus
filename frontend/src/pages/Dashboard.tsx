import { useState, useEffect } from "react";
import { Users, UserPlus, GraduationCap, Briefcase, Award } from "lucide-react";
import KPICard from "@/components/KPICard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { dashboardApi, reportsApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TrainerDashboard from "./TrainerDashboard";
import StudentDashboard from "./StudentDashboard";
import BranchHeadDashboard from "./BranchHeadDashboard";

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, perfRes] = await Promise.all([
        dashboardApi.getStats(),
        reportsApi.getTrainerPerformance({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        }).catch(() => ({ success: true, data: [] }))
      ]);

      if (statsRes.success) {
        setData(statsRes.data);
      }
      if (perfRes.success) {
        setPerformance(perfRes.data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch dashboard stats",
      });
    } finally {
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
    <div className="animate-fade-in">
      <PageHeader title={dashboardTitle} description={dashboardDescription} />

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Leads"
          value={data.kpis.leads.value.toString()}
          change={`${data.kpis.leads.change >= 0 ? '+' : ''}${data.kpis.leads.change}% from last month`}
          changeType={data.kpis.leads.change >= 0 ? "positive" : "negative"}
          icon={UserPlus}
          accentColor="bg-primary"
        />
        <KPICard
          title="Admissions"
          value={data.kpis.admissions.value.toString()}
          change={`${data.kpis.admissions.change >= 0 ? '+' : ''}${data.kpis.admissions.change}% from last month`}
          changeType={data.kpis.admissions.change >= 0 ? "positive" : "negative"}
          icon={Users}
          accentColor="bg-success"
        />
        <KPICard
          title="Active Students"
          value={data.kpis.activeStudents.value.toString()}
          change={`${data.kpis.activeStudents.change >= 0 ? '+' : ''}${data.kpis.activeStudents.change}% from last month`}
          changeType={data.kpis.activeStudents.change >= 0 ? "positive" : "negative"}
          icon={GraduationCap}
          accentColor="bg-warning"
        />
        <KPICard
          title="Placements"
          value={data.kpis.placements.value.toString()}
          change={`${data.kpis.placements.change >= 0 ? '+' : ''}${data.kpis.placements.change}% from last month`}
          changeType={data.kpis.placements.change >= 0 ? "positive" : "negative"}
          icon={Briefcase}
          accentColor="bg-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Placement Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.placementTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
              <Tooltip />
              <Bar dataKey="placed" fill="hsl(217, 71%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Course-wise Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.courseDistribution}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.courseDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch Performance Table - Only show if data exists */}
      {data.branchPerformance && data.branchPerformance.length > 0 && (
        <div className="mb-8 rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Branch-wise Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Leads</th>
                  <th>Admissions</th>
                  <th>Active Students</th>
                  <th>Placements</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.branchPerformance.map((b: any) => (
                  <tr key={b.branch}>
                    <td className="font-medium">{b.branch}</td>
                    <td>{b.leads}</td>
                    <td>{b.admissions}</td>
                    <td>{b.students}</td>
                    <td>{b.placements}</td>
                    <td>
                      <StatusBadge
                        status={`${b.leads > 0 ? Math.round((b.admissions / b.leads) * 100) : 0}%`}
                        variant="info"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trainer Performance & Best Performer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground">Top Performing Trainers</h3>
            <span className="text-xs text-muted-foreground">Current Month</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Trainer</th>
                  <th>Quality</th>
                  <th className="text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 ? (
                  <tr><td colSpan={4} className="text-center p-4">No performance data yet</td></tr>
                ) : performance.slice(0, 5).map((t: any, idx) => (
                  <tr key={t.trainerId}>
                    <td>{idx + 1}</td>
                    <td className="font-medium">{t.name}</td>
                    <td>⭐ {t.avgQuality}</td>
                    <td className="text-right font-bold text-primary">{t.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {performance.length > 0 && (
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-6 flex flex-col items-center justify-center text-center">
            <div className="mb-4 bg-yellow-100 p-3 rounded-full">
              <Award className="h-10 w-10 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold">Best Performer</h3>
            <p className="text-2xl font-black text-primary my-2">{performance[0].name}</p>
            <div className="mt-4 flex gap-4 text-xs font-semibold uppercase text-muted-foreground">
              <div className="flex flex-col">
                <span>Quality</span>
                <span className="text-foreground text-lg">{performance[0].avgQuality}</span>
              </div>
              <div className="flex flex-col">
                <span>Reports</span>
                <span className="text-foreground text-lg">{performance[0].totalReports}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
