import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { Award, Users, Building2 } from "lucide-react";

const trainerIncentives = [
  { trainer: "Priya Sharma", branch: "Main Branch", students: 45, placements: 18, incentive: "₹54,000", status: "Paid" },
  { trainer: "Rahul Verma", branch: "North Branch", students: 38, placements: 14, incentive: "₹42,000", status: "Pending" },
  { trainer: "Sneha Patel", branch: "Main Branch", students: 32, placements: 12, incentive: "₹36,000", status: "Paid" },
  { trainer: "Vikram Singh", branch: "South Branch", students: 28, placements: 8, incentive: "₹24,000", status: "Pending" },
];

const branchIncentives = [
  { branch: "Main Branch", trainers: 3, totalIncentive: "₹1,14,000", paid: "₹90,000", pending: "₹24,000" },
  { branch: "North Branch", trainers: 2, totalIncentive: "₹72,000", paid: "₹30,000", pending: "₹42,000" },
  { branch: "South Branch", trainers: 1, totalIncentive: "₹24,000", paid: "₹0", pending: "₹24,000" },
];

const Incentives = () => (
  <div className="animate-fade-in">
    <PageHeader title="Incentives" description="Track trainer and branch-wise incentives" />

    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KPICard title="Total Incentives" value="₹2,10,000" icon={Award} accentColor="bg-primary" />
      <KPICard title="Paid Out" value="₹1,20,000" icon={Users} accentColor="bg-success" change="57% disbursed" changeType="positive" />
      <KPICard title="Pending" value="₹90,000" icon={Building2} accentColor="bg-warning" change="43% remaining" changeType="neutral" />
    </div>

    <div className="mb-8">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Trainer-wise Incentives</h3>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Trainer</th><th>Branch</th><th>Students</th><th>Placements</th><th>Incentive</th><th>Status</th></tr></thead>
          <tbody>
            {trainerIncentives.map((t, i) => (
              <tr key={i}>
                <td className="font-medium">{t.trainer}</td><td>{t.branch}</td><td>{t.students}</td><td>{t.placements}</td><td className="font-medium">{t.incentive}</td>
                <td><span className={`status-badge ${t.status === "Paid" ? "status-badge-success" : "status-badge-warning"}`}>{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Branch-wise Overview</h3>
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Branch</th><th>Trainers</th><th>Total Incentive</th><th>Paid</th><th>Pending</th></tr></thead>
          <tbody>
            {branchIncentives.map((b, i) => (
              <tr key={i}><td className="font-medium">{b.branch}</td><td>{b.trainers}</td><td>{b.totalIncentive}</td><td>{b.paid}</td><td>{b.pending}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Incentives;
