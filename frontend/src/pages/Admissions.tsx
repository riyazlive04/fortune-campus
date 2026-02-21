import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [admissionToDelete, setAdmissionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const data = await admissionsApi.getAdmissions();

      // Safely access nested data structure
      const admissionsList = data?.data?.admissions || data?.admissions || [];

      const mappedAdmissions = admissionsList.map((a: any) => ({
        id: a.id,
        admissionId: a.admissionNumber,
        student: `${a.firstName} ${a.lastName}`,
        course: a.course?.name || "N/A",
        branch: a.branch?.name || "N/A",
        date: new Date(a.admissionDate || a.createdAt).toLocaleDateString(), // Fallback for date
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

  const handleDeleteClick = (id: string) => {
    setAdmissionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!admissionToDelete) return;

    try {
      await admissionsApi.deleteAdmission(admissionToDelete);
      toast({
        title: "Success",
        description: "Admission deleted successfully",
      });
      fetchAdmissions();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete admission",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAdmissionToDelete(null);
    }
  };

  const columns = [
    { key: "admissionId", label: "ID" },
    { key: "student", label: "Student", render: (r: any) => <span className="font-medium">{r.student}</span> },
    { key: "course", label: "Course" },
    { key: "branch", label: "Branch" },
    { key: "date", label: "Admission Date" },
    { key: "placement", label: "Placement Support", render: (r: any) => <StatusBadge status={r.placement} variant={r.placement === "Yes" ? "success" : "neutral"} /> },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} variant={r.status === "CONVERTED" || r.status === "ADMITTED" || r.status === "APPROVED" ? "success" : r.status === "NEW" ? "warning" : r.status === "CONTACTED" ? "info" : "danger"} /> },
    {
      key: "actions",
      label: "",
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(r.id)}>View</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(r.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this admission? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admissions;
