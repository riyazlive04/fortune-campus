
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { portfolioApi, coursesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link, Plus, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import PortfolioModal from "@/components/PortfolioModal";
import { storage } from "@/lib/api";
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

const statusVariant = (s: string) => s === "Verified" ? "success" : s === "Submitted" ? "warning" : "neutral";

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  // Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null); // For Edit
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null); // For Delete Confirmation

  const { toast } = useToast();
  const user = storage.getUser();
  const canManage = ['ADMIN', 'CEO', 'BRANCH_HEAD'].includes(user?.role);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesApi.getCourses();
        setCourses(response.data?.courses || response.data || []);
      } catch (error) {
        console.error("Failed to fetch courses");
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setLoading(true);
        const response = await portfolioApi.getPortfolios({ limit: 100 }); // Fetch enough to group
        const rawPortfolios = response.data?.portfolios || response.data || [];
        setPortfolios(rawPortfolios);
      } catch (error) {
        console.error("Failed to fetch portfolios", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch portfolio data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
    fetchPortfolios();
  }, [toast, refreshKey]);

  // Actions
  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await portfolioApi.deletePortfolio(deleteId);
      toast({ title: "Success", description: "Project deleted successfully" });
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete project" });
    } finally {
      setDeleteId(null);
    }
  };

  const handleVerify = async (id: string, status: boolean) => {
    try {
      await portfolioApi.verifyPortfolio(id, status);
      toast({ title: "Success", description: `Project ${status ? 'verified' : 'unverified'} successfully` });
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Group portfolios by student
  const groupedPortfolios = portfolios.reduce((acc: any, curr: any) => {
    const studentId = curr.studentId;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: `${curr.student?.user?.firstName} ${curr.student?.user?.lastName}`,
        course: curr.student?.course?.name,
        courseId: curr.student?.courseId,
        items: []
      };
    }

    // Determine status
    let status = "In Progress";
    if (curr.isVerified) status = "Verified";
    else if (curr.completedAt) status = "Submitted";

    acc[studentId].items.push({
      ...curr,
      status
    });
    return acc;
  }, {});

  const displayedPortfolios = Object.values(groupedPortfolios).filter((p: any) => {
    if (selectedCourse === "all") return true;
    return p.courseId === selectedCourse; // This assumes courseId is available in student data
    // If courseId is not direct, we might need to filter by course name or similar
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Portfolio Management" description="Track student portfolio completion across courses" />

      <div className="mb-4 flex gap-3 justify-between items-center">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Course" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canManage && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Project
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading portfolios...</div>
        ) : displayedPortfolios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No portfolio entries found</div>
        ) : (
          displayedPortfolios.map((p: any) => {
            const completed = p.items.filter((i: any) => i.status === "Verified" || i.status === "Submitted").length;
            // Calculate progress based on items present (since we don't have a fixed 'required' count per course yet)
            // Just for visual checking, let's say 100% if they have items and they are done. 
            // Better yet, just show what they have.
            const totalItems = p.items.length;
            const progress = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;

            return (
              <div key={p.student} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{p.student}</h3>
                    <p className="text-xs text-muted-foreground">{p.course}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-foreground">{progress}%</span>
                    <p className="text-xs text-muted-foreground">{completed}/{totalItems} items</p>
                  </div>
                </div>
                <Progress value={progress} className="mb-4 h-2" />
                <div className="space-y-2">
                  {p.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 group">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.title}</span>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {item.projectUrl && (
                            <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                              Live Demo <Link className="h-3 w-3" />
                            </a>
                          )}
                          {item.githubUrl && (
                            <a href={item.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                              GitHub <Link className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} variant={statusVariant(item.status)} />

                        {canManage && (
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {!item.isVerified && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={() => handleVerify(item.id, true)} title="Verify">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-100" onClick={() => handleEdit(item)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-100" onClick={() => setDeleteId(item.id)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>


      <PortfolioModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        initialData={selectedProject}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
};

export default Portfolio;
