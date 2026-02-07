import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const classes = [
  { time: "09:00 AM", course: "Full Stack Dev", trainer: "Priya Sharma", batch: "Batch A", topic: "React Hooks", status: "Completed" },
  { time: "10:30 AM", course: "Data Science", trainer: "Rahul Verma", batch: "Batch B", topic: "Linear Regression", status: "Completed" },
  { time: "12:00 PM", course: "UI/UX Design", trainer: "Sneha Patel", batch: "Batch A", topic: "Figma Prototyping", status: "In Progress" },
  { time: "02:00 PM", course: "DevOps", trainer: "Vikram Singh", batch: "Batch A", topic: "Docker Compose", status: "Upcoming" },
  { time: "03:30 PM", course: "Full Stack Dev", trainer: "Anjali Rao", batch: "Batch B", topic: "Node.js APIs", status: "Upcoming" },
];

const attendance = [
  { student: "Karthik R.", course: "Full Stack Dev", present: 44, absent: 4, percentage: "92%" },
  { student: "Neha Gupta", course: "Data Science", present: 42, absent: 6, percentage: "88%" },
  { student: "Arjun M.", course: "UI/UX Design", present: 38, absent: 2, percentage: "95%" },
  { student: "Divya K.", course: "DevOps", present: 35, absent: 10, percentage: "78%" },
];

const statusVariant = (s: string) => s === "Completed" ? "success" : s === "In Progress" ? "warning" : "neutral";

const Attendance = () => (
  <div className="animate-fade-in">
    <PageHeader title="Attendance & Classes" description="Track daily attendance and class schedule" />

    <div className="mb-4 flex gap-3">
      <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Date" /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="yesterday">Yesterday</SelectItem></SelectContent></Select>
      <Select><SelectTrigger className="w-40"><SelectValue placeholder="Branch" /></SelectTrigger><SelectContent><SelectItem value="all">All Branches</SelectItem><SelectItem value="main">Main Branch</SelectItem></SelectContent></Select>
    </div>

    <div className="mb-8">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Today's Schedule</h3>
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Time</th><th>Course</th><th>Trainer</th><th>Batch</th><th>Topic</th><th>Status</th></tr></thead>
            <tbody>
              {classes.map((c, i) => (
                <tr key={i}><td>{c.time}</td><td>{c.course}</td><td>{c.trainer}</td><td>{c.batch}</td><td>{c.topic}</td><td><StatusBadge status={c.status} variant={statusVariant(c.status)} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Attendance Summary</h3>
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Course</th><th>Present</th><th>Absent</th><th>Percentage</th></tr></thead>
            <tbody>
              {attendance.map((a, i) => (
                <tr key={i}>
                  <td className="font-medium">{a.student}</td><td>{a.course}</td><td>{a.present}</td><td>{a.absent}</td>
                  <td><StatusBadge status={a.percentage} variant={parseInt(a.percentage) >= 85 ? "success" : parseInt(a.percentage) >= 75 ? "warning" : "danger"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

export default Attendance;
