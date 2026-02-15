
import { useState, useEffect } from "react";
import { Users, GraduationCap, ClipboardCheck, LayoutDashboard, Database, CheckSquare, Award, FileText, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import KPICard from "@/components/KPICard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trainerApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import AttendanceManager from "@/components/trainer/AttendanceManager";
import PortfolioManager from "@/components/trainer/PortfolioManager";
import TestsManager from "@/components/trainer/TestsManager";
import SoftwareProgressManager from "@/components/trainer/SoftwareProgressManager";
import PlacementEligibility from "@/components/trainer/PlacementEligibility";

// Placeholder components for tabs
const ProgressTab = () => <div className="p-4 bg-card border rounded-xl">Software Progress Tracker</div>;
const TestsTab = () => <div className="p-4 bg-card border rounded-xl">Test & Evaluation Management</div>;


const TrainerDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const { toast } = useToast();
    const user = storage.getUser();

    // Assuming these states and API are defined elsewhere or will be added
    const [reports, setReports] = useState<any>(null); // Added for the new useEffect
    const trainersApi = trainerApi; // Assuming trainerApi is used for reports as well

    const fetchTrainerStats = async () => {
        try {
            setLoading(true);
            const response = await trainerApi.getDashboardStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch trainer stats",
            });
        } finally {
            // setLoading(false); // This will be handled by the reports useEffect if it's the last one
        }
    };

    useEffect(() => {
        fetchTrainerStats();
    }, []);

    // New useEffect for fetching reports, as per instruction
    useEffect(() => {
        const fetchReports = async () => {
            console.log("Fetching Branch Reports...");
            try {
                const res = await trainerApi.getBranchReports();
                console.log("Branch Reports Response:", res);
                if (res.success) {
                    setReports(res.data);
                } else {
                    console.error("Failed to fetch reports:", res.message);
                }
            } catch (e) {
                console.error("Error fetching reports:", e);
            } finally {
                setLoading(false); // Set loading to false after reports are fetched
            }
        };
        fetchReports();
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (loading) return <DashboardSkeleton />;
    if (!stats) return <div className="p-8 text-center text-destructive">Failed to load dashboard data. Please try refreshing.</div>;

    return (
        <div className="animate-fade-in">
            <PageHeader
                title={`Trainer Dashboard: ${user?.firstName} ${user?.lastName}`}
                description={`Managing ${stats.activeStudents} active students across ${stats.todayClasses} classes today.`}
            />

            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div onClick={() => setActiveTab("overview")} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                    <KPICard
                        title="Active Students"
                        value={stats.activeStudents.toString()}
                        icon={Users}
                        accentColor="bg-primary"
                    />
                </div>
                <div onClick={() => setActiveTab("attendance")} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                    <KPICard
                        title="Attendance (Today)"
                        value={`${stats.presentToday}/${stats.presentToday + stats.absentToday}`}
                        change={`${stats.absentToday} absent`}
                        changeType="negative"
                        icon={ClipboardCheck}
                        accentColor="bg-success"
                    />
                </div>
                <div onClick={() => setActiveTab("portfolio")} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                    <KPICard
                        title="Pending Portfolios"
                        value={stats.pendingPortfolios.toString()}
                        icon={LayoutDashboard}
                        accentColor="bg-warning"
                    />
                </div>
                <div onClick={() => setActiveTab("placement")} className="cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                    <KPICard
                        title="Placement Eligible"
                        value={stats.eligibleForPlacement.toString()}
                        icon={Award}
                        accentColor="bg-purple-500"
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-card border p-1 rounded-xl w-full justify-start overflow-x-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>

                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="progress">Software Progress</TabsTrigger>
                    <TabsTrigger value="placement">Placement Eligibility</TabsTrigger>
                    <TabsTrigger value="reports">Branch Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card border rounded-xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Database className="w-5 h-5 text-primary" />
                                Today's Batches
                            </h3>
                            <div className="space-y-3">
                                {stats.classes?.map((c: any) => (
                                    <div key={c.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                                        <div>
                                            <p className="font-semibold">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">{c.startTime} - {c.endTime}</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab("attendance")}
                                            className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                                        >
                                            View Batch
                                        </button>
                                    </div>
                                ))}
                                {(!stats.classes || stats.classes.length === 0) && (
                                    <p className="text-sm text-center text-muted-foreground py-4">No batches scheduled for today.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border rounded-xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-success" />
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setActiveTab("attendance")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <ClipboardCheck className="mb-2 text-primary" />
                                    <span className="text-sm font-medium">Mark Attendance</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("portfolio")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <LayoutDashboard className="mb-2 text-warning" />
                                    <span className="text-sm font-medium">Review Portfolio</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("tests")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <GraduationCap className="mb-2 text-success" />
                                    <span className="text-sm font-medium">Add Test Score</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("progress")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <Users className="mb-2 text-purple-500" />
                                    <span className="text-sm font-medium">Student Help</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("reports")}
                                    className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all"
                                >
                                    <FileText className="mb-2 text-blue-500" />
                                    <span className="text-sm font-medium">View Reports</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="attendance"><AttendanceManager batches={stats.classes} /></TabsContent>
                <TabsContent value="progress"><SoftwareProgressManager batches={stats.classes} /></TabsContent>
                <TabsContent value="portfolio"><PortfolioManager /></TabsContent>
                <TabsContent value="tests"><TestsManager batches={stats.classes} /></TabsContent>
                <TabsContent value="placement"><PlacementEligibility batches={stats.classes} /></TabsContent>
            </Tabs>
        </div>
    );
};

export default TrainerDashboard;
