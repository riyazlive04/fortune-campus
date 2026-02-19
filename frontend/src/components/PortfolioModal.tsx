
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { portfolioApi, studentsApi, storage } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface PortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // If passed, we are in Edit mode
}

const PortfolioModal = ({ isOpen, onClose, onSuccess, initialData }: PortfolioModalProps) => {
    const { toast } = useToast();
    const user = storage.getUser();
    const isEditMode = !!initialData;

    // Form State
    const [formData, setFormData] = useState({
        studentId: "",
        title: "",
        description: "",
        projectUrl: "",
        githubUrl: "",
        technologies: "",
        completedAt: new Date().toISOString().split('T')[0]
    });

    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);

    // Reset or Populate Form
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    studentId: initialData.studentId || "",
                    title: initialData.title || "",
                    description: initialData.description || "",
                    projectUrl: initialData.projectUrl || "",
                    githubUrl: initialData.githubUrl || "",
                    technologies: initialData.technologies || "",
                    completedAt: initialData.completedAt ? new Date(initialData.completedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                });
            } else {
                setFormData({
                    studentId: "",
                    title: "",
                    description: "",
                    projectUrl: "",
                    githubUrl: "",
                    technologies: "",
                    completedAt: new Date().toISOString().split('T')[0]
                });
            }
            fetchStudents();
        }
    }, [isOpen, initialData]);

    const fetchStudents = async () => {
        // Only fetch if we need to select a student (Admin/CEO/Branch Head)
        // If it's a student login, we might auto-set (but current scope implies management view)
        try {
            setFetchingStudents(true);
            const res = await studentsApi.getStudents({ limit: 100 }); // Fetch active students
            setStudents(res.data?.students || []);
        } catch (error) {
            console.error("Failed to fetch students");
        } finally {
            setFetchingStudents(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.studentId || !formData.title) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Student and Project Title are required."
            });
            return;
        }

        try {
            setLoading(true);
            if (isEditMode) {
                await portfolioApi.updatePortfolio(initialData.id, formData);
                toast({ title: "Success", description: "Project updated successfully" });
            } else {
                await portfolioApi.createPortfolio(formData);
                toast({ title: "Success", description: "Project added successfully" });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save project"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Project" : "Add New Project"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Student Selection */}
                    {!isEditMode && (
                        <div className="space-y-2">
                            <Label htmlFor="studentId">Student <span className="text-red-500">*</span></Label>
                            <Select
                                value={formData.studentId}
                                onValueChange={(val) => handleSelectChange("studentId", val)}
                                disabled={isEditMode}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={fetchingStudents ? "Loading students..." : "Select Student"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((student: any) => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.user?.firstName} {student.user?.lastName} ({student.enrollmentNumber})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Project Title <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. E-Commerce Dashboard"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief description of the project..."
                            rows={3}
                        />
                    </div>

                    {/* Technologies */}
                    <div className="space-y-2">
                        <Label htmlFor="technologies">Technologies Used</Label>
                        <Input
                            id="technologies"
                            name="technologies"
                            value={formData.technologies}
                            onChange={handleChange}
                            placeholder="e.g. React, Node.js, Tailwind (Comma separated)"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Project URL */}
                        <div className="space-y-2">
                            <Label htmlFor="projectUrl">Live Project URL</Label>
                            <Input
                                id="projectUrl"
                                name="projectUrl"
                                value={formData.projectUrl}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </div>

                        {/* GitHub URL */}
                        <div className="space-y-2">
                            <Label htmlFor="githubUrl">GitHub / Source Code</Label>
                            <Input
                                id="githubUrl"
                                name="githubUrl"
                                value={formData.githubUrl}
                                onChange={handleChange}
                                placeholder="https://github.com/..."
                            />
                        </div>
                    </div>

                    {/* Completion Date */}
                    <div className="space-y-2">
                        <Label htmlFor="completedAt">Completion Date</Label>
                        <Input
                            type="date"
                            id="completedAt"
                            name="completedAt"
                            value={formData.completedAt}
                            onChange={handleChange}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? "Update Project" : "Add Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default PortfolioModal;
