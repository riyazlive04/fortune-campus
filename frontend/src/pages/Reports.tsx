import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const branchPerformance = [
  { branch: "Main", leads: 145, admissions: 89, placements: 45 },
  { branch: "North", leads: 98, admissions: 62, placements: 32 },
  { branch: "South", leads: 76, admissions: 48, placements: 28 },
];

const trainerContribution = [
  { month: "Jan", priya: 8, rahul: 6, sneha: 5, vikram: 4 },
  { month: "Feb", priya: 10, rahul: 7, sneha: 6, vikram: 3 },
  { month: "Mar", priya: 9, rahul: 8, sneha: 7, vikram: 5 },
  { month: "Apr", priya: 12, rahul: 9, sneha: 6, vikram: 4 },
  { month: "May", priya: 11, rahul: 10, sneha: 8, vikram: 6 },
];

const courseSuccess = [
  { course: "Full Stack Dev", enrolled: 85, completed: 68, placed: 45, rate: "66%" },
  { course: "Data Science", enrolled: 62, completed: 50, placed: 32, rate: "64%" },
  { course: "UI/UX Design", enrolled: 48, completed: 40, placed: 20, rate: "50%" },
  { course: "DevOps", enrolled: 35, completed: 25, placed: 15, rate: "60%" },
];

const Reports = () => (
  <div className="animate-fade-in">
    <PageHeader title="Reports" description="Performance reports and analytics" actions={<Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Export</Button>} />

    <Tabs defaultValue="branch">
      <TabsList><TabsTrigger value="branch">Branch Performance</TabsTrigger><TabsTrigger value="trainer">Trainer Contribution</TabsTrigger><TabsTrigger value="course">Course Success</TabsTrigger></TabsList>

      <TabsContent value="branch" className="mt-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={branchPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="branch" stroke="hsl(215, 16%, 47%)" />
              <YAxis stroke="hsl(215, 16%, 47%)" />
              <Tooltip />
              <Bar dataKey="leads" fill="hsl(217, 71%, 53%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="admissions" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="placements" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>

      <TabsContent value="trainer" className="mt-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trainerContribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" stroke="hsl(215, 16%, 47%)" />
              <YAxis stroke="hsl(215, 16%, 47%)" />
              <Tooltip />
              <Line type="monotone" dataKey="priya" stroke="hsl(217, 71%, 53%)" strokeWidth={2} />
              <Line type="monotone" dataKey="rahul" stroke="hsl(142, 71%, 45%)" strokeWidth={2} />
              <Line type="monotone" dataKey="sneha" stroke="hsl(38, 92%, 50%)" strokeWidth={2} />
              <Line type="monotone" dataKey="vikram" stroke="hsl(262, 60%, 55%)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </TabsContent>

      <TabsContent value="course" className="mt-4">
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Course</th><th>Enrolled</th><th>Completed</th><th>Placed</th><th>Success Rate</th></tr></thead>
            <tbody>
              {courseSuccess.map((c, i) => (
                <tr key={i}><td className="font-medium">{c.course}</td><td>{c.enrolled}</td><td>{c.completed}</td><td>{c.placed}</td><td><span className="status-badge status-badge-info">{c.rate}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export default Reports;
