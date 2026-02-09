import { useState, useEffect } from "react";
import { Users, UserPlus, GraduationCap, Briefcase } from "lucide-react";
import KPICard from "@/components/KPICard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { dashboardApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["hsl(217, 71%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 60%, 55%)"];

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      if (res.success) {
        setData(res.data);
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
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader title="CEO Dashboard" description="Overview of all branches and operations" />

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

      {/* Trainer Summary */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Trainer Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trainer</th>
                <th>Course</th>
                <th>Students</th>
                <th>Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.trainerPerformance.map((t: any) => (
                <tr key={t.name}>
                  <td className="font-medium">{t.name}</td>
                  <td>{t.course}</td>
                  <td>{t.students}</td>
                  <td>⭐ {t.rating.toFixed(1)}</td>
                  <td>
                    <StatusBadge status={t.status} variant={t.status === "Active" ? "success" : "warning"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
