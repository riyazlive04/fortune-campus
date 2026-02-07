import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

const students = [
  { id: "S001", name: "Karthik R.", course: "Full Stack Dev", branch: "Main", attendance: "92%", fees: "Paid", portfolio: "Completed", placement: "Placed" },
  { id: "S002", name: "Neha Gupta", course: "Data Science", branch: "North", attendance: "88%", fees: "Paid", portfolio: "In Progress", placement: "Eligible" },
  { id: "S003", name: "Arjun M.", course: "UI/UX Design", branch: "Main", attendance: "95%", fees: "Pending", portfolio: "In Progress", placement: "Not Eligible" },
  { id: "S004", name: "Divya K.", course: "DevOps", branch: "South", attendance: "78%", fees: "Paid", portfolio: "Not Started", placement: "Not Eligible" },
  { id: "S005", name: "Rohit S.", course: "Full Stack Dev", branch: "Main", attendance: "65%", fees: "Overdue", portfolio: "Not Started", placement: "Dropped" },
  { id: "S006", name: "Simran P.", course: "Data Science", branch: "North", attendance: "91%", fees: "Paid", portfolio: "Completed", placement: "Placed" },
];

const feeVariant = (s: string) => s === "Paid" ? "success" : s === "Pending" ? "warning" : "danger";
const portfolioVariant = (s: string) => s === "Completed" ? "success" : s === "In Progress" ? "warning" : "neutral";
const placementVariant = (s: string) => s === "Placed" ? "success" : s === "Eligible" ? "info" : s === "Dropped" ? "danger" : "neutral";

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Student", render: (r: any) => <span className="font-medium">{r.name}</span> },
  { key: "course", label: "Course" },
  { key: "branch", label: "Branch" },
  { key: "attendance", label: "Attendance" },
  { key: "fees", label: "Fees", render: (r: any) => <StatusBadge status={r.fees} variant={feeVariant(r.fees)} /> },
  { key: "portfolio", label: "Portfolio", render: (r: any) => <StatusBadge status={r.portfolio} variant={portfolioVariant(r.portfolio)} /> },
  { key: "placement", label: "Placement", render: (r: any) => <StatusBadge status={r.placement} variant={placementVariant(r.placement)} /> },
  { key: "actions", label: "", render: () => <Button variant="ghost" size="sm">Profile</Button> },
];

const Students = () => (
  <div className="animate-fade-in">
    <PageHeader title="Students" description="View and manage all student records" />
    <DataTable columns={columns} data={students} searchPlaceholder="Search students..." />
  </div>
);

export default Students;
