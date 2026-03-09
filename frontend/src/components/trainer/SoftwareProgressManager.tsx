
import { useState, useEffect } from "react";
import { softwareProgressApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronRight, ChevronDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SoftwareProgressManagerProps {
    batches: any[];
}

const SoftwareProgressManager = ({ batches }: SoftwareProgressManagerProps) => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    // Edit state
    const [currentTopic, setCurrentTopic] = useState("");
    const [progress, setProgress] = useState(0);
    const [newTopic, setNewTopic] = useState("");
    const [completedTopics, setCompletedTopics] = useState<string[]>([]);

    const { toast } = useToast();

    const fetchBranchProgress = async () => {
        try {
            setLoading(true);
            const res = await softwareProgressApi.getBranchProgress();
            if (res.success) {
                setStudents(res.data);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranchProgress();
        setExpandedStudent(null);
    }, []);

    const handleExpand = (student: any) => {
        if (expandedStudent === student.studentId) {
            setExpandedStudent(null);
        } else {
            setExpandedStudent(student.studentId);
            // Initialize edit state
            const prog = student.progress || {};
            setCurrentTopic(prog.currentTopic || "");
            setProgress(prog.percentage || 0);
            setCompletedTopics(prog.completedTopics || []);
        }
    };

    const addTopic = () => {
        if (newTopic.trim()) {
            setCompletedTopics([...completedTopics, newTopic.trim()]);
            setNewTopic("");
        }
    };

    const toggleTopic = (topic: string, studentSyllabus: string[]) => {
        let updated;
        if (completedTopics.includes(topic)) {
            updated = completedTopics.filter(t => t !== topic);
        } else {
            updated = [...completedTopics, topic];
        }
        setCompletedTopics(updated);

        if (studentSyllabus && studentSyllabus.length > 0) {
            setProgress(Math.round((updated.length / studentSyllabus.length) * 100));
        }
    };

    const removeTopic = (topic: string) => {
        const updated = completedTopics.filter(t => t !== topic);
        setCompletedTopics(updated);

        // Find the current student to get their syllabus for auto-recalc if needed
        const student = students.find(s => s.studentId === expandedStudent);
        if (student?.syllabus?.length > 0) {
            setProgress(Math.round((updated.length / student.syllabus.length) * 100));
        }
    };

    const saveProgress = async (studentId: string) => {
        try {
            const res = await softwareProgressApi.updateProgress(studentId, {
                currentTopic,
                progress,
                completedTopics
            });

            if (res.success) {
                toast({ title: "Success", description: "Progress updated successfully" });
                fetchBranchProgress();
                // Keep expanded to show updated state or close?
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold">Software Progress (Branch-wide)</h3>
                    <p className="text-sm text-muted-foreground">Track technical skill development for all students in your branch.</p>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading progress...</div>
                ) : students.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-card border rounded-xl">No students found.</div>
                ) : (
                    students.map(student => (
                        <div key={student.studentId} className="bg-card border rounded-xl overflow-hidden transition-all">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                                onClick={() => handleExpand(student)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-2 rounded-lg ${expandedStudent === student.studentId ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {expandedStudent === student.studentId ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <h4 className="font-semibold">{student.name}</h4>
                                            <span className="text-sm font-medium text-muted-foreground">{student.progress?.percentage || 0}% Completed</span>
                                        </div>
                                        <Progress value={student.progress?.percentage || 0} className="h-2" />
                                    </div>
                                </div>
                            </div>

                            {expandedStudent === student.studentId && (
                                <div className="border-t bg-muted/10 p-6 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            {student.syllabus && Array.isArray(student.syllabus) ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-medium mb-2 block">Course Syllabus Topics</label>
                                                        <ScrollArea className="h-[250px] w-full rounded-md border p-4 bg-background">
                                                            <div className="space-y-3">
                                                                {student.syllabus.map((topic: string, i: number) => (
                                                                    <div key={i} className="flex items-center space-x-3 group">
                                                                        <Checkbox
                                                                            id={`topic-${student.studentId}-${i}`}
                                                                            checked={completedTopics.includes(topic)}
                                                                            onCheckedChange={() => toggleTopic(topic, student.syllabus)}
                                                                            className="h-5 w-5 border-muted-foreground/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                                                        />
                                                                        <label
                                                                            htmlFor={`topic-${student.studentId}-${i}`}
                                                                            className={cn(
                                                                                "text-sm font-medium leading-none cursor-pointer transition-colors",
                                                                                completedTopics.includes(topic) ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"
                                                                            )}
                                                                        >
                                                                            {topic}
                                                                        </label>
                                                                        {completedTopics.includes(topic) && (
                                                                            <Badge variant="outline" className="ml-auto text-[10px] py-0 h-4 bg-green-50 text-green-700 border-green-200">Done</Badge>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>

                                                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
                                                        <div className="text-sm">
                                                            <span className="text-muted-foreground">Progress:</span>
                                                            <span className="ml-2 font-bold text-primary">{progress}%</span>
                                                            <span className="ml-1 text-xs text-muted-foreground">({completedTopics.length}/{student.syllabus.length} topics)</span>
                                                        </div>
                                                        <Button size="sm" onClick={() => saveProgress(student.studentId)} className="gap-2 h-8">
                                                            <Save className="w-3.5 h-3.5" /> Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 block">Progress %</label>
                                                        <div className="flex items-center gap-4">
                                                            <Input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={progress}
                                                                onChange={(e) => setProgress(parseInt(e.target.value))}
                                                                className="flex-1"
                                                            />
                                                            <span className="w-12 text-center font-bold">{progress}%</span>
                                                        </div>
                                                    </div>
                                                    <Button onClick={() => saveProgress(student.studentId)} className="w-full gap-2">
                                                        <Save className="w-4 h-4" /> Save Progress
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Current Topic / Focus</label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={currentTopic}
                                                        onChange={(e) => setCurrentTopic(e.target.value)}
                                                        placeholder="e.g. React Hooks"
                                                        className="flex-1"
                                                    />
                                                    {student.syllabus && Array.isArray(student.syllabus) && (
                                                        <Select onValueChange={setCurrentTopic}>
                                                            <SelectTrigger className="w-[40px] p-0 flex justify-center">
                                                                <ChevronDown className="h-4 w-4" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {student.syllabus.map((t: string, i: number) => (
                                                                    <SelectItem key={i} value={t}>{t}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t mt-4">
                                                <label className="text-sm font-medium mb-2 block">Quick Add Completed Topic</label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newTopic}
                                                        onChange={(e) => setNewTopic(e.target.value)}
                                                        placeholder="Add custom topic..."
                                                        onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                                                    />
                                                    <Button variant="secondary" onClick={addTopic}>Add</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-4 max-h-[150px] overflow-y-auto p-2 border rounded-md bg-muted/20">
                                                    {completedTopics.map((topic, idx) => (
                                                        <Badge key={idx} variant="outline" className="gap-1 bg-background py-1.5 px-3">
                                                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                                            <span className="max-w-[150px] truncate">{topic}</span>
                                                            <button
                                                                onClick={() => removeTopic(topic)}
                                                                className="ml-1 text-muted-foreground hover:text-destructive p-0.5"
                                                            >×</button>
                                                        </Badge>
                                                    ))}
                                                    {completedTopics.length === 0 && <span className="text-xs text-muted-foreground italic">No topics marked as complete yet.</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SoftwareProgressManager;
