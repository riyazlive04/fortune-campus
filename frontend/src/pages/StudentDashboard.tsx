import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { storage, ratingsApi } from '@/lib/api';
import {
    GraduationCap,
    Calendar,
    BookOpen,
    FileText,
    ClipboardCheck,
    DollarSign,
    Bell,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    Upload,
    TrendingUp,
    Star,
    Send,
} from 'lucide-react';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import FeeReceipt from '@/components/FeeReceipt';
import { Download, Loader2 } from 'lucide-react';
import { studentsApi } from '@/lib/api';
import PageHeader from '@/components/PageHeader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface StudentOverview {
    student: {
        name: string;
        email: string;
        phone: string;
        enrollmentNumber: string;
    };
    course: {
        name: string;
        code: string;
        duration: number;
    };
    batch: {
        name: string;
        code: string;
        timing: string;
        trainer: string;
        trainerId?: string;
    } | null;
    branch: {
        name: string;
        code: string;
    };
    attendance: {
        percentage: number;
        status: string;
        present: number;
        late: number;
        total: number;
    };
    portfolio: {
        percentage: number;
        status: string;
        approved: number;
        total: number;
    };
    tests: {
        status: string;
        passed: number;
        total: number;
    };
    softwareProgress: {
        percentage: number;
        currentTopic: string;
    };
    eligibility: {
        certificate: {
            eligible: boolean;
            status: string;
            missingRequirements: string[];
        };
        placement: {
            eligible: boolean;
            status: string;
        };
    };
    fees: {
        total: number;
        paid: number;
        balance: number;
    };
    allEnrollments?: Array<{
        batchId: string;
        batchName: string;
        batchCode: string;
        courseName: string;
        courseCode: string;
        timing: string;
        trainer: string;
        trainerId?: string;
    }>;
}

const StudentDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<StudentOverview | null>(null);
    const [attendanceData, setAttendanceData] = useState<any>(null);
    const [progressData, setProgressData] = useState<any>(null);
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [testsData, setTestsData] = useState<any>(null);
    const [feesData, setFeesData] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const { toast } = useToast();

    // Rating State
    const [ratingLoading, setRatingLoading] = useState(false);
    const [myRating, setMyRating] = useState<number>(0);
    const [ratingComment, setRatingComment] = useState('');
    const [hasRatedThisMonth, setHasRatedThisMonth] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [showRatingSuccess, setShowRatingSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Modal state for Tests details
    const [showTestsModal, setShowTestsModal] = useState(false);
    const [testsModalData, setTestsModalData] = useState<any[]>([]);
    const [testsModalLoading, setTestsModalLoading] = useState(false);

    const fetchTestsForModal = async () => {
        setShowTestsModal(true);
        if (testsModalData.length > 0) return; // already loaded
        setTestsModalLoading(true);
        try {
            const token = storage.getToken();
            const response = await fetch(`${API_BASE_URL}/students/dashboard/tests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                const all = [...(data.data.upcoming || []), ...(data.data.results || [])];
                setTestsModalData(all);
            }
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load test details' });
        } finally {
            setTestsModalLoading(false);
        }
    };

    const fetchOverview = async () => {
        try {
            setError(null);
            const token = storage.getToken();
            const response = await fetch(`${API_BASE_URL}/students/dashboard/overview`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setOverview(data.data);
                // If there's a trainer, fetch existing rating
                if (data.data.batch?.trainerId) {
                    fetchMyRating(data.data.batch.trainerId);
                }
            } else {
                const errorMsg = data.message || 'Failed to fetch student profile';
                setError(errorMsg);
                toast({
                    variant: 'destructive',
                    title: 'Status',
                    description: errorMsg,
                });
            }
        } catch (error) {
            setError('Connection error. Please check if the server is running.');
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch overview',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchMyRating = async (trainerId: string) => {
        try {
            const res = await ratingsApi.getMyRatingForTrainer(trainerId);
            if (res.success && res.data?.existing) {
                setMyRating(res.data.existing.rating);
                setRatingComment(res.data.existing.comment || '');
                setHasRatedThisMonth(true);
            }
        } catch (error) {
            console.error('Failed to fetch rating:', error);
        }
    };

    const handleSubmitRating = async (trainerId: string) => {
        if (myRating < 1 || myRating > 5) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a rating from 1 to 5.' });
            return;
        }

        setRatingLoading(true);
        try {
            const res = await ratingsApi.submitTrainerRating({
                trainerId,
                rating: myRating,
                comment: ratingComment
            });

            if (res.success) {
                setHasRatedThisMonth(true);
                setShowRatingSuccess(true);
                setTimeout(() => setShowRatingSuccess(false), 3000);
                toast({ title: 'Success', description: 'Thank you! Your rating has been submitted.' });
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to submit rating' });
        } finally {
            setRatingLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const token = storage.getToken();
            const response = await fetch(`${API_BASE_URL}/students/dashboard/attendance`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setAttendanceData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
        }
    };

    const fetchProgress = async () => {
        try {
            const token = storage.getToken();
            const response = await fetch(`${API_BASE_URL}/students/dashboard/progress`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setProgressData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch progress:', error);
        }
    };

    const fetchPortfolio = async () => {
        try {
            const token = storage.getToken();
            const response = await fetch(`${API_BASE_URL}/students/dashboard/portfolio`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setPortfolioData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
        }
    };

    const fetchTests = async () => {
        try {
            const token = storage.getToken();
            const response = await fetch(`${API_BASE_URL}/students/dashboard/tests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setTestsData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        }
    };

    const fetchFees = async () => {
        try {
            const token = storage.getToken();
            const response = await fetch(`${API_BASE_URL}/students/dashboard/fees`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setFeesData(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch fees:', error);
        }
    };

    const handleDownloadReceipt = async (request: any) => {
        try {
            setDownloadingId(request.id);
            const res = await studentsApi.getFeeRequest(request.id);
            if (!res) throw new Error("Failed to fetch receipt details");

            const fullData = res;
            setReceiptData(fullData);

            setTimeout(async () => {
                const element = document.getElementById('fee-receipt-content');
                if (!element) return;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`Receipt_${fullData.student.enrollmentNumber}_${request.id.substring(0, 8)}.pdf`);

                setDownloadingId(null);
                setReceiptData(null);

                toast({
                    title: "Success",
                    description: "Receipt downloaded successfully",
                });
            }, 500);

        } catch (error) {
            console.error("Download Error:", error);
            setDownloadingId(null);
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: "Could not generate receipt PDF"
            });
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = storage.getToken();
            const response = await fetch(`${API_BASE_URL}/students/dashboard/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(data.data.notifications);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchOverview();
        fetchNotifications();
    }, []);

    const handleTabChange = (value: string) => {
        if (value === 'attendance' && !attendanceData) fetchAttendance();
        if (value === 'progress' && !progressData) fetchProgress();
        if (value === 'portfolio' && !portfolioData) fetchPortfolio();
        if (value === 'tests' && !testsData) fetchTests();
        if (value === 'fees' && !feesData) fetchFees();
    };

    const getStatusColor = (status: string) => {
        if (status === 'ELIGIBLE' || status === 'COMPLETED' || status === 'PASSED') return 'bg-green-500';
        if (status === 'IN_PROGRESS' || status === 'PARTIAL') return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'ELIGIBLE' || status === 'COMPLETED' || status === 'PASSED') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if (status === 'IN_PROGRESS' || status === 'PARTIAL') return <Clock className="h-5 w-5 text-yellow-500" />;
        return <XCircle className="h-5 w-5 text-red-500" />;
    };

    if (loading) return <DashboardSkeleton />;

    if (error || !overview) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-xl font-bold">Incomplete Data</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    {error || 'Student profile not found. Please contact admin to complete your admission and profile creation.'}
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                    <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <PageHeader
                title={`Welcome, ${overview.student.name.split(' ')[0]}!`}
                description={
                    overview.allEnrollments && overview.allEnrollments.length > 1
                        ? overview.allEnrollments.map(e => e.courseName).join(' • ')
                        : `${overview.course.name} • ${overview.branch.name}`
                }
            />

            <Tabs defaultValue="overview" className="space-y-4" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="fees">Fees</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    {/* Eligibility Cards */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    Certificate Eligibility
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Badge className={getStatusColor(overview.eligibility.certificate.status)}>
                                            {overview.eligibility.certificate.eligible ? 'Eligible' : 'Not Eligible'}
                                        </Badge>
                                        {overview.eligibility.certificate.missingRequirements.length > 0 && (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                <p className="font-semibold">Missing Requirements:</p>
                                                <ul className="list-disc list-inside">
                                                    {overview.eligibility.certificate.missingRequirements.map((req, idx) => (
                                                        <li key={idx}>{req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    {getStatusIcon(overview.eligibility.certificate.status)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Placement Eligibility
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <Badge className={getStatusColor(overview.eligibility.placement.status)}>
                                        {overview.eligibility.placement.eligible ? 'Eligible' : 'Not Eligible'}
                                    </Badge>
                                    {getStatusIcon(overview.eligibility.placement.status)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.attendance.percentage}%</div>
                                <Progress value={overview.attendance.percentage} className="mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {overview.attendance.present}P / {overview.attendance.late}L / {overview.attendance.total} days
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Portfolio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.portfolio.percentage}%</div>
                                <Progress value={overview.portfolio.percentage} className="mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {overview.portfolio.approved} / {overview.portfolio.total} approved
                                </p>
                            </CardContent>
                        </Card>

                        <Card
                            className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                            onClick={fetchTestsForModal}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Tests</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {overview.tests.passed} / {overview.tests.total}
                                </div>
                                <Badge className={`mt-2 ${getStatusColor(overview.tests.status)}`}>
                                    {overview.tests.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Software Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overview.softwareProgress.percentage}%</div>
                                <Progress value={overview.softwareProgress.percentage} className="mt-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                    {overview.softwareProgress.currentTopic}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Course & Batch Info */}
                    {/* If student has multiple enrollments, show all; otherwise show primary */}
                    {overview.allEnrollments && overview.allEnrollments.length > 0 ? (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Enrolled Courses &amp; Batches</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {overview.allEnrollments.map((enrollment: any) => (
                                    <Card key={enrollment.batchId}>
                                        <CardHeader>
                                            <CardTitle className="text-base">{enrollment.courseName}</CardTitle>
                                            <CardDescription>{enrollment.batchName} ({enrollment.batchCode})</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Timing</span>
                                                <span className="font-medium">{enrollment.timing}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Trainer</span>
                                                <span className="font-medium">{enrollment.trainer}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Course Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Course</p>
                                        <p className="font-medium">{overview.course.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Duration</p>
                                        <p className="font-medium">{overview.course.duration} months</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {overview.batch && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Batch Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Batch</p>
                                            <p className="font-medium">{overview.batch.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Timing</p>
                                            <p className="font-medium">{overview.batch.timing}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium">{overview.batch.trainer}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Rate My Trainer Widget */}
                    {overview.batch?.trainerId && (
                        <Card className="border-blue-100 bg-blue-50/30 overflow-hidden shadow-sm">
                            <CardHeader className="pb-3 border-b border-blue-100/50 bg-white/50">
                                <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
                                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                    Rate Your Trainer
                                </CardTitle>
                                <CardDescription>
                                    Your feedback for <span className="font-semibold text-blue-800">{overview.batch.trainer}</span> helps us improve.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {showRatingSuccess ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-green-600 animate-fade-in">
                                        <CheckCircle2 className="h-12 w-12 mb-3 text-green-500" />
                                        <p className="font-semibold text-lg">Thank You!</p>
                                        <p className="text-sm text-center mt-1 text-green-700/80">Your rating has been recorded for this month.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5 max-w-xl">
                                        <div>
                                            <div className="flex gap-2 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={`star-${star}`}
                                                        type="button"
                                                        className="focus:outline-none transition-transform hover:scale-110"
                                                        onMouseEnter={() => !hasRatedThisMonth && setHoverRating(star)}
                                                        onMouseLeave={() => !hasRatedThisMonth && setHoverRating(0)}
                                                        onClick={() => !hasRatedThisMonth && setMyRating(star)}
                                                        disabled={hasRatedThisMonth}
                                                    >
                                                        <Star
                                                            className={`h-10 w-10 ${(hoverRating || myRating) >= star
                                                                ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                                                                : 'text-slate-300'
                                                                } ${hasRatedThisMonth ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pr-2">
                                                <p className="text-sm font-medium text-slate-600">
                                                    {myRating === 0 ? 'Select a star rating' :
                                                        myRating === 1 ? 'Poor' :
                                                            myRating === 2 ? 'Fair' :
                                                                myRating === 3 ? 'Good' :
                                                                    myRating === 4 ? 'Very Good' : 'Excellent'}
                                                </p>
                                                {hasRatedThisMonth && (
                                                    <Button variant="ghost" size="sm" onClick={() => setHasRatedThisMonth(false)} className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100/50">
                                                        Change Rating
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {!hasRatedThisMonth && (
                                            <div className="animate-fade-in space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="rating-comment" className="text-sm font-medium text-slate-700">Additional Feedback (Optional)</Label>
                                                    <Textarea
                                                        id="rating-comment"
                                                        placeholder="What went well? What could be improved?"
                                                        value={ratingComment}
                                                        onChange={(e) => setRatingComment(e.target.value)}
                                                        className="resize-none border-slate-200 focus:border-blue-400 bg-white"
                                                        rows={3}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={() => handleSubmitRating(overview.batch!.trainerId!)}
                                                    disabled={myRating === 0 || ratingLoading}
                                                    className="w-full sm:w-auto mt-2 bg-blue-600 hover:bg-blue-700"
                                                >
                                                    {ratingLoading ? 'Submitting...' : (
                                                        <>
                                                            <Send className="w-4 h-4 mr-2" />
                                                            Submit Rating
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Notifications */}
                    {notifications.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Recent Notifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {notifications.slice(0, 5).map((notif) => (
                                        <div key={notif.id} className="flex items-start gap-2 p-2 rounded border">
                                            <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground">{notif.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ATTENDANCE TAB */}
                <TabsContent value="attendance" className="space-y-4">
                    {attendanceData ? (
                        <>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                                <div>
                                    <h3 className="text-lg font-bold">{overview.student.name}</h3>
                                    <p className="text-sm text-muted-foreground">Attendance Overview</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium">Overall Attendance</p>
                                        <p className={`text-2xl font-bold ${overview.attendance.percentage >= 75 ? 'text-green-600' :
                                            overview.attendance.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                            {overview.attendance.percentage}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Days</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{attendanceData.stats.total}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Present</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">{attendanceData.stats.present}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Late</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-yellow-600">{attendanceData.stats.late}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Absent</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">{attendanceData.stats.absent}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {attendanceData.alerts.length > 0 && (
                                <Card className="border-red-200 bg-red-50">
                                    <CardHeader>
                                        <CardTitle className="text-red-700">Alerts</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="list-disc list-inside space-y-1">
                                            {attendanceData.alerts.map((alert: string, idx: number) => (
                                                <li key={idx} className="text-red-700">{alert}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle>Attendance Records</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="date-filter" className="text-sm whitespace-nowrap">Filter Date:</Label>
                                        <Input
                                            id="date-filter"
                                            type="date"
                                            className="w-[150px]"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                        />
                                        <Button variant="outline" size="sm" onClick={() => setSelectedDate('')}>All</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 mt-4">
                                        {(() => {
                                            const filteredRecords = selectedDate
                                                ? attendanceData.records.filter((r: any) => new Date(r.date).toLocaleDateString('en-CA') === selectedDate)
                                                : attendanceData.records;

                                            if (filteredRecords.length === 0) {
                                                return <p className="text-center text-muted-foreground py-4">No records found for this date.</p>;
                                            }

                                            return filteredRecords.map((record: any) => (
                                                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                    <div>
                                                        <p className="font-semibold">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                        {record.remarks && <p className="text-xs text-muted-foreground mt-1">Remark: {record.remarks}</p>}
                                                    </div>
                                                    <Badge className={`px-3 py-1 ${record.status === 'PRESENT' ? 'bg-green-500 hover:bg-green-600' :
                                                        record.status === 'LATE' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'
                                                        }`}>
                                                        {record.status}
                                                    </Badge>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <p>Loading attendance data...</p>
                    )}
                </TabsContent>

                {/* PROGRESS TAB */}
                <TabsContent value="progress" className="space-y-4">
                    {progressData ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Software Progress</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">Overall Progress</span>
                                                <span className="text-sm font-bold">{progressData.software.progress}%</span>
                                            </div>
                                            <Progress value={progressData.software.progress} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Current Topic</p>
                                            <p className="font-medium">{progressData.software.currentTopic}</p>
                                        </div>
                                        {progressData.software.completedTopics.length > 0 && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">Completed Topics</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {progressData.software.completedTopics.map((topic: string, idx: number) => (
                                                        <Badge key={idx} variant="secondary">{topic}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <p>Loading progress data...</p>
                    )}
                </TabsContent>

                {/* PORTFOLIO TAB */}
                <TabsContent value="portfolio" className="space-y-4">
                    {portfolioData ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Tasks</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{portfolioData.stats.total}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Approved</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">{portfolioData.stats.approved}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Pending</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-yellow-600">{portfolioData.stats.pending}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Rejected</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">{portfolioData.stats.rejected}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Portfolio Tasks</CardTitle>
                                    <CardDescription>Upload your completed work for each task</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {portfolioData.tasks.map((task: any) => (
                                            <div key={task.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{task.title}</h4>
                                                        <p className="text-sm text-muted-foreground">{task.description}</p>
                                                    </div>
                                                    {task.submission ? (
                                                        <Badge className={
                                                            task.submission.status === 'APPROVED' ? 'bg-green-500' :
                                                                task.submission.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                                                        }>
                                                            {task.submission.status}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">Not Submitted</Badge>
                                                    )}
                                                </div>
                                                {task.submission && task.submission.remarks && (
                                                    <div className="mt-2 p-2 bg-muted rounded">
                                                        <p className="text-xs font-semibold">Trainer Feedback:</p>
                                                        <p className="text-sm">{task.submission.remarks}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <p>Loading portfolio data...</p>
                    )}
                </TabsContent>

                {/* TESTS TAB */}
                <TabsContent value="tests" className="space-y-4">
                    {testsData ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Tests</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{testsData.stats.total}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Passed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">{testsData.stats.passed}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Failed</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">{testsData.stats.failed}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {testsData.upcoming.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Upcoming Tests</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {testsData.upcoming.map((test: any) => (
                                                <div key={test.id} className="flex items-center justify-between p-2 border rounded">
                                                    <div>
                                                        <p className="font-medium">{test.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(test.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline">Upcoming</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle>Test Results</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {testsData.results.map((result: any) => (
                                            <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="font-semibold">{result.title}</p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>{new Date(result.date).toLocaleDateString()}</span>
                                                        {result.marksObtained !== null && (
                                                            <span>
                                                                Marks: {result.marksObtained} / {result.totalMarks}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge
                                                    className={`px-3 py-1 ${result.status === 'PASSED' ? 'bg-green-500 hover:bg-green-600' :
                                                        result.status === 'FAILED' ? 'bg-red-500 hover:bg-red-600' :
                                                            'bg-gray-400'
                                                        }`}
                                                >
                                                    {result.status}
                                                </Badge>
                                            </div>
                                        ))}
                                        {testsData.results.length === 0 && (
                                            <p className="text-center text-muted-foreground py-4">No test results found.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <p>Loading tests data...</p>
                    )}
                </TabsContent>

                {/* FEES TAB */}
                <TabsContent value="fees" className="space-y-4">
                    {feesData ? (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Fee</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">₹{feesData.total.toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Paid</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">₹{feesData.paid.toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Balance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">₹{feesData.balance.toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Fee Details</CardTitle>
                                    <CardDescription>Read-only view of your fee information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Admission Date</p>
                                            <p className="font-medium">{new Date(feesData.admissionDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-2">Payment Progress</p>
                                            <Progress value={(feesData.paid / feesData.total) * 100} />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {Math.round((feesData.paid / feesData.total) * 100)}% paid
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <p>Loading fees data...</p>
                    )}

                    {/* Sent Receipts Section */}
                    {feesData && (
                        <Card className="mt-6">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-bold">My Bills & Receipts</CardTitle>
                                        <CardDescription>Download your officially sent fee receipts.</CardDescription>
                                    </div>
                                    <div className="rounded-full p-2 bg-blue-50">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50 px-0">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="font-bold pl-4">Date</TableHead>
                                                <TableHead className="font-bold">Amount</TableHead>
                                                <TableHead className="font-bold">Details</TableHead>
                                                <TableHead className="text-right font-bold pr-4">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!feesData.sentReceipts || feesData.sentReceipts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                                                        No receipts sent yet. Once a receipt is sent by the Channel Partner, it will appear here.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                feesData.sentReceipts.map((req: any) => (
                                                    <TableRow key={req.id} className="hover:bg-muted/20 transition-colors">
                                                        <TableCell className="font-medium pl-4">
                                                            {new Date(req.sentAt || req.updatedAt).toLocaleDateString(undefined, {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-bold text-emerald-600">₹{req.amount.toLocaleString()}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                <Badge variant="outline" className="w-fit text-[10px] font-bold uppercase tracking-wider px-1.5 py-0">
                                                                    {req.paymentMode}
                                                                </Badge>
                                                                {req.transactionId && <span className="text-[10px] text-muted-foreground font-mono">{req.transactionId}</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-4">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                disabled={downloadingId === req.id}
                                                                onClick={() => handleDownloadReceipt(req)}
                                                            >
                                                                {downloadingId === req.id ? (
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                )}
                                                                Download
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Hidden Receipt Component for PDF generation */}
                    <div style={{ position: 'fixed', left: '-9999px', top: '0' }}>
                        {receiptData && (
                            <div id="fee-receipt-content" style={{ background: 'white' }}>
                                <FeeReceipt data={receiptData} />
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* PROFILE TAB */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Your profile details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Name</Label>
                                    <Input value={overview.student.name} disabled />
                                </div>
                                <div>
                                    <Label>Enrollment Number</Label>
                                    <Input value={overview.student.enrollmentNumber} disabled />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input value={overview.student.email} disabled />
                                </div>
                                <div>
                                    <Label>Phone</Label>
                                    <Input value={overview.student.phone || 'N/A'} disabled />
                                </div>
                                <div>
                                    <Label>Branch</Label>
                                    <Input value={overview.branch.name} disabled />
                                </div>
                                <div>
                                    <Label>Course</Label>
                                    <Input value={overview.course.name} disabled />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Tests Details Modal */}
            {showTestsModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTestsModal(false)}>
                    <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b">
                            <div>
                                <h2 className="text-lg font-bold">Test Schedule &amp; Results</h2>
                                <p className="text-sm text-muted-foreground">All tests assigned to your batch</p>
                            </div>
                            <button
                                onClick={() => setShowTestsModal(false)}
                                className="rounded-full p-1 hover:bg-muted transition"
                            >
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5">
                            {testsModalLoading ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                                    <Clock className="h-5 w-5 animate-spin" />
                                    Loading test details...
                                </div>
                            ) : testsModalData.length === 0 ? (
                                <p className="text-center text-muted-foreground py-12">No tests found for your batch yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {testsModalData.map((test: any, idx: number) => {
                                        const statusColor =
                                            test.status === 'PASSED' ? 'bg-green-500' :
                                                test.status === 'FAILED' ? 'bg-red-500' :
                                                    test.status === 'UPCOMING' ? 'bg-blue-500' :
                                                        test.status === 'MISSED' ? 'bg-orange-400' :
                                                            'bg-gray-400';
                                        return (
                                            <div key={test.id || idx} className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/40 transition-colors">
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold">{test.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(test.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </p>
                                                    {test.marksObtained !== null && test.marksObtained !== undefined && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Marks: {test.marksObtained} / {test.totalMarks} &nbsp;|&nbsp; Pass: {test.passMarks}
                                                        </p>
                                                    )}
                                                    {(test.status === 'UPCOMING') && (
                                                        <p className="text-xs text-blue-600 font-medium">Scheduled — prepare for this test</p>
                                                    )}
                                                </div>
                                                <Badge className={`${statusColor} text-white px-3`}>
                                                    {test.status}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
