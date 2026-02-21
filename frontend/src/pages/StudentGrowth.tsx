
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { reportsApi, studentsApi, coursesApi, storage } from "@/lib/api";
import { Loader2, TrendingUp, Award, ClipboardCheck, UserCheck, BookOpen, Star, MessageSquare, FileText, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

enum UserRole {
    CEO = "CEO",
    CHANNEL_PARTNER = "CHANNEL_PARTNER",
    TRAINER = "TRAINER",
    ADMISSION_OFFICER = "ADMISSION_OFFICER",
    STUDENT = "STUDENT"
}

const StudentGrowth = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
    const [selectedPerformance, setSelectedPerformance] = useState<any | null>(null);
    const [studentReports, setStudentReports] = useState<any[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const { toast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        studentId: "",
        courseId: "",
        qualityTeaching: "5",
        doubtClearance: "5",
        testScore: "",
        aiUpdate: "",
        portfolioFollowUp: false,
        classFollowUp: false,
    });

    const isTrainer = userRole === UserRole.TRAINER;
    const canViewPerformance = userRole === UserRole.CEO || userRole === UserRole.CHANNEL_PARTNER;

    // Default tab based on role
    const defaultTab = isTrainer ? "report" : "trends";
    const [activeTab, setActiveTab] = useState(defaultTab);

    useEffect(() => {
        const user = storage.getUser();
        const role = user?.role || null;
        setUserRole(role);

        // Set correct default tab immediately
        if (role !== UserRole.TRAINER) {
            setActiveTab("trends");
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                if (role === UserRole.TRAINER) {
                    // Trainers need students and courses for the form
                    const [studentsRes, coursesRes] = await Promise.all([
                        studentsApi.getStudents(),
                        coursesApi.getCourses()
                    ]);
                    // Handle all possible response shapes
                    const studentsData = studentsRes.data?.students || studentsRes.data?.data || studentsRes.data || studentsRes || [];
                    const coursesData = coursesRes.data?.courses || coursesRes.data?.data || coursesRes.data || coursesRes || [];
                    setStudents(Array.isArray(studentsData) ? studentsData : []);
                    setCourses(Array.isArray(coursesData) ? coursesData : []);
                } else if (role === UserRole.CEO || role === UserRole.CHANNEL_PARTNER) {
                    // CEO/CP need performance data and student reports
                    const perfRes = await reportsApi.getTrainerPerformance({
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear()
                    });
                    // Backend returns data directly in perfRes.data (array)
                    const perfData = Array.isArray(perfRes.data) ? perfRes.data : (perfRes.data?.data || []);
                    const mappedPerfData = perfData.map((p: any) => ({
                        ...p,
                        displayName: p.branch ? `${p.name}\n(${p.branch})` : p.name
                    }));
                    setPerformance(mappedPerfData);

                    // Also fetch students for growth history
                    const studentsRes = await studentsApi.getStudents({ limit: 50 });
                    setStudents(studentsRes.data?.students || studentsRes.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load performance data"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentId) {
            toast({ variant: "destructive", title: "Error", description: "Please select a student" });
            return;
        }
        try {
            setLoading(true);
            await reportsApi.submitGrowthReport(formData);
            toast({ title: "Success", description: "Growth report submitted successfully" });
            setFormData({
                studentId: "",
                courseId: "",
                qualityTeaching: "5",
                doubtClearance: "5",
                testScore: "",
                aiUpdate: "",
                portfolioFollowUp: false,
                classFollowUp: false,
            });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to submit report" });
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentReports = async (studentId: string) => {
        setSelectedStudentId(studentId);
        try {
            const res = await reportsApi.getStudentGrowthReports(studentId);
            setStudentReports(res.data || []);
        } catch (error) {
            console.error("Failed to fetch student reports", error);
            setStudentReports([]);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10">
            <PageHeader
                title="Trainer Growth & Performance"
                description="Track teaching quality, student progress, and trainer effectiveness"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    {isTrainer && <TabsTrigger value="report">Submit Daily Report</TabsTrigger>}
                    <TabsTrigger value="trends">Growth Trends</TabsTrigger>
                    {canViewPerformance && <TabsTrigger value="performance">Performance Ranking</TabsTrigger>}
                    {canViewPerformance && <TabsTrigger value="students">Student Reports</TabsTrigger>}
                </TabsList>

                {/* ── Submit Daily Report (Trainer only) ── */}
                {isTrainer && (
                    <TabsContent value="report">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Student Growth Report</CardTitle>
                                <CardDescription>Submit performance metrics for a student today.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmitReport} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="student">Select Student</Label>
                                            <Select
                                                value={formData.studentId}
                                                onValueChange={(val) => setFormData({ ...formData, studentId: val })}
                                            >
                                                <SelectTrigger id="student">
                                                    <SelectValue placeholder="Select a student" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {students.map((s) => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.user?.firstName} {s.user?.lastName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="course">Course</Label>
                                            <Select
                                                value={formData.courseId}
                                                onValueChange={(val) => setFormData({ ...formData, courseId: val })}
                                            >
                                                <SelectTrigger id="course">
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {courses.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="quality">Quality of Teaching (1-10)</Label>
                                            <Input
                                                id="quality"
                                                type="number"
                                                min="1" max="10"
                                                value={formData.qualityTeaching}
                                                onChange={(e) => setFormData({ ...formData, qualityTeaching: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="doubt">Doubt Clearance (1-10)</Label>
                                            <Input
                                                id="doubt"
                                                type="number"
                                                min="1" max="10"
                                                value={formData.doubtClearance}
                                                onChange={(e) => setFormData({ ...formData, doubtClearance: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="test">Test Score (Optional %)</Label>
                                            <Input
                                                id="test"
                                                type="number"
                                                placeholder="e.g. 85"
                                                value={formData.testScore}
                                                onChange={(e) => setFormData({ ...formData, testScore: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ai">AI Tool Updates</Label>
                                            <Input
                                                id="ai"
                                                placeholder="e.g. ChatGPT, Midjourney updates"
                                                value={formData.aiUpdate}
                                                onChange={(e) => setFormData({ ...formData, aiUpdate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-6">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="portfolio"
                                                checked={formData.portfolioFollowUp}
                                                onCheckedChange={(checked) => setFormData({ ...formData, portfolioFollowUp: !!checked })}
                                            />
                                            <Label htmlFor="portfolio">Portfolio Follow-up Done</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="class"
                                                checked={formData.classFollowUp}
                                                onCheckedChange={(checked) => setFormData({ ...formData, classFollowUp: !!checked })}
                                            />
                                            <Label htmlFor="class">Class Follow-up Done</Label>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
                                        Submit Growth Report
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* ── Growth Trends ── */}
                <TabsContent value="trends">
                    {performance.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-border py-20 text-center">
                            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-sm font-semibold text-muted-foreground">No growth data available yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">Trainers need to submit daily reports for data to appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Average Quality Score</CardTitle>
                                    <CardDescription>Teaching quality per trainer this month</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performance}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="displayName" tick={{ fontSize: 11 }} />
                                                <YAxis domain={[0, 10]} />
                                                <Tooltip />
                                                <Bar dataKey="avgQuality" name="Quality Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Report Consistency</CardTitle>
                                    <CardDescription>Number of reports submitted this month</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performance}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="displayName" tick={{ fontSize: 11 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="totalReports" name="Total Reports" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* ── Performance Ranking (CEO/CP only) ── */}
                {canViewPerformance && (
                    <TabsContent value="performance">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Best Performer Leaderboard</CardTitle>
                                        <CardDescription>Trainer rankings based on composite scores for current month.</CardDescription>
                                    </div>
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                                            <tr>
                                                <th className="px-4 py-3">Rank</th>
                                                <th className="px-4 py-3">Trainer</th>
                                                <th className="px-4 py-3 text-center">Quality</th>
                                                <th className="px-4 py-3 text-center">Doubt</th>
                                                <th className="px-4 py-3 text-center">Reports</th>
                                                <th className="px-4 py-3 text-center">Follow-ups</th>
                                                <th className="px-4 py-3 text-right">Final Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {performance.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                                        <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                                                        No performance data available yet. Trainers need to submit daily reports.
                                                    </td>
                                                </tr>
                                            ) : performance.map((p, idx) => (
                                                <tr
                                                    key={p.trainerId}
                                                    onClick={() => setSelectedPerformance(p)}
                                                    className={`cursor-pointer ${idx === 0 ? "bg-primary/5 font-semibold" : "hover:bg-muted/30 transition-colors"}`}
                                                >
                                                    <td className="px-4 py-4">
                                                        {idx === 0 ? <Award className="h-5 w-5 text-yellow-500" /> : <span className="text-muted-foreground font-bold">{idx + 1}</span>}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-medium text-foreground">{p.name}</div>
                                                        <div className="text-[11px] text-muted-foreground">{p.branch || 'General'}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">{p.avgQuality}</td>
                                                    <td className="px-4 py-4 text-center">{p.avgDoubt}</td>
                                                    <td className="px-4 py-4 text-center">{p.totalReports}</td>
                                                    <td className="px-4 py-4 text-center">{Number(p.portfolioChecks) + Number(p.classFollowUps)}</td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                                                            {p.score}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* ── Student Reports (CEO/CP only) ── */}
                {canViewPerformance && (
                    <TabsContent value="students">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        Select Student
                                    </CardTitle>
                                    <CardDescription>Click a student to view their growth reports</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[500px] overflow-y-auto divide-y">
                                        {students.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground text-center">No students found.</p>
                                        ) : students.map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => fetchStudentReports(s.id)}
                                                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors text-sm ${selectedStudentId === s.id ? 'bg-muted border-l-4 border-primary' : ''}`}
                                            >
                                                <p className="font-semibold text-foreground">{s.user?.firstName} {s.user?.lastName}</p>
                                                <p className="text-xs text-muted-foreground">{s.course?.name || "No course"}</p>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Growth Report History</CardTitle>
                                    <CardDescription>Daily reports submitted by trainers for this student</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {studentReports.length === 0 ? (
                                        <div className="py-16 text-center">
                                            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                                            <p className="text-sm text-muted-foreground">Select a student to view their reports.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                                                    <tr>
                                                        <th className="px-4 py-3">Date</th>
                                                        <th className="px-4 py-3 text-center">Quality</th>
                                                        <th className="px-4 py-3 text-center">Doubt</th>
                                                        <th className="px-4 py-3 text-center">Test Score</th>
                                                        <th className="px-4 py-3">Trainer</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {studentReports.map((r: any) => (
                                                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                                            <td className="px-4 py-3 font-medium">
                                                                {new Date(r.reportDate || r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${Number(r.qualityTeaching) >= 8 ? 'bg-green-100 text-green-700' : Number(r.qualityTeaching) >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {r.qualityTeaching}/10
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${Number(r.doubtClearance) >= 8 ? 'bg-green-100 text-green-700' : Number(r.doubtClearance) >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {r.doubtClearance}/10
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">{r.testScore ? `${Number(r.testScore).toFixed(2)}%` : '-'}</td>
                                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                                {r.trainer?.user ? `${r.trainer.user.firstName} ${r.trainer.user.lastName}` : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            {/* Trainer Performance Dialog */}
            <Dialog open={!!selectedPerformance} onOpenChange={(open) => !open && setSelectedPerformance(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-primary" />
                            {selectedPerformance?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Branch: {selectedPerformance?.branch || 'General'}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPerformance && (
                        <div className="grid gap-4 py-4">
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Star className="h-5 w-5 text-yellow-500" />
                                    <span className="font-medium text-sm">Quality of Teaching</span>
                                </div>
                                <span className="font-bold">{selectedPerformance.avgQuality}/10</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-blue-500" />
                                    <span className="font-medium text-sm">Doubt Clearance</span>
                                </div>
                                <span className="font-bold">{selectedPerformance.avgDoubt}/10</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-green-500" />
                                    <span className="font-medium text-sm">Reports Submitted</span>
                                </div>
                                <span className="font-bold">{selectedPerformance.totalReports}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-purple-500" />
                                    <span className="font-medium text-sm">Follow-ups Done</span>
                                </div>
                                <span className="font-bold">{Number(selectedPerformance.portfolioChecks) + Number(selectedPerformance.classFollowUps)}</span>
                            </div>

                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <span className="font-bold">Final Composite Score</span>
                                <span className="text-xl font-black text-primary">{selectedPerformance.score}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default StudentGrowth;
