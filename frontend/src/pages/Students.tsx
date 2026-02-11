
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { studentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";
import StudentModal from "@/components/StudentModal";
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

const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsApi.getStudents();
      setStudents(response.data?.students || response.data || []);
    } catch (error) {
      console.error("Failed to fetch students", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch students. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleEdit = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setStudentToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await studentsApi.deleteStudent(studentToDelete);
      toast({ title: "Success", description: "Student deleted successfully" });
      fetchStudents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete student",
      });
    } finally {
      setIsDeleteOpen(false);
      setStudentToDelete(null);
    }
  };

  const getFeeStatus = (student: any) => {
    const balance = student.admission?.feeBalance || 0;
    return balance > 0 ? "Pending" : "Paid";
  };

  const getPlacementStatus = (student: any) => {
    if (student.placements && student.placements.length > 0) {
      return student.placements[0].status; // Assuming most recent/relevant status
    }
    return "Not Eligible"; // Default or logic based on semester/criteria
  };

  const getPortfolioStatus = (student: any) => {
    if (student.portfolios && student.portfolios.some((p: any) => p.isVerified)) {
      return "Completed";
    }
    if (student.portfolios && student.portfolios.length > 0) {
      return "In Progress";
    }
    return "Not Started";
  };

  const feeVariant = (s: string) => s === "Paid" ? "success" : "warning";
  const portfolioVariant = (s: string) => s === "Completed" ? "success" : s === "In Progress" ? "warning" : "neutral";
  const placementVariant = (s: string) => s === "Placed" ? "success" : s === "Eligible" ? "info" : s === "Dropped" ? "danger" : "neutral";

  const columns = [
    { key: "enrollmentNumber", label: "ID", render: (r: any) => r.enrollmentNumber || r.admission?.admissionNumber || "N/A" },
    {
      key: "name",
      label: "Student",
      render: (r: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.user?.firstName} {r.user?.lastName}</span>
          <span className="text-xs text-muted-foreground">{r.user?.email}</span>
        </div>
      )
    },
    { key: "phone", label: "Phone", render: (r: any) => r.user?.phone || "N/A" },
    { key: "course", label: "Course", render: (r: any) => r.course?.name || "N/A" },
    { key: "branch", label: "Branch", render: (r: any) => r.branch?.name || "N/A" },
    { key: "semester", label: "Sem", render: (r: any) => r.currentSemester || "N/A" },
    { key: "cgpa", label: "CGPA", render: (r: any) => r.cgpa || "N/A" },
    {
      key: "attendance",
      label: "Attendance",
      render: (r: any) => "N/A" // Placeholder until attendance is implemented/calculated
    },
    {
      key: "fees",
      label: "Fees",
      render: (r: any) => {
        const status = getFeeStatus(r);
        return <StatusBadge status={status} variant={feeVariant(status)} />;
      }
    },
    {
      key: "portfolio",
      label: "Portfolio",
      render: (r: any) => {
        const status = getPortfolioStatus(r);
        return <StatusBadge status={status} variant={portfolioVariant(status)} />;
      }
    },
    {
      key: "placement",
      label: "Placement",
      render: (r: any) => {
        const status = getPlacementStatus(r);
        return <StatusBadge status={status} variant={placementVariant(status)} />;
      }
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(r.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Students"
        description="View and manage all student records"
        actions={
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New Student
          </Button>
        }
      />
      <DataTable columns={columns} data={students} searchPlaceholder="Search students..." />

      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStudents}
        student={selectedStudent}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record and associated user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Students;
