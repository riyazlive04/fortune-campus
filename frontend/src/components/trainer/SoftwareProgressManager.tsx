
import { useState, useEffect } from "react";
import { softwareProgressApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, ChevronRight, ChevronDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SoftwareProgressManagerProps {
    batches: any[];
}

const SoftwareProgressManager = ({ batches }: SoftwareProgressManagerProps) => {
    const [selectedBatch, setSelectedBatch] = useState<string>(batches[0]?.id || "");
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    // Edit state
    const [currentTopic, setCurrentTopic] = useState("");
    const [progress, setProgress] = useState(0);
    const [newTopic, setNewTopic] = useState("");
    const [completedTopics, setCompletedTopics] = useState<string[]>([]);

    const { toast } = useToast();

    const fetchBatchProgress = async () => {
        if (!selectedBatch) return;
        try {
            setLoading(true);
            const res = await softwareProgressApi.getBatchProgress(selectedBatch);
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
        fetchBatchProgress();
        setExpandedStudent(null);
    }, [selectedBatch]);

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

    const removeTopic = (topic: string) => {
        setCompletedTopics(completedTopics.filter(t => t !== topic));
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
                fetchBatchProgress();
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
                    <h3 className="text-lg font-bold">Software Progress</h3>
                    <p className="text-sm text-muted-foreground">Track technical skill development per student.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Batch:</span>
                    <select
                        className="bg-background border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
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
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Current Topic</label>
                                                <Input
                                                    value={currentTopic}
                                                    onChange={(e) => setCurrentTopic(e.target.value)}
                                                    placeholder="e.g. React Hooks"
                                                />
                                            </div>
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

                                        <div className="space-y-4">
                                            <label className="text-sm font-medium mb-1 block">Completed Topics</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newTopic}
                                                    onChange={(e) => setNewTopic(e.target.value)}
                                                    placeholder="Add completed topic..."
                                                    onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                                                />
                                                <Button variant="secondary" onClick={addTopic}>Add</Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {completedTopics.map((topic, idx) => (
                                                    <Badge key={idx} variant="outline" className="gap-1 bg-background">
                                                        <CheckCircle className="w-3 h-3 text-success" />
                                                        {topic}
                                                        <button
                                                            onClick={() => removeTopic(topic)}
                                                            className="ml-1 hover:text-destructive"
                                                        >×</button>
                                                    </Badge>
                                                ))}
                                                {completedTopics.length === 0 && <span className="text-xs text-muted-foreground italic">No topics marked as complete yet.</span>}
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
