import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const placements = [
  { id: "P001", student: "Karthik R.", course: "Full Stack Dev", company: "TechCorp", role: "Frontend Dev", package: "₹6.5 LPA", status: "Placed" },
  { id: "P002", student: "Simran P.", course: "Data Science", company: "DataMin", role: "Data Analyst", package: "₹5.8 LPA", status: "Placed" },
  { id: "P003", student: "Neha Gupta", course: "Data Science", company: "-", role: "-", package: "-", status: "Eligible" },
  { id: "P004", student: "Arjun M.", course: "UI/UX Design", company: "-", role: "-", package: "-", status: "Not Eligible" },
];

const companies = [
  { name: "TechCorp", industry: "IT Services", openings: 5, placed: 3 },
  { name: "DataMin", industry: "Analytics", openings: 3, placed: 2 },
  { name: "DesignHub", industry: "Design Agency", openings: 2, placed: 0 },
  { name: "CloudNet", industry: "Cloud Infra", openings: 4, placed: 1 },
];

const alumni = [
  { name: "Ravi Shankar", course: "Full Stack Dev", batch: "2025-H1", company: "Infosys", role: "Software Engineer" },
  { name: "Priyanka D.", course: "Data Science", batch: "2025-H1", company: "Wipro", role: "Data Analyst" },
  { name: "Amit Tiwari", course: "DevOps", batch: "2024-H2", company: "TCS", role: "DevOps Engineer" },
];

const pCols = [
  { key: "student", label: "Student", render: (r: any) => <span className="font-medium">{r.student}</span> },
  { key: "course", label: "Course" },
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "package", label: "Package" },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} variant={r.status === "Placed" ? "success" : r.status === "Eligible" ? "info" : "neutral"} /> },
];

const Placements = () => (
  <div className="animate-fade-in">
    <PageHeader title="Placements & Alumni" description="Track placement progress and alumni network" />
    <Tabs defaultValue="placements">
      <TabsList><TabsTrigger value="placements">Placements</TabsTrigger><TabsTrigger value="companies">Companies</TabsTrigger><TabsTrigger value="alumni">Alumni</TabsTrigger></TabsList>

      <TabsContent value="placements" className="mt-4">
        <DataTable columns={pCols} data={placements} searchPlaceholder="Search placements..." />
      </TabsContent>

      <TabsContent value="companies" className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {companies.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
              <p className="text-xs text-muted-foreground">{c.industry}</p>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Openings: {c.openings}</span>
                <span className="text-foreground font-medium">Placed: {c.placed}</span>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="alumni" className="mt-4">
        <div className="rounded-xl border border-border bg-card">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Course</th><th>Batch</th><th>Company</th><th>Role</th></tr></thead>
            <tbody>
              {alumni.map((a, i) => (
                <tr key={i}><td className="font-medium">{a.name}</td><td>{a.course}</td><td>{a.batch}</td><td>{a.company}</td><td>{a.role}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export default Placements;
