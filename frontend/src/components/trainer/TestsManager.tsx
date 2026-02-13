
import { useState, useEffect } from "react";
import { trainerApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Award, Save, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TestsManagerProps {
    batches: any[];
}

const TestsManager = ({ batches }: TestsManagerProps) => {
    const [selectedBatch, setSelectedBatch] = useState<string>(batches[0]?.id || "");
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTest, setSelectedTest] = useState<string | null>(null);
    const [scores, setScores] = useState<any[]>([]); // Current scores being edited
    const [students, setStudents] = useState<any[]>([]); // Students for score entry
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTest, setNewTest] = useState({ title: "", maxScore: 100, date: new Date().toISOString().split('T')[0] });

    const { toast } = useToast();

    const fetchTests = async () => {
        if (!selectedBatch) return;
        try {
            setLoading(true);
            const res = await trainerApi.getBatchTests(selectedBatch);
            if (res.success) {
                setTests(res.data);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
        setSelectedTest(null);
    }, [selectedBatch]);

    const handleCreateTest = async () => {
        if (!selectedBatch) {
            toast({ variant: "destructive", title: "Error", description: "Please select a batch first" });
            return;
        }
        try {
            const res = await trainerApi.createTest({ ...newTest, batchId: selectedBatch });
            if (res.success) {
                toast({ title: "Success", description: "Test created successfully" });
                setIsCreateOpen(false);
                setNewTest({ title: "", maxScore: 100, date: new Date().toISOString().split('T')[0] });
                fetchTests();
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const loadScores = async (testId: string) => {
        if (selectedTest === testId) {
            setSelectedTest(null);
            return;
        }

        try {
            // Fetch both students and existing scores
            const [studentsRes, scoresRes] = await Promise.all([
                trainerApi.getBatchStudents(selectedBatch),
                trainerApi.getTestScores(testId)
            ]);

            if (studentsRes.success && scoresRes.success) {
                setStudents(studentsRes.data);

                // Map students to scores (or default if no score)
                const mappedScores = studentsRes.data.map((student: any) => {
                    const existingScore = scoresRes.data.find((s: any) => s.studentId === student.id);
                    return {
                        studentId: student.id,
                        studentName: `${student.user.firstName} ${student.user.lastName}`,
                        score: existingScore ? existingScore.score : '', // empty string for no score
                        feedback: existingScore ? existingScore.feedback : ''
                    };
                });

                setScores(mappedScores);
                setSelectedTest(testId);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const handleScoreChange = (index: number, field: string, value: any) => {
        const newScores = [...scores];
        newScores[index] = { ...newScores[index], [field]: value };
        setScores(newScores);
    };

    const saveScores = async () => {
        if (!selectedTest) return;
        try {
            // Filter out empty scores if you want, or send all
            const scoresToSave = scores.filter(s => s.score !== '' && s.score !== null).map(s => ({
                studentId: s.studentId,
                score: parseFloat(s.score),
                feedback: s.feedback
            }));

            const res = await trainerApi.updateTestScores(selectedTest, scoresToSave);
            if (res.success) {
                toast({ title: "Success", description: "Scores updated successfully" });
                setSelectedTest(null); // Close the editor or keep open?
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold">Test & Evaluation</h3>
                    <p className="text-sm text-muted-foreground">Create tests and manage student scores.</p>
                </div>
                <div className="flex items-center gap-2">
                    {batches.length > 0 ? (
                        <select
                            className="bg-background border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                        >
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    ) : (
                        <div className="text-sm text-destructive font-medium px-3 py-1.5 border border-destructive/20 bg-destructive/10 rounded-lg">
                            No active batches found
                        </div>
                    )}

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1.5">
                                <Plus className="w-4 h-4" /> Create Test
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Test</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Test Title</Label>
                                    <Input
                                        value={newTest.title}
                                        onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                                        placeholder="e.g. Weekly Assessment 1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Max Score</Label>
                                        <Input
                                            type="number"
                                            value={newTest.maxScore}
                                            onChange={(e) => setNewTest({ ...newTest, maxScore: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            value={newTest.date}
                                            onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleCreateTest} className="w-full">Create Test</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-4">
                {loading && tests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Loading tests...</div>
                ) : tests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-card border rounded-xl">No tests found for this batch.</div>
                ) : (
                    tests.map(test => (
                        <div key={test.id} className="bg-card border rounded-xl overflow-hidden transition-all">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                                onClick={() => loadScores(test.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedTest === test.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {selectedTest === test.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{test.title}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(test.date).toLocaleDateString()} • Max: {test.maxScore}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-muted-foreground">
                                    {test._count?.scores || 0} Graded
                                </div>
                            </div>

                            {selectedTest === test.id && (
                                <div className="border-t bg-muted/10 p-4 animate-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h5 className="font-semibold text-sm">Enter Scores</h5>
                                        <Button size="sm" onClick={saveScores} className="gap-1.5 h-8">
                                            <Save className="w-3.5 h-3.5" /> Save Changes
                                        </Button>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border bg-background">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 text-left w-1/3">Student</th>
                                                    <th className="px-4 py-3 text-left w-24">Score</th>
                                                    <th className="px-4 py-3 text-left">Feedback (Optional)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {scores.map((s, idx) => (
                                                    <tr key={s.studentId}>
                                                        <td className="px-4 py-2 font-medium">{s.studentName}</td>
                                                        <td className="px-4 py-2">
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-20"
                                                                value={s.score}
                                                                onChange={(e) => handleScoreChange(idx, 'score', e.target.value)}
                                                                max={test.maxScore}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <Input
                                                                className="h-8"
                                                                placeholder="Great work..."
                                                                value={s.feedback}
                                                                onChange={(e) => handleScoreChange(idx, 'feedback', e.target.value)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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

export default TestsManager;
