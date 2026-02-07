import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

const trainers = [
  { id: "T001", name: "Priya Sharma", email: "priya@fortune.in", course: "Full Stack Dev", students: 45, rating: 4.8, status: "Active" },
  { id: "T002", name: "Rahul Verma", email: "rahul@fortune.in", course: "Data Science", students: 38, rating: 4.6, status: "Active" },
  { id: "T003", name: "Sneha Patel", email: "sneha@fortune.in", course: "UI/UX Design", students: 32, rating: 4.9, status: "Active" },
  { id: "T004", name: "Vikram Singh", email: "vikram@fortune.in", course: "DevOps", students: 28, rating: 4.5, status: "On Leave" },
  { id: "T005", name: "Anjali Rao", email: "anjali@fortune.in", course: "Full Stack Dev", students: 40, rating: 4.7, status: "Active" },
];

const columns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Trainer", render: (r: any) => <span className="font-medium">{r.name}</span> },
  { key: "email", label: "Email" },
  { key: "course", label: "Course" },
  { key: "students", label: "Students" },
  { key: "rating", label: "Rating", render: (r: any) => <span>⭐ {r.rating}</span> },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} variant={r.status === "Active" ? "success" : "warning"} /> },
  { key: "actions", label: "", render: () => <Button variant="ghost" size="sm">Profile</Button> },
];

const Trainers = () => (
  <div className="animate-fade-in">
    <PageHeader title="Trainers" description="View and manage trainer profiles" />
    <DataTable columns={columns} data={trainers} searchPlaceholder="Search trainers..." />
  </div>
);

export default Trainers;
