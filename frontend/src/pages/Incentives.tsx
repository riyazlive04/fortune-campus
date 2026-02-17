
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { Award, Users, Building2, Plus } from "lucide-react";
import { incentivesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import AllocateIncentiveModal from "@/components/incentives/AllocateIncentiveModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { toast } = useToast();

  const handleViewDetails = (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    setShowDetailsModal(true);
  };

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

        if (!trainerMap.has(inc.trainerId)) {
          trainerMap.set(inc.trainerId, {
            trainerId: inc.trainerId,
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
        if (inc.type === 'PLACEMENT') entry.placementIncentives += 1;
      });

      const aggregatedTrainers = Array.from(trainerMap.values()).map((t: any) => ({
        trainerId: t.trainerId,
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

  useEffect(() => {
    fetchData();
  }, [toast]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Incentives" description="Track trainer and branch-wise incentives" />
        <Button onClick={() => setShowAllocateModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Allocate Incentive
        </Button>
      </div>

      <AllocateIncentiveModal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        onSuccess={fetchData}
      />

      <TrainerIncentiveDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        trainerId={selectedTrainerId}
        onSuccess={fetchData}
      />

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
          {loading ? <div className="p-4">Loading...</div> : aggregatedTable(trainerIncentives, formatCurrency, handleViewDetails)}
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

const aggregatedTable = (data: any[], formatCurrency: (v: number) => string, onView: (id: string) => void) => {
  if (data.length === 0) return <div className="p-4 text-muted-foreground">No incentive records found.</div>;
  return (
    <table className="data-table">
      <thead><tr><th>Trainer</th><th>Branch</th><th>Students</th><th>Placements</th><th>Incentive</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        {data.map((t, i) => (
          <tr key={i}>
            <td className="font-medium">{t.trainer}</td>
            <td className="text-sm text-muted-foreground">{t.branch}</td>
            <td>{t.students}</td>
            <td>{t.placements}</td>
            <td className="font-medium">{formatCurrency(t.incentive)}</td>
            <td><span className={`status-badge ${t.status === "Paid" ? "status-badge-success" : "status-badge-warning"}`}>{t.status}</span></td>
            <td>
              <Button variant="ghost" size="sm" onClick={() => onView(t.trainerId)}>View</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const TrainerIncentiveDetailsModal = ({ isOpen, onClose, trainerId, onSuccess }: { isOpen: boolean, onClose: () => void, trainerId: string | null, onSuccess: () => void }) => {
  const [incentives, setIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && trainerId) {
      fetchTrainerIncentives();
    }
  }, [isOpen, trainerId]);

  const fetchTrainerIncentives = async () => {
    try {
      setLoading(true);
      const res = await incentivesApi.getIncentives({ trainerId, limit: 100 });
      setIncentives(res.data?.incentives || res.data || []);
    } catch (error) {
      console.error("Failed to fetch trainer incentives", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await incentivesApi.markAsPaid(id, true);
      toast({ title: "Success", description: "Incentive marked as paid" });
      fetchTrainerIncentives();
      onSuccess(); // Refresh parent stats
    } catch (error) {
      console.error("Failed to mark as paid", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Trainer Incentive Details</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? <div>Loading...</div> : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground font-medium sticky top-0">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incentives.map((inc) => (
                  <tr key={inc.id}>
                    <td className="p-3">{inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3">{inc.type || '-'}</td>
                    <td className="p-3 font-bold">{`₹${inc.amount || 0}`}</td>
                    <td className="p-3 max-w-[150px] truncate" title={inc.description}>{inc.description || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${inc.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {inc.isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td className="p-3">
                      {!inc.isPaid && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarkAsPaid(inc.id)}>
                          Mark Paid
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {incentives.length === 0 && <tr><td colSpan={6} className="p-4 text-center">No records found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Incentives;
