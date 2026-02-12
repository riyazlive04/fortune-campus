
import { useState, useEffect } from "react";
import { Users, GraduationCap, ClipboardCheck, LayoutDashboard, Database, CheckSquare, Award } from "lucide-react";
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
    const { toast } = useToast();
    const user = storage.getUser();

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
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainerStats();
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (!stats) return null;

    return (
        <div className="animate-fade-in">
            <PageHeader
                title={`Trainer Dashboard: ${user?.firstName} ${user?.lastName}`}
                description={`Managing ${stats.activeStudents} active students across ${stats.todayClasses} classes today.`}
            />

            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Active Students"
                    value={stats.activeStudents.toString()}
                    icon={Users}
                    accentColor="bg-primary"
                />
                <KPICard
                    title="Attendance (Today)"
                    value={`${stats.presentToday}/${stats.presentToday + stats.absentToday}`}
                    change={`${stats.absentToday} absent`}
                    changeType="negative"
                    icon={ClipboardCheck}
                    accentColor="bg-success"
                />
                <KPICard
                    title="Pending Portfolios"
                    value={stats.pendingPortfolios.toString()}
                    icon={LayoutDashboard}
                    accentColor="bg-warning"
                />
                <KPICard
                    title="Placement Eligible"
                    value={stats.eligibleForPlacement.toString()}
                    icon={Award}
                    accentColor="bg-purple-500"
                />
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-card border p-1 rounded-xl w-full justify-start overflow-x-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="progress">Student Progress</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="placement">Placement</TabsTrigger>
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
                                        <button className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90 transition-colors">
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
                                <button className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all">
                                    <ClipboardCheck className="mb-2 text-primary" />
                                    <span className="text-sm font-medium">Mark Attendance</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all">
                                    <LayoutDashboard className="mb-2 text-warning" />
                                    <span className="text-sm font-medium">Review Portfolio</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all">
                                    <GraduationCap className="mb-2 text-success" />
                                    <span className="text-sm font-medium">Add Test Score</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-4 bg-muted hover:bg-muted/80 rounded-lg border transition-all">
                                    <Users className="mb-2 text-purple-500" />
                                    <span className="text-sm font-medium">Student Help</span>
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
