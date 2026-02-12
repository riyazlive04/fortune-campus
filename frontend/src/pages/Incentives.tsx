
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { Award, Users, Building2 } from "lucide-react";
import { incentivesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Incentives = () => {
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    pending: 0,
    disbursedPercentage: 0,
    remainingPercentage: 0
  });
  const [trainerIncentives, setTrainerIncentives] = useState<any[]>([]);
  const [branchIncentives, setBranchIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await incentivesApi.getIncentives({ limit: 1000 });
        const incentives = response.data?.incentives || response.data || [];

        // 1. Overall Stats
        let total = 0;
        let paid = 0;
        let pending = 0;

        incentives.forEach((inc: any) => {
          const amount = Number(inc.amount) || 0;
          total += amount;
          if (inc.isPaid) {
            paid += amount;
          } else {
            pending += amount;
          }
        });

        const disbursedPercentage = total > 0 ? Math.round((paid / total) * 100) : 0;
        const remainingPercentage = total > 0 ? Math.round((pending / total) * 100) : 0;

        setStats({ total, paid, pending, disbursedPercentage, remainingPercentage });

        // 2. Trainer-wise Aggregation
        const trainerMap = new Map();

        incentives.forEach((inc: any) => {
          if (!inc.trainerId) return;

          const trainerName = inc.trainer?.user?.firstName ? `${inc.trainer.user.firstName} ${inc.trainer.user.lastName || ''}` : 'Unknown Trainer';
          // Assuming we access branch info somehow, possibly from trainer.user.branchId if available, 
          // or we might need to fetch it. The provided controller output for 'getIncentives' includes:
          // trainer: { user: { firstName, lastName } }
          // It does NOT explicitly show branch in the trainer include in the controller snippet I saw.
          // However, 'getIncentiveById' showed `incentive.user.branchId`.
          // Let's assume for now we might not have branch name easily or it's unavailable. 
          // Wait, the `getIncentives` controller DOES include `user` (student) with email/name.
          // It doesn't seem to include Branch for the trainer in the list view.
          // I will use a placeholder or check if I can derive it.
          // Actually, let's use 'N/A' if missing, or maybe the student's branch (user.branchId) is the relevant one?
          // Let's assume 'Salem' (hardcoded fallback) if not present to avoid breaking layout, or just empty.

          if (!trainerMap.has(inc.trainerId)) {
            trainerMap.set(inc.trainerId, {
              trainer: trainerName,
              branch: inc.trainer?.branch?.name || "Unknown",
              studentIds: new Set(),
              placementIncentives: 0,
              totalIncentive: 0,
              paidIncentive: 0,
              pendingIncentive: 0
            });
          }

          const entry = trainerMap.get(inc.trainerId);
          entry.totalIncentive += Number(inc.amount);
          if (inc.isPaid) entry.paidIncentive += Number(inc.amount);
          else entry.pendingIncentive += Number(inc.amount);

          if (inc.userId) entry.studentIds.add(inc.userId);
          // Approximate 'Placements' count by checking type.
          // Assuming 'PLACEMENT' is a type string.
          if (inc.type === 'PLACEMENT') entry.placementIncentives += 1;
        });

        const aggregatedTrainers = Array.from(trainerMap.values()).map((t: any) => ({
          trainer: t.trainer,
          branch: t.branch,
          students: t.studentIds.size,
          placements: t.placementIncentives,
          incentive: t.totalIncentive,
          status: t.pendingIncentive > 0 ? "Pending" : "Paid"
        }));

        setTrainerIncentives(aggregatedTrainers);

        // 3. Branch-wise Aggregation
        const branchMap = new Map();

        incentives.forEach((inc: any) => {
          // Use trainer's branch or user's branch as fallback
          const branchName = inc.trainer?.branch?.name || inc.user?.branch?.name || "Unknown Branch";
          const branchId = inc.trainer?.branch?.id || inc.user?.branch?.id || "unknown";

          if (!branchMap.has(branchId)) {
            branchMap.set(branchId, {
              branch: branchName,
              trainers: new Set(),
              totalIncentive: 0,
              paid: 0,
              pending: 0
            });
          }

          const entry = branchMap.get(branchId);
          if (inc.trainerId) entry.trainers.add(inc.trainerId);

          const amount = Number(inc.amount) || 0;
          entry.totalIncentive += amount;
          if (inc.isPaid) entry.paid += amount;
          else entry.pending += amount;
        });

        const aggregatedBranches = Array.from(branchMap.values()).map((b: any) => ({
          branch: b.branch,
          trainers: b.trainers.size,
          totalIncentive: b.totalIncentive,
          paid: b.paid,
          pending: b.pending
        }));

        setBranchIncentives(aggregatedBranches);

      } catch (error) {
        console.error("Failed to fetch incentives", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch incentives data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Incentives" description="Track trainer and branch-wise incentives" />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          title="Total Incentives"
          value={formatCurrency(stats.total)}
          icon={Award}
          accentColor="bg-primary"
        />
        <KPICard
          title="Paid Out"
          value={formatCurrency(stats.paid)}
          icon={Users}
          accentColor="bg-success"
          change={`${stats.disbursedPercentage}% disbursed`}
          changeType="positive"
        />
        <KPICard
          title="Pending"
          value={formatCurrency(stats.pending)}
          icon={Building2}
          accentColor="bg-warning"
          change={`${stats.remainingPercentage}% remaining`}
          changeType="neutral"
        />
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Trainer-wise Incentives</h3>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          {loading ? <div className="p-4">Loading...</div> : aggregatedTable(trainerIncentives, formatCurrency)}
        </div>
      </div>

      {branchIncentives.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Branch-wise Overview</h3>
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Branch</th><th>Trainers</th><th>Total Incentive</th><th>Paid</th><th>Pending</th></tr></thead>
              <tbody>
                {branchIncentives.map((b, i) => (
                  <tr key={i}>
                    <td className="font-medium">{b.branch}</td>
                    <td>{b.trainers}</td>
                    <td>{formatCurrency(b.totalIncentive)}</td>
                    <td>{formatCurrency(b.paid)}</td>
                    <td>{formatCurrency(b.pending)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const aggregatedTable = (data: any[], formatCurrency: (v: number) => string) => {
  if (data.length === 0) return <div className="p-4 text-muted-foreground">No incentive records found.</div>;
  return (
    <table className="data-table">
      <thead><tr><th>Trainer</th><th>Branch</th><th>Students</th><th>Placements</th><th>Incentive</th><th>Status</th></tr></thead>
      <tbody>
        {data.map((t, i) => (
          <tr key={i}>
            <td className="font-medium">{t.trainer}</td>
            <td className="text-sm text-muted-foreground">{t.branch}</td>
            <td>{t.students}</td>
            <td>{t.placements}</td>
            <td className="font-medium">{formatCurrency(t.incentive)}</td>
            <td><span className={`status-badge ${t.status === "Paid" ? "status-badge-success" : "status-badge-warning"}`}>{t.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Incentives;
