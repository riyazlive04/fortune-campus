
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { reportsApi, studentsApi, coursesApi, storage } from "@/lib/api";
import { Loader2, TrendingUp, Award, ClipboardCheck, UserCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

enum UserRole {
    CEO = "CEO",
    CHANNEL_PARTNER = "CHANNEL_PARTNER",
    TRAINER = "TRAINER",
    ADMISSION_OFFICER = "ADMISSION_OFFICER",
    STUDENT = "STUDENT"
}

const StudentGrowth = () => {
    const [activeTab, setActiveTab] = useState("report");
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any[]>([]);
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

    useEffect(() => {
        const user = storage.getUser();
        setUserRole(user?.role || null);

        const fetchData = async () => {
            try {
                setLoading(true);
                const [studentsRes, coursesRes] = await Promise.all([
                    studentsApi.getStudents(),
                    coursesApi.getCourses()
                ]);
                setStudents(studentsRes.data?.students || studentsRes.data || []);
                setCourses(coursesRes.data || []);

                if (user?.role === UserRole.CEO || user?.role === UserRole.CHANNEL_PARTNER) {
                    const perfRes = await reportsApi.getTrainerPerformance({
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear()
                    });
                    setPerformance(perfRes.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
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

    const isTrainer = userRole === "TRAINER";
    const canViewPerformance = userRole === UserRole.CEO || userRole === UserRole.CHANNEL_PARTNER;

    if (loading && students.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10">
            <PageHeader
                title="Student Growth & Performance"
                description="Track teaching quality, student progress, and trainer effectiveness"
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    {isTrainer && <TabsTrigger value="report">Submit Daily Report</TabsTrigger>}
                    <TabsTrigger value="trends">Growth Trends</TabsTrigger>
                    {canViewPerformance && <TabsTrigger value="performance">Performance Ranking</TabsTrigger>}
                    <TabsTrigger value="awards">Awards & Recognition</TabsTrigger>
                </TabsList>

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
                                                            {s.user?.firstName} {s.user?.lastName} ({s.admission?.admissionNumber || s.id.substring(0, 8)})
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
                                            <Label htmlFor="test">Test Score (Optional Percentage)</Label>
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

                <TabsContent value="trends">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Average Quality Score</CardTitle>
                                <CardDescription>Monthly trend of teaching quality (Trainer avg)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performance}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
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
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="totalReports" name="Total Reports" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

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
                                                <th className="px-4 py-3 text-center">Follow-ups</th>
                                                <th className="px-4 py-3 text-right">Final Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {performance.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No performance data available yet.</td>
                                                </tr>
                                            ) : performance.map((p, idx) => (
                                                <tr key={p.trainerId} className={idx === 0 ? "bg-primary/5 font-semibold" : ""}>
                                                    <td className="px-4 py-4">
                                                        {idx === 0 ? <Award className="h-5 w-5 text-yellow-500" /> : idx + 1}
                                                    </td>
                                                    <td className="px-4 py-4">{p.name}</td>
                                                    <td className="px-4 py-4 text-center">{p.avgQuality}</td>
                                                    <td className="px-4 py-4 text-center">{p.avgDoubt}</td>
                                                    <td className="px-4 py-4 text-center">{Number(p.portfolioChecks) + Number(p.classFollowUps)}</td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
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

                <TabsContent value="awards">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {performance.slice(0, 3).map((p, i) => (
                            <Card key={p.trainerId} className="border-t-4 border-t-yellow-400">
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                                        <Award className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <CardTitle className="text-lg">{i === 0 ? "Trainer of the Month" : "Top Performer"}</CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <div className="space-y-1">
                                        <p className="font-bold text-xl">{p.name}</p>
                                        <p className="text-sm text-muted-foreground">Score: {p.score}</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex justify-between">
                                        <span>Quality: {p.avgQuality}</span>
                                        <span>Reports: {p.totalReports}</span>
                                    </div>
                                    {i === 0 && (
                                        <div className="mt-4 bg-yellow-50 text-yellow-700 py-1 px-3 rounded-full text-xs font-medium inline-block">
                                            🌟 Certificate Eligible
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {performance.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                                Awards are announced at the end of each month.
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default StudentGrowth;

