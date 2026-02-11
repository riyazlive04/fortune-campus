import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, BookOpen, Users, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { storage, API_BASE_URL } from "@/lib/api";
import CourseModal from "@/components/CourseModal";

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  duration: number;
  fees: number;
  syllabus?: string;
  prerequisites?: string;
  isActive: boolean;
  branch: { id: string; name: string };
  trainers: any[];
  _count: { students: number; admissions: number };
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { toast } = useToast();
  const user = storage.getUser();
  const canManage = user?.role === 'ADMIN' || user?.role === 'CHANNEL_PARTNER' || user?.role === 'CEO';

  const fetchCourses = async () => {
    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setCourses(result.data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Course deleted",
          description: "Course has been deleted successfully",
        });
        fetchCourses();
      } else {
        toast({
          title: "Delete failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = (id?: string | null, readonly: boolean = false) => {
    setSelectedCourseId(id || null);
    setIsReadOnly(readonly);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCourseId(null);
    setIsReadOnly(false);
  };

  const handleSuccess = () => {
    fetchCourses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Courses & Syllabus"
        description="Manage course catalog and curriculum"
        actions={
          canManage && (
            <Button size="sm" className="gap-2" onClick={() => handleOpenModal(null)}>
              <Plus className="h-4 w-4" /> Add Course
            </Button>
          )
        }
      />

      {courses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {canManage ? "Get started by creating your first course" : "No courses available"}
          </p>
          {canManage && (
            <Button onClick={() => handleOpenModal(null)} className="gap-2">
              <Plus className="h-4 w-4" /> Add First Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md cursor-pointer hover:border-primary/50"
              onClick={() => handleOpenModal(course.id, true)}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{course.name}</h3>
                  <p className="text-xs text-muted-foreground">{course.code}</p>
                </div>
                <StatusBadge
                  status={course.isActive ? "Active" : "Inactive"}
                  variant={course.isActive ? "success" : "neutral"}
                />
              </div>

              {course.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {course.description}
                </p>
              )}

              <div className="space-y-2 text-sm border-t border-border pt-3 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Duration
                  </span>
                  <span className="text-foreground font-medium">{course.duration} Months</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Fees
                  </span>
                  <span className="text-foreground font-medium">₹{parseFloat(course.fees.toString()).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Students
                  </span>
                  <span className="text-foreground font-medium">{course._count.students}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Trainers
                  </span>
                  <span className="text-foreground font-medium">{course.trainers.length}</span>
                </div>
              </div>

              {canManage && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(course.id, false);
                    }}
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={(e) => handleDelete(e, course.id)}
                    disabled={course._count.students > 0}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CourseModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        courseId={selectedCourseId}
        readonly={isReadOnly}
      />
    </div>
  );
};

export default Courses;

