import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { trainersApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TrainerModal from "@/components/TrainerModal";

const Trainers = () => {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { toast } = useToast();
  const user = storage.getUser();
  const canManage = user?.role === 'ADMIN' || user?.role === 'BRANCH_HEAD' || user?.role === 'CEO';

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const res = await trainersApi.getTrainers();
      const data = res.data?.trainers || res.data || [];
      if (Array.isArray(data)) {
        setTrainers(data);
      } else {
        setTrainers([]);
      }
    } catch (error) {
      console.error("Failed to fetch trainers", error);
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleOpenModal = (id?: string | null, readonly: boolean = false) => {
    setSelectedTrainerId(id || null);
    setIsReadOnly(readonly);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTrainerId(null);
    setIsReadOnly(false);
  };

  const handleSuccess = () => {
    fetchTrainers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete trainer ${name}?`)) return;

    try {
      await trainersApi.deleteTrainer(id);
      toast({ title: "Success", description: "Trainer deleted successfully" });
      fetchTrainers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete trainer",
      });
    }
  };

  const columns = [
    {
      key: "name",
      label: "Trainer",
      render: (r: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.user?.firstName} {r.user?.lastName}</span>
          <span className="text-xs text-muted-foreground">{r.employeeId}</span>
        </div>
      )
    },
    {
      key: "email",
      label: "Contact",
      render: (r: any) => (
        <div className="flex flex-col">
          <span>{r.user?.email}</span>
          <span className="text-xs text-muted-foreground">{r.user?.phone}</span>
        </div>
      )
    },
    {
      key: "specialization",
      label: "Specialization",
      render: (r: any) => (
        <div className="flex flex-col">
          <span>{r.specialization}</span>
          <span className="text-xs text-muted-foreground">{r.courses?.length || 0} courses</span>
        </div>
      )
    },
    {
      key: "branch",
      label: "Branch",
      render: (r: any) => <span>{r.branch?.name}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (r: any) => <StatusBadge status={r.isActive ? "Active" : "Inactive"} variant={r.isActive ? "success" : "neutral"} />
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(r.id, true)} title="View Details">
            <Eye className="h-4 w-4" />
          </Button>
          {canManage && (
            <>
              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(r.id, false)} title="Edit">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(r.id, r.user?.firstName)} title="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Trainers"
        description="View and manage trainer profiles"
        actions={
          canManage && (
            <Button onClick={() => handleOpenModal(null)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Trainer
            </Button>
          )
        }
      />
      <DataTable
        columns={columns}
        data={trainers}
        searchPlaceholder="Search trainers..."
        isLoading={loading}
      />

      <TrainerModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        trainerId={selectedTrainerId}
        readonly={isReadOnly}
      />
    </div>
  );
};

export default Trainers;
