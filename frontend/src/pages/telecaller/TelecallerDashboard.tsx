import { useState, useEffect } from "react";
import {
    Users,
    PhoneCall,
    Calendar,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Clock,
    ExternalLink
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { leadsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const TelecallerDashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await leadsApi.getTelecallerStats();
            if (res.success) {
                setData(res.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch telecaller stats",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex h-96 items-center justify-center">Loading dashboard...</div>;
    }

    const stats = data?.stats || [];
    const totalLeads = stats.reduce((acc: number, s: any) => acc + s._count, 0);
    const convertedLeads = stats.find((s: any) => s.status === "CONVERTED")?._count || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Telecaller Dashboard"
                description="Daily overview of your lead pipeline and follow-ups"
            />

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Assigned</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total leads in your pipeline</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
                        <TrendingUp className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{convertedLeads}</div>
                        <div className="flex items-center mt-1">
                            <span className="text-xs text-muted-foreground mr-2">{conversionRate.toFixed(1)}% conversion</span>
                            <Progress value={conversionRate} className="h-1 flex-1" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Today's Tasks</CardTitle>
                        <Calendar className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.followUpsToday?.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Scheduled follow-ups for today</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-destructive/20 bg-destructive/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.followUpsOverdue?.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pending tasks from past dates</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Today's Follow-ups List */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Today's Follow-ups
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/leads">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.followUpsToday?.length > 0 ? (
                                data.followUpsToday.map((f: any) => (
                                    <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{f.lead?.firstName} {f.lead?.lastName}</span>
                                            <span className="text-xs text-muted-foreground">{f.type || 'CALL'} • {f.lead?.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{f.lead?.status}</Badge>
                                            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                                                <Link to={`/leads?id=${f.leadId}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-muted-foreground italic">
                                    No follow-ups scheduled for today.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recently Contacted / Quick Actions */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PhoneCall className="h-5 w-5 text-primary" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button className="h-20 flex flex-col gap-2" variant="outline" asChild>
                                <Link to="/leads">
                                    <Users className="h-5 w-5" />
                                    <span>My Leads</span>
                                </Link>
                            </Button>
                            <Button className="h-20 flex flex-col gap-2" variant="outline" asChild>
                                <Link to="/telecaller/pipeline">
                                    <TrendingUp className="h-5 w-5" />
                                    <span>Lead Pipeline</span>
                                </Link>
                            </Button>
                            <Button className="h-20 flex flex-col gap-2" variant="outline" onClick={() => {
                                const pendingCount = data?.followUpsToday?.length || 0;
                                toast({
                                    title: "Bulk Caller",
                                    description: pendingCount > 0
                                        ? `You have ${pendingCount} calls to make today. Starting with ${data.followUpsToday[0].lead?.firstName}...`
                                        : "No pending calls for today."
                                });
                            }}>
                                <PhoneCall className="h-5 w-5" />
                                <span>Bulk Caller</span>
                            </Button>
                            <Button className="h-20 flex flex-col gap-2" variant="outline" asChild>
                                <Link to="/telecaller/analytics">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span>Performance</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TelecallerDashboard;
