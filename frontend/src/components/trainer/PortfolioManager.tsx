
import { useState, useEffect } from "react";
import { portfolioTasksApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Check, X, ExternalLink, MessageSquare, Users,
    Briefcase, AlertCircle, Clock, Search, ChevronLeft
} from "lucide-react"; // Import necessary icons
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const PortfolioManager = () => {
    // State
    const [view, setView] = useState<'BATCH' | 'STUDENT'>('BATCH');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [studentData, setStudentData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Review State
    const [reviewingTaskId, setReviewingTaskId] = useState<string | null>(null);
    const [reviewRemarks, setReviewRemarks] = useState("");
    const { toast } = useToast();

    // Fetch Batch Stats
    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await portfolioTasksApi.getStats();
            if (res.success) {
                setStats(res.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch portfolio stats",
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch Student Details
    const fetchStudentDetails = async (id: string) => {
        try {
            setLoading(true);
            const res = await portfolioTasksApi.getStudentPortfolio(id);
            if (res.success) {
                setStudentData(res.data);
                setSelectedStudentId(id);
                setView('STUDENT');
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch student portfolio",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Review Handler
    const handleReview = async (submissionId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await portfolioTasksApi.reviewSubmission(submissionId, { status, remarks: reviewRemarks });
            if (res.success) {
                toast({
                    title: "Success",
                    description: `Submission ${status.toLowerCase()} successfully`,
                });
                setReviewingTaskId(null);
                setReviewRemarks("");
                // Refresh student data
                if (selectedStudentId) fetchStudentDetails(selectedStudentId);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to review submission",
            });
        }
    };

    // Filtered Students
    const filteredStudents = stats?.studentStats?.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // --- Views ---

    if (view === 'BATCH') {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold">Portfolio Management</h3>
                    <p className="text-sm text-muted-foreground">Monitor and manage portfolio progress across your branch.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.summary?.totalStudents || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.summary?.overallCompletionRate || 0}%</div>
                            <Progress value={stats?.summary?.overallCompletionRate || 0} className="mt-2 h-2" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.summary?.studentsPendingReview || 0}</div>
                            <p className="text-xs text-muted-foreground">Students waiting</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.summary?.studentsDelayed || 0}</div>
                            <p className="text-xs text-muted-foreground">Low activity / Overdue</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Student List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg bg-card">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-10 px-4 text-left font-medium">Student Name</th>
                                    <th className="h-10 px-4 text-left font-medium">Completion</th>
                                    <th className="h-10 px-4 text-left font-medium">Status</th>
                                    <th className="h-10 px-4 text-left font-medium">Last Active</th>
                                    <th className="h-10 px-4 text-right font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && !stats ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading data...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No students found.</td></tr>
                                ) : (
                                    filteredStudents.map((student: any) => (
                                        <tr key={student.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-medium">
                                                {student.name}
                                                {student.pendingCount > 0 && (
                                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        {student.pendingCount} Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 w-32">
                                                    <Progress value={student.completionRate} className="h-2" />
                                                    <span className="text-xs text-muted-foreground">{student.completionRate}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {student.isDelayed ? (
                                                    <Badge variant="destructive">Delayed</Badge>
                                                ) : student.certificateLocked ? (
                                                    <Badge variant="outline">In Progress</Badge>
                                                ) : (
                                                    <Badge variant="default" className="bg-success text-white hover:bg-success/90">Completed</Badge>
                                                )}
                                                {student.placementEligible && (
                                                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">Placement Ready</Badge>
                                                )}
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {student.lastSubmissionDate ? new Date(student.lastSubmissionDate).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button size="sm" variant="outline" onClick={() => fetchStudentDetails(student.id)}>
                                                    View Portfolio
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'STUDENT' && studentData) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => setView('BATCH')}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Batch View
                </Button>

                {/* Student Header */}
                <div className="flex flex-col md:flex-row justify-between gap-4 bg-card border rounded-xl p-6">
                    <div>
                        <h2 className="text-2xl font-bold">{studentData.student.name}</h2>
                        <div className="flex gap-2 text-muted-foreground mt-1">
                            <span>{studentData.student.courseName}</span>
                            <span>•</span>
                            <span>{studentData.student.completionStats.completionRate ?? 0}% Completed</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{studentData.student.completionStats.mandatoryTasks}</div>
                            <div className="text-xs text-muted-foreground">Mandatory</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-success">{studentData.student.completionStats.approvedMandatory}</div>
                            <div className="text-xs text-muted-foreground">Approved</div>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="border rounded-lg bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="h-10 px-6 text-left font-medium w-1/3">Task</th>
                                <th className="h-10 px-6 text-left font-medium">Submission</th>
                                <th className="h-10 px-6 text-left font-medium">Status</th>
                                <th className="h-10 px-6 text-right font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {studentData.portfolio.map((task: any) => (
                                <tr key={task.taskId} className="bg-card hover:bg-muted/20">
                                    <td className="p-6">
                                        <div className="font-semibold flex items-center gap-2">
                                            {task.title}
                                            {task.isMandatory ? (
                                                <Badge variant="secondary" className="text-[10px] h-5">Mandatory</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] h-5">Optional</Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
                                        {task.deadlineDays && (
                                            <div className="text-xs text-destructive mt-1">
                                                Deadline: {task.deadlineDays} days from enrollment
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        {task.status === 'NOT_STARTED' ? (
                                            <span className="text-muted-foreground text-xs italic">Not uploaded</span>
                                        ) : (
                                            <div className="space-y-1">
                                                {task.workUrl && (
                                                    <a href={task.workUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline font-medium">
                                                        <ExternalLink className="w-3 h-3" /> View Work
                                                    </a>
                                                )}
                                                {task.behanceUrl && (
                                                    <a href={task.behanceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline font-medium">
                                                        <ExternalLink className="w-3 h-3" /> Behance Link
                                                    </a>
                                                )}
                                                <div className="text-xs text-muted-foreground">
                                                    Submitted: {new Date(task.submittedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <StatusBadge status={task.status} />
                                        {task.rejectionCount > 0 && (
                                            <div className="text-xs text-destructive mt-1 font-medium">
                                                Rejected {task.rejectionCount} time(s)
                                            </div>
                                        )}
                                        {task.remarks && (
                                            <div className="text-xs text-muted-foreground mt-1 italic max-w-xs">
                                                "{task.remarks}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        {task.status === 'PENDING' && (
                                            reviewingTaskId === task.submissionId ? (
                                                <div className="flex flex-col gap-2 min-w-[200px] ml-auto">
                                                    <Input
                                                        placeholder="Add remarks..."
                                                        value={reviewRemarks}
                                                        onChange={(e) => setReviewRemarks(e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-success hover:bg-success/90 h-7 text-xs"
                                                            onClick={() => handleReview(task.submissionId, 'APPROVED')}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="flex-1 h-7 text-xs"
                                                            onClick={() => handleReview(task.submissionId, 'REJECTED')}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 text-xs"
                                                        onClick={() => { setReviewingTaskId(null); setReviewRemarks(""); }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" onClick={() => setReviewingTaskId(task.submissionId)}>
                                                    Review
                                                </Button>
                                            )
                                        )}
                                        {['APPROVED', 'REJECTED'].includes(task.status) && (
                                            <span className="text-xs text-muted-foreground font-medium">Reviewed</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return null;
};

export default PortfolioManager;
