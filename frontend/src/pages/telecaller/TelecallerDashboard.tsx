import { useState, useEffect } from "react";
import {
    Users,
    PhoneCall,
    Calendar,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Clock,
    ExternalLink,
    X,
    RefreshCw
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { leadsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import LeadModal from "@/components/LeadModal";

type ModalType = "total" | "converted" | "today" | "overdue" | null;

const TelecallerDashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [modalData, setModalData] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [leadModalOpen, setLeadModalOpen] = useState(false);
    const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
    const { toast } = useToast();

    const openLead = (id: string) => {
        setCurrentLeadId(id);
        setLeadModalOpen(true);
    };

    const fetchStats = async (showToast = false) => {
        try {
            setLoading(true);
            const res = await leadsApi.getTelecallerStats();
            if (res.success) {
                setData(res.data);
                if (showToast) {
                    toast({
                        title: "Dashboard Refreshed",
                        description: "Stats and follow-ups are up to date.",
                    });
                }
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

    const fetchModalData = async (type: ModalType) => {
        if (!type) return;

        if (type === "today") {
            setModalData(data?.followUpsToday || []);
            return;
        }
        if (type === "overdue") {
            setModalData(data?.followUpsOverdue || []);
            return;
        }

        try {
            setModalLoading(true);
            const params: any = { limit: 1000 };
            if (type === "converted") {
                params.status = "CONVERTED";
            }
            // For 'total', we just fetch leads (backend already filters by branch/user for telecallers in standard getLeads if we pass correct params, 
            // but for simplicity, we rely on the standard getLeads endpoint which applies branch filtering automatically for telecallers).

            const res = await leadsApi.getLeads(params);
            if (res.success) {
                setModalData(res.data.leads || []);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error fetching details",
                description: error.message,
            });
        } finally {
            setModalLoading(false);
        }
    };

    useEffect(() => {
        if (modalType) {
            fetchModalData(modalType);
        } else {
            setModalData([]);
        }
    }, [modalType]);

    if (loading) {
        return <div className="flex h-96 items-center justify-center">Loading dashboard...</div>;
    }

    const stats = data?.stats || [];
    const totalLeads = stats.reduce((acc: number, s: any) => acc + s._count, 0);
    const convertedLeads = stats.find((s: any) => s.status === "CONVERTED")?._count || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const getBadgeColor = (status: string) => {
        switch (status) {
            case "NEW": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "CONTACTED": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
            case "INTERESTED": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "NEGOTIATING": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case "CONVERTED": return "bg-green-500/10 text-green-500 border-green-500/20";
            default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
        }
    };

    const renderModalContent = () => {
        if (modalLoading) {
            return <div className="py-8 text-center text-muted-foreground">Loading details...</div>;
        }

        if (modalData.length === 0) {
            return <div className="py-8 text-center text-muted-foreground italic">No records found.</div>;
        }

        return (
            <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-3">
                    {modalData.map((item: any) => {
                        // Handle both Lead objects (from 'total'/'converted') and FollowUp objects (from 'today'/'overdue')
                        const lead = item.lead || item;
                        const isFollowUp = !!item.lead;

                        return (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-semibold">{lead.firstName} {lead.lastName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {isFollowUp ? `${item.type || 'CALL'} • ` : ''}
                                        {lead.phone}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getBadgeColor(lead.status)}>
                                        {lead.status}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                            setModalType(null); // Close the detail popup
                                            openLead(lead.id);
                                        }}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        );
    };

    const getModalTitle = () => {
        switch (modalType) {
            case "total": return "Total Assigned Leads";
            case "converted": return "Converted Leads";
            case "today": return "Today's Follow-ups";
            case "overdue": return "Overdue Follow-ups";
            default: return "Details";
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Telecaller Dashboard"
                description="Daily overview of your lead pipeline and follow-ups"
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchStats(true)}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                }
            />

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/50"
                    onClick={() => setModalType("total")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Assigned</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLeads}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total leads in your pipeline</p>
                    </CardContent>
                </Card>

                <Card
                    className="hover:shadow-md transition-shadow cursor-pointer hover:border-success/50"
                    onClick={() => setModalType("converted")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
                        <TrendingUp className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{convertedLeads}</div>
                        <div className="flex items-center mt-1">
                            <span className="text-xs text-muted-foreground mr-2">{conversionRate.toFixed(1)}% conversion</span>
                            <Progress value={conversionRate} className="h-1 flex-1 [&>div]:bg-success" />
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="hover:shadow-md transition-shadow border-primary/20 bg-primary/5 cursor-pointer hover:border-primary/50"
                    onClick={() => setModalType("today")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Today's Tasks</CardTitle>
                        <Calendar className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{data?.followUpsToday?.length || 0}</div>
                        <p className="text-xs text-primary/80 mt-1">Scheduled follow-ups for today</p>
                    </CardContent>
                </Card>

                <Card
                    className="hover:shadow-md transition-shadow border-destructive/20 bg-destructive/5 cursor-pointer hover:border-destructive/50"
                    onClick={() => setModalType("overdue")}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">Overdue</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{data?.followUpsOverdue?.length || 0}</div>
                        <p className="text-xs text-destructive/80 mt-1">Pending tasks from past dates</p>
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
                                            <Badge variant="outline" className={getBadgeColor(f.lead?.status)}>{f.lead?.status}</Badge>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openLead(f.leadId)}>
                                                <ExternalLink className="h-4 w-4" />
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
                                const todayFollowUps = data?.followUpsToday || [];
                                if (todayFollowUps.length > 0) {
                                    openLead(todayFollowUps[0].leadId);
                                    toast({
                                        title: "Bulk Caller Started",
                                        description: `Opening Lead Console for ${todayFollowUps[0].lead?.firstName}...`
                                    });
                                } else {
                                    toast({
                                        title: "Bulk Caller",
                                        description: "No pending calls for today."
                                    });
                                }
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

            <Dialog open={!!modalType} onOpenChange={(open) => !open && setModalType(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{getModalTitle()}</DialogTitle>
                    </DialogHeader>
                    {renderModalContent()}
                </DialogContent>
            </Dialog>

            <LeadModal
                isOpen={leadModalOpen}
                onClose={() => {
                    setLeadModalOpen(false);
                    setCurrentLeadId(null);
                }}
                onSuccess={() => {
                    fetchStats();
                    setLeadModalOpen(false);
                    setCurrentLeadId(null);
                }}
                leadId={currentLeadId}
            />
        </div>
    );
};

export default TelecallerDashboard;
