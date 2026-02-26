
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { coursesApi, branchesApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, Upload } from "lucide-react";
import { downloadSyllabusReport } from "@/lib/reportUtils";
import { extractTextFromPDF } from "@/lib/pdfUtils";
interface CourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    courseId?: string | null;
    readonly?: boolean;
}

const CourseModal = ({ isOpen, onClose, onSuccess, courseId, readonly = false }: CourseModalProps) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [parsingPdf, setParsingPdf] = useState(false);
    const { toast } = useToast();
    const user = storage.getUser();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'CEO';

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

    const isEditMode = !!courseId;

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await branchesApi.getBranches();
                const fetchedBranches = response.data?.branches || response.data || [];
                setBranches(Array.isArray(fetchedBranches) ? fetchedBranches : []);
            } catch (error) {
                console.error("Failed to fetch branches", error);
            }
        };

        if (isOpen && isAdmin) {
            fetchBranches();
        }
    }, [isOpen, isAdmin]);

    useEffect(() => {
        const fetchCourseDetails = async (id: string) => {
            try {
                setFetching(true);
                const res = await coursesApi.getCourseById(id);
                const course = res.data || res;

                if (course) {
                    setFormData({
                        name: course.name,
                        code: course.code,
                        description: course.description || "",
                        duration: course.duration.toString(),
                        fees: course.fees.toString(),
                        syllabus: course.syllabus || "",
                        prerequisites: course.prerequisites || "",
                        branchId: course.branchId,
                        isActive: course.isActive,
                    });
                }
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch course details",
                });
                onClose();
            } finally {
                setFetching(false);
            }
        };

        if (isOpen) {
            if (courseId) {
                fetchCourseDetails(courseId);
            } else {
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
            }
        }
    }, [isOpen, courseId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...formData,
                duration: Number(formData.duration),
                fees: Number(formData.fees),
            };

            if (isEditMode && courseId) {
                await coursesApi.updateCourse(courseId, payload);
                toast({ title: "Success", description: "Course updated successfully" });
            } else {
                await coursesApi.createCourse(payload);
                toast({ title: "Success", description: "Course created successfully" });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save course",
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast({
                variant: "destructive",
                title: "Invalid File",
                description: "Please upload a PDF file.",
            });
            return;
        }

        try {
            setParsingPdf(true);
            const extractedText = await extractTextFromPDF(file);
            setFormData(prev => ({ ...prev, syllabus: extractedText }));
            toast({
                title: "Text Extracted",
                description: "Syllabus has been populated from the PDF.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Extraction Failed",
                description: error.message || "Could not extract text from PDF.",
            });
        } finally {
            setParsingPdf(false);
            // Reset input
            e.target.value = "";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? (readonly ? "Course Details" : "Edit Course") : "New Course"}</DialogTitle>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Course Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    disabled={readonly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Course Code</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    disabled={readonly}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                disabled={readonly}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (Months)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    required
                                    disabled={readonly}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fees">Course Fees (₹)</Label>
                                <Input
                                    id="fees"
                                    type="number"
                                    value={formData.fees}
                                    onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                                    required
                                    disabled={readonly}
                                />
                            </div>
                        </div>

                        {isAdmin && branches.length > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="branch">Branch</Label>
                                <Select
                                    value={formData.branchId}
                                    onValueChange={(v) => setFormData({ ...formData, branchId: v })}
                                    disabled={readonly}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="prerequisites">Prerequisites</Label>
                            <Textarea
                                id="prerequisites"
                                value={formData.prerequisites}
                                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                                rows={2}
                                disabled={readonly}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="syllabus" className="flex items-center justify-between">
                                Syllabus
                                <div className="flex items-center gap-2">
                                    {!readonly && (
                                        <>
                                            <input
                                                type="file"
                                                id="pdf-upload"
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={handlePdfUpload}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[10px] gap-1 px-2 border-primary/20 text-primary hover:bg-primary/5"
                                                onClick={() => document.getElementById('pdf-upload')?.click()}
                                                disabled={parsingPdf}
                                            >
                                                {parsingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                                Upload PDF
                                            </Button>
                                        </>
                                    )}
                                    {readonly && formData.syllabus && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5"
                                            onClick={() => downloadSyllabusReport(formData.name, formData.code, formData.syllabus)}
                                        >
                                            <Download className="h-3 w-3" />
                                            Download Report
                                        </Button>
                                    )}
                                </div>
                            </Label>
                            {readonly ? (
                                <div className="min-h-[150px] w-full rounded-md border border-input bg-muted/20 px-4 py-3 text-sm shadow-sm overflow-y-auto max-h-[400px]">
                                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                                        {formData.syllabus || "No syllabus content added yet."}
                                    </div>
                                </div>
                            ) : (
                                <Textarea
                                    id="syllabus"
                                    value={formData.syllabus}
                                    onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                                    rows={8}
                                    disabled={readonly}
                                    placeholder="Enter detailed syllabus contents here..."
                                    className="resize-none"
                                />
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                {readonly ? "Close" : "Cancel"}
                            </Button>
                            {!readonly && (
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? "Update Course" : "Create Course"}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CourseModal;
