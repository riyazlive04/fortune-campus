import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, BookOpen, Users, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { storage } from "@/lib/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const { toast } = useToast();
  const user = storage.getUser();
  const canManage = user?.role === 'ADMIN' || user?.role === 'BRANCH_HEAD';

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    duration: "",
    fees: "",
    syllabus: "",
    prerequisites: "",
    branchId: "",
    isActive: true,
  });

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

  const fetchBranches = async () => {
    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/branches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setBranches(result.data.branches);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    if (user?.role === 'ADMIN') {
      fetchBranches();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      duration: "",
      fees: "",
      syllabus: "",
      prerequisites: "",
      branchId: "",
      isActive: true,
    });
    setEditingCourse(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.code || !formData.duration || !formData.fees) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const token = storage.getToken();
      const url = editingCourse 
        ? `${API_BASE_URL}/courses/${editingCourse.id}`
        : `${API_BASE_URL}/courses`;
      
      const response = await fetch(url, {
        method: editingCourse ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          duration: parseInt(formData.duration),
          fees: parseFloat(formData.fees),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: editingCourse ? "Course updated" : "Course created",
          description: result.message,
        });
        setDialogOpen(false);
        resetForm();
        fetchCourses();
      } else {
        setError(result.message || "Operation failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save course");
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description || "",
      duration: course.duration.toString(),
      fees: course.fees.toString(),
      syllabus: course.syllabus || "",
      prerequisites: course.prerequisites || "",
      branchId: course.branch.id,
      isActive: course.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
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
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
                  <DialogDescription>
                    {editingCourse ? "Update course information" : "Add a new course to the catalog"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Course Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full Stack Development"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Course Code *</Label>
                      <Input
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="FSD101"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Course overview and objectives"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (Months) *</Label>
                      <Input
                        id="duration"
                        name="duration"
                        type="number"
                        min="1"
                        value={formData.duration}
                        onChange={handleChange}
                        placeholder="6"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fees">Course Fees (₹) *</Label>
                      <Input
                        id="fees"
                        name="fees"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.fees}
                        onChange={handleChange}
                        placeholder="50000"
                        required
                      />
                    </div>
                  </div>

                  {user?.role === 'ADMIN' && branches.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="branchId">Branch</Label>
                      <Select
                        value={formData.branchId}
                        onValueChange={(value) => setFormData({ ...formData, branchId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="prerequisites">Prerequisites</Label>
                    <Textarea
                      id="prerequisites"
                      name="prerequisites"
                      value={formData.prerequisites}
                      onChange={handleChange}
                      placeholder="Basic programming knowledge, HTML/CSS fundamentals"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syllabus">Syllabus</Label>
                    <Textarea
                      id="syllabus"
                      name="syllabus"
                      value={formData.syllabus}
                      onChange={handleChange}
                      placeholder="Module 1: Introduction to Web Development&#10;Module 2: Frontend Technologies&#10;Module 3: Backend Development&#10;..."
                      rows={6}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCourse ? "Update Course" : "Create Course"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add First Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
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
                    onClick={() => handleEdit(course)}
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(course.id)}
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
    </div>
  );
};

export default Courses;
