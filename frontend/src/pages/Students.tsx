
import { useState, useEffect } from "react";
import { storage, studentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Edit, Trash2, Plus, Search,
  ChevronLeft, ChevronRight, GraduationCap,
  BookOpen, Phone, Mail, MapPin, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/* ─── tiny helper badge ─────────────────────────────────────────────── */
const Badge = ({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}) => {
  const styles: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    neutral: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[variant]}`}
    >
      {label}
    </span>
  );
};

/* ─── helpers ───────────────────────────────────────────────────────── */
const getFeeStatus = (student: any) => {
  const balance = student.admission?.feeBalance || 0;
  return balance > 0 ? "Pending" : "Paid";
};

const getPortfolioStatus = (student: any) => {
  if (student.portfolios?.some((p: any) => p.isVerified)) return "Completed";
  if (student.portfolios?.length > 0) return "In Progress";
  return "Not Started";
};

const getPlacementStatus = (student: any) => {
  if (student.placements?.length > 0) return student.placements[0].status;
  return "Not Eligible";
};

const feeVariant = (s: string) => (s === "Paid" ? "success" : "warning") as any;
const portfolioVariant = (s: string) =>
  (s === "Completed" ? "success" : s === "In Progress" ? "warning" : "neutral") as any;
const placementVariant = (s: string) =>
  (s === "Placed"
    ? "success"
    : s === "Eligible"
      ? "info"
      : s === "Not Eligible"
        ? "neutral"
        : "danger") as any;

/* ─── main component ────────────────────────────────────────────────── */
const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [meta, setMeta] = useState<any>(null);
  const { toast } = useToast();
  const user = storage.getUser();
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "CHANNEL_PARTNER" ||
    user?.role === "CEO";

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsApi.getStudents({ page, search, limit: 10 });
      setStudents(response.data?.students || response.data || []);
      setMeta(response.data?.meta || null);
    } catch (error) {
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
  }, [page, search]);

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

  // Fix: backend returns `meta.total`, not `meta.totalItems`
  const totalItems = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage all student records
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              setSelectedStudent(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        )}
      </div>

      {/* ── Search + count bar ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${totalItems} student${totalItems !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Table Head */}
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[130px]">
                  ID
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                  Student
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[130px]">
                  Contact
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[150px]">
                  Course
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[90px]">
                  Branch
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[70px]">
                  Sem
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[70px]">
                  CGPA
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[90px]">
                  Fees
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[110px]">
                  Portfolio
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[110px]">
                  Placement
                </th>
                {canManage && (
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[90px]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 11 : 10} className="py-16 text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading students…</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 11 : 10} className="py-16 text-center">
                    <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No students found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search ? "Try a different search term" : "Add your first student to get started"}
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const fullName = `${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim();
                  const enrollmentId =
                    student.enrollmentNumber ||
                    student.admission?.admissionNumber ||
                    "—";
                  const phone = student.user?.phone || "—";
                  const email = student.user?.email || "—";
                  const courseName = student.course?.name || "—";
                  const branchName = student.branch?.name || "—";
                  const semester = student.currentSemester ?? "—";
                  const cgpa = student.cgpa ?? "—";

                  const feeStatus = getFeeStatus(student);
                  const portfolioStatus = getPortfolioStatus(student);
                  const placementStatus = getPlacementStatus(student);

                  return (
                    <tr
                      key={student.id}
                      className="group transition-colors hover:bg-muted/30"
                    >
                      {/* ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                          {enrollmentId}
                        </span>
                      </td>

                      {/* Student */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs uppercase">
                            {(fullName[0] || "S")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{fullName || "—"}</p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                              <Mail className="h-2.5 w-2.5 shrink-0" />
                              {email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{phone}</span>
                        </div>
                      </td>

                      {/* Course */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                          <span className="truncate font-medium text-foreground text-xs" title={courseName}>
                            {courseName}
                          </span>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{branchName}</span>
                        </div>
                      </td>

                      {/* Semester */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground mx-auto">
                          {semester}
                        </span>
                      </td>

                      {/* CGPA */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {cgpa !== "—" ? (
                            <>
                              <TrendingUp className="h-3 w-3 text-green-500 shrink-0" />
                              <span className="text-xs font-semibold text-foreground">{cgpa}</span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>

                      {/* Fees */}
                      <td className="px-4 py-3">
                        <Badge label={feeStatus} variant={feeVariant(feeStatus)} />
                      </td>

                      {/* Portfolio */}
                      <td className="px-4 py-3">
                        <Badge label={portfolioStatus} variant={portfolioVariant(portfolioStatus)} />
                      </td>

                      {/* Placement */}
                      <td className="px-4 py-3">
                        <Badge label={placementStatus} variant={placementVariant(placementStatus)} />
                      </td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-60 hover:opacity-100"
                              onClick={() => {
                                setSelectedStudent(student);
                                setIsModalOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive opacity-60 hover:opacity-100 hover:text-destructive"
                              onClick={() => {
                                setStudentToDelete(student.id);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} &nbsp;·&nbsp; {totalItems} total
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {/* Page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum =
                  totalPages <= 5
                    ? i + 1
                    : page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                        ? totalPages - 4 + i
                        : page - 2 + i;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStudents}
        student={selectedStudent}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The student record and associated user
              account will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Students;
