import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

const admissions = [
  { id: "A001", student: "Karthik R.", course: "Full Stack Dev", branch: "Main Branch", date: "2026-01-28", placement: "Yes", status: "Active" },
  { id: "A002", student: "Neha Gupta", course: "Data Science", branch: "North Branch", date: "2026-01-20", placement: "Yes", status: "Active" },
  { id: "A003", student: "Arjun M.", course: "UI/UX Design", branch: "Main Branch", date: "2026-01-15", placement: "No", status: "Active" },
  { id: "A004", student: "Divya K.", course: "DevOps", branch: "South Branch", date: "2025-12-10", placement: "Yes", status: "Completed" },
  { id: "A005", student: "Rohit S.", course: "Full Stack Dev", branch: "Main Branch", date: "2025-11-05", placement: "Yes", status: "Dropped" },
];

const columns = [
  { key: "id", label: "ID" },
  { key: "student", label: "Student", render: (r: any) => <span className="font-medium">{r.student}</span> },
  { key: "course", label: "Course" },
  { key: "branch", label: "Branch" },
  { key: "date", label: "Admission Date" },
  { key: "placement", label: "Placement Support", render: (r: any) => <StatusBadge status={r.placement} variant={r.placement === "Yes" ? "success" : "neutral"} /> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} variant={r.status === "Active" ? "success" : r.status === "Dropped" ? "danger" : "info"} /> },
  { key: "actions", label: "", render: () => <Button variant="ghost" size="sm">View</Button> },
];

const Admissions = () => (
  <div className="animate-fade-in">
    <PageHeader title="Admissions" description="Manage student admissions and enrollment" actions={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Admission</Button>} />
    <DataTable columns={columns} data={admissions} searchPlaceholder="Search admissions..." />
  </div>
);

export default Admissions;
