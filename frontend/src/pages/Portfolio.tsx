import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

const portfolioData = [
  { student: "Karthik R.", course: "Full Stack Dev", items: [
    { task: "Personal Website", status: "Completed" },
    { task: "E-commerce Project", status: "Completed" },
    { task: "API Integration Project", status: "Completed" },
    { task: "Open Source Contribution", status: "Completed" },
  ]},
  { student: "Neha Gupta", course: "Data Science", items: [
    { task: "EDA Report", status: "Completed" },
    { task: "ML Model Project", status: "In Progress" },
    { task: "Dashboard Visualization", status: "Not Started" },
    { task: "Research Paper Summary", status: "Not Started" },
  ]},
  { student: "Arjun M.", course: "UI/UX Design", items: [
    { task: "Case Study #1", status: "Completed" },
    { task: "Mobile App Design", status: "In Progress" },
    { task: "Design System", status: "In Progress" },
    { task: "Usability Testing Report", status: "Not Started" },
  ]},
];

const statusVariant = (s: string) => s === "Completed" ? "success" : s === "In Progress" ? "warning" : "neutral";

const Portfolio = () => (
  <div className="animate-fade-in">
    <PageHeader title="Portfolio Management" description="Track student portfolio completion across courses" />

    <div className="mb-4 flex gap-3">
      <Select><SelectTrigger className="w-40"><SelectValue placeholder="Course" /></SelectTrigger><SelectContent><SelectItem value="all">All Courses</SelectItem><SelectItem value="fsd">Full Stack Dev</SelectItem><SelectItem value="ds">Data Science</SelectItem></SelectContent></Select>
    </div>

    <div className="grid gap-4">
      {portfolioData.map((p) => {
        const completed = p.items.filter(i => i.status === "Completed").length;
        const progress = Math.round((completed / p.items.length) * 100);
        return (
          <div key={p.student} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{p.student}</h3>
                <p className="text-xs text-muted-foreground">{p.course}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">{progress}%</span>
                <p className="text-xs text-muted-foreground">{completed}/{p.items.length} completed</p>
              </div>
            </div>
            <Progress value={progress} className="mb-4 h-2" />
            <div className="space-y-2">
              {p.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                  <span className="text-sm">{item.task}</span>
                  <StatusBadge status={item.status} variant={statusVariant(item.status)} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default Portfolio;
