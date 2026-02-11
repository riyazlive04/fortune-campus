
import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { reportsApi, branchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Reports = () => {
  const [branchPerformance, setBranchPerformance] = useState<any[]>([]);
  const [trainerContribution, setTrainerContribution] = useState<any[]>([]);
  const [courseSuccess, setCourseSuccess] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Branch Performance
        try {
          const branchesRes = await branchesApi.getBranches();
          const branches = branchesRes.data || [];

          if (branches.length > 0) {
            const branchReportsPromises = branches.map((b: any) =>
              reportsApi.getBranchReport({ branchId: b.id })
                .then(res => ({
                  branch: b.name,
                  leads: Number(res.data?.leads?.total || 0),
                  admissions: Number(res.data?.admissions?.total || 0),
                  placements: Number(res.data?.placements?.successful || 0)
                }))
                .catch(err => {
                  console.error(`Failed to fetch report for branch ${b.name}`, err);
                  return { branch: b.name, leads: 0, admissions: 0, placements: 0 };
                })
            );

            const branchReports = await Promise.all(branchReportsPromises);
            setBranchPerformance(branchReports);
          }
        } catch (error) {
          console.error("Failed to fetch branch performance", error);
          toast({ variant: "destructive", title: "Error", description: `Branch Report Error: ${error instanceof Error ? error.message : String(error)}` });
        }

        // 2. Fetch Trainer Contribution
        try {
          const trainerRes = await reportsApi.getTrainerReport();
          const trainers = trainerRes.data || [];
          const trainerData = trainers.map((t: any) => ({
            name: t.name.split(' ')[0],
            fullName: t.name,
            courses: t.courses,
            incentives: t.totalIncentives
          }));
          setTrainerContribution(trainerData);
        } catch (error) {
          console.error("Failed to fetch trainer report", error);
          toast({ variant: "destructive", title: "Error", description: `Trainer Report Error: ${error instanceof Error ? error.message : String(error)}` });
        }

        // 3. Fetch Course Success (Admissions Report)
        try {
          const admissionsRes = await reportsApi.getAdmissionsReport();
          const courseData = admissionsRes.data?.courseBreakdown || [];
          const courses = courseData.map((c: any) => ({
            course: c.course,
            enrolled: c.count,
            completed: '-',
            revenue: c.totalFees,
            collected: c.collected
          }));
          setCourseSuccess(courses);
        } catch (error) {
          console.error("Failed to fetch admissions report", error);
          toast({ variant: "destructive", title: "Error", description: `Admissions Report Error: ${error instanceof Error ? error.message : String(error)}` });
        }

      } catch (error) {
        console.error("General error in reports fetch", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports" description="Performance reports and analytics" actions={<Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Export</Button>} />

      <Tabs defaultValue="branch">
        <TabsList><TabsTrigger value="branch">Branch Performance</TabsTrigger><TabsTrigger value="trainer">Trainer Contribution</TabsTrigger><TabsTrigger value="course">Course Success</TabsTrigger></TabsList>

        <TabsContent value="branch" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Leads vs Admissions vs Placements</h3>
            <ResponsiveContainer width="100%" height={320}>
              {loading ? <div className="flex h-full items-center justify-center">Loading...</div> : branchPerformance.length === 0 ? <div className="flex h-full items-center justify-center">No branch data available</div> : (
                <BarChart data={branchPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="branch" stroke="hsl(215, 16%, 47%)" />
                  <YAxis stroke="hsl(215, 16%, 47%)" />
                  <Tooltip />
                  <Bar dataKey="leads" name="Leads" fill="hsl(217, 71%, 53%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="admissions" name="Admissions" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="placements" name="Placements" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="trainer" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Trainer Performance (Incentives)</h3>
            <ResponsiveContainer width="100%" height={320}>
              {loading ? <div className="flex h-full items-center justify-center">Loading...</div> : trainerContribution.length === 0 ? <div className="flex h-full items-center justify-center">No trainer data available</div> : (
                <BarChart data={trainerContribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 16%, 47%)" />
                  <YAxis stroke="hsl(215, 16%, 47%)" />
                  <Tooltip content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border rounded shadow-sm text-xs">
                          <p className="font-semibold">{label}</p>
                          <p>Courses: {payload[0].payload.courses}</p>
                          <p>Incentives: {formatCurrency(payload[0].value as number)}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Bar dataKey="incentives" name="Total Incentives" fill="hsl(217, 71%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="course" className="mt-4">
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Course</th><th>Enrolled</th><th>Total Revenue</th><th>Collected</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>}
                {!loading && courseSuccess.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No course data available</td></tr>}
                {!loading && courseSuccess.map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium">{c.course}</td>
                    <td>{c.enrolled}</td>
                    <td>{formatCurrency(c.revenue || 0)}</td>
                    <td className="text-emerald-600 font-medium">{formatCurrency(c.collected || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
