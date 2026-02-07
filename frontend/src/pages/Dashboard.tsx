import { Users, UserPlus, GraduationCap, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import KPICard from "@/components/KPICard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const branchData = [
  { branch: "Main Branch", leads: 145, admissions: 89, students: 220, placements: 45 },
  { branch: "North Branch", leads: 98, admissions: 62, students: 180, placements: 32 },
  { branch: "South Branch", leads: 76, admissions: 48, students: 150, placements: 28 },
];

const trainerData = [
  { name: "Priya Sharma", course: "Full Stack Dev", students: 45, rating: 4.8, status: "Active" },
  { name: "Rahul Verma", course: "Data Science", students: 38, rating: 4.6, status: "Active" },
  { name: "Sneha Patel", course: "UI/UX Design", students: 32, rating: 4.9, status: "Active" },
  { name: "Vikram Singh", course: "DevOps", students: 28, rating: 4.5, status: "On Leave" },
];

const courseChart = [
  { name: "Full Stack", value: 35 },
  { name: "Data Science", value: 28 },
  { name: "UI/UX", value: 20 },
  { name: "DevOps", value: 17 },
];

const COLORS = ["hsl(217, 71%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(262, 60%, 55%)"];

const placementChart = [
  { month: "Jan", placed: 12 },
  { month: "Feb", placed: 18 },
  { month: "Mar", placed: 15 },
  { month: "Apr", placed: 22 },
  { month: "May", placed: 28 },
  { month: "Jun", placed: 24 },
];

const Dashboard = () => {
  return (
    <div className="animate-fade-in">
      <PageHeader title="CEO Dashboard" description="Overview of all branches and operations" />

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Leads" value="319" change="+12% from last month" changeType="positive" icon={UserPlus} accentColor="bg-primary" />
        <KPICard title="Admissions" value="199" change="+8% from last month" changeType="positive" icon={Users} accentColor="bg-success" />
        <KPICard title="Active Students" value="550" change="+5% from last month" changeType="positive" icon={GraduationCap} accentColor="bg-warning" />
        <KPICard title="Placements" value="105" change="-3% from last month" changeType="negative" icon={Briefcase} accentColor="bg-purple-500" />
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Placement Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={placementChart}>
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
              <Pie data={courseChart} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {courseChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch Performance Table */}
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
              {branchData.map((b) => (
                <tr key={b.branch}>
                  <td className="font-medium">{b.branch}</td>
                  <td>{b.leads}</td>
                  <td>{b.admissions}</td>
                  <td>{b.students}</td>
                  <td>{b.placements}</td>
                  <td>
                    <StatusBadge status={`${Math.round((b.admissions / b.leads) * 100)}%`} variant="info" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              {trainerData.map((t) => (
                <tr key={t.name}>
                  <td className="font-medium">{t.name}</td>
                  <td>{t.course}</td>
                  <td>{t.students}</td>
                  <td>⭐ {t.rating}</td>
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
