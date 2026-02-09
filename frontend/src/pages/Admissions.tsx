import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { admissionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AdmissionModal from "@/components/AdmissionModal";

const Admissions = () => {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const data = await admissionsApi.getAdmissions();

      const mappedAdmissions = data.data.admissions.map((a: any) => ({
        id: a.id,
        admissionId: a.admissionNumber,
        student: `${a.firstName} ${a.lastName}`,
        course: a.course?.name || "N/A",
        branch: a.branch?.name || "N/A",
        date: new Date(a.admissionDate).toLocaleDateString(),
        placement: "Yes", // Defaulting as schema doesn't have explicit placement support field yet
        status: a.status,
      }));

      setAdmissions(mappedAdmissions);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch admissions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleOpenModal = (id?: string) => {
    setSelectedAdmissionId(id || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAdmissionId(null);
  };

  const handleSuccess = () => {
    fetchAdmissions();
  };

  const columns = [
    { key: "admissionId", label: "ID" },
    { key: "student", label: "Student", render: (r: any) => <span className="font-medium">{r.student}</span> },
    { key: "course", label: "Course" },
    { key: "branch", label: "Branch" },
    { key: "date", label: "Admission Date" },
    { key: "placement", label: "Placement Support", render: (r: any) => <StatusBadge status={r.placement} variant={r.placement === "Yes" ? "success" : "neutral"} /> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} variant={r.status === "APPROVED" ? "success" : r.status === "PENDING" ? "warning" : "danger"} /> },
    { key: "actions", label: "", render: (r: any) => <Button variant="ghost" size="sm" onClick={() => handleOpenModal(r.id)}>View</Button> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admissions"
        description="Manage student admissions and enrollment"
        actions={
          <Button size="sm" className="gap-2" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" /> New Admission
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={admissions}
        searchPlaceholder="Search admissions..."
      />

      <AdmissionModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        admissionId={selectedAdmissionId}
      />
    </div>
  );
};

export default Admissions;
