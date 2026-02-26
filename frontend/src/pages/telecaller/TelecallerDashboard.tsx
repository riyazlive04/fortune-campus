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
    RefreshCw,
    Phone
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

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className || "h-4 w-4 fill-current text-[#25D366]"} xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

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

    const handleWhatsApp = (phone: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleCall = (phone: string, e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = `tel:${phone}`;
    };

    const fetchStats = async (showToast = false) => {
        try {
            setLoading(true);
            const today = new Date();
            const localDate = today.getFullYear() + '-' +
                String(today.getMonth() + 1).padStart(2, '0') + '-' +
                String(today.getDate()).padStart(2, '0');

            const res = await leadsApi.getTelecallerStats(localDate);
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
            setModalData(data?.upcomingFollowUps || []);
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
                                        {isFollowUp ? `${item.type || 'CALL'} • ${new Date(item.scheduledDate).toLocaleDateString()} • ` : ''}
                                        {lead.phone}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={getBadgeColor(lead.status)}>
                                        {lead.status}
                                    </Badge>
                                    <div className="flex items-center gap-1 border-l pl-2 ml-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-green-50"
                                            onClick={(e) => handleWhatsApp(lead.phone, e)}
                                        >
                                            <WhatsAppIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-[#007AFF] hover:bg-blue-50"
                                            onClick={(e) => handleCall(lead.phone, e)}
                                        >
                                            <Phone className="h-4 w-4" />
                                        </Button>
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
            case "today": return "Upcoming Follow-ups";
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
                {/* Total Assigned */}
                <div
                    onClick={() => setModalType("total")}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer hover:border-blue-400/40"
                >
                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-blue-500" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-blue-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Total Assigned</p>
                        <div className="rounded-full p-2.5 bg-blue-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">{totalLeads}</h3>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-muted/50 text-muted-foreground border border-border/50 mt-1">Total leads in your pipeline</span>
                    </div>
                </div>

                {/* Converted */}
                <div
                    onClick={() => setModalType("converted")}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer hover:border-emerald-400/40"
                >
                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-emerald-500" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-emerald-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Converted</p>
                        <div className="rounded-full p-2.5 bg-emerald-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">{convertedLeads}</h3>
                        <div className="flex items-center mt-1 gap-2">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50">{conversionRate.toFixed(1)}% conversion</span>
                            <div className="h-1 flex-1 bg-emerald-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${conversionRate}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Call Follow-up */}
                <div
                    onClick={() => setModalType("today")}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer hover:border-violet-400/40"
                >
                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-violet-500" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-violet-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Next Call Follow-up</p>
                        <div className="rounded-full p-2.5 bg-violet-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                            <PhoneCall className="h-4 w-4 text-violet-600" />
                        </div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">{data?.upcomingFollowUps?.length || 0}</h3>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100/50 mt-1">Scheduled next follow-ups</span>
                    </div>
                </div>

                {/* Overdue */}
                <div
                    onClick={() => setModalType("overdue")}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer hover:border-rose-400/40"
                >
                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-rose-500" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-rose-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Overdue</p>
                        <div className="rounded-full p-2.5 bg-rose-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                            <AlertCircle className="h-4 w-4 text-rose-600" />
                        </div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">{data?.followUpsOverdue?.length || 0}</h3>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-50 text-rose-600 border border-rose-100/50 mt-1">Pending tasks from past dates</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Today's Follow-ups List */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Upcoming Follow-ups
                            </CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link to="/leads">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data?.upcomingFollowUps?.length > 0 ? (
                                data.upcomingFollowUps.slice(0, 5).map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {item.lead?.firstName?.[0] || 'L'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{item.lead?.firstName} {item.lead?.lastName}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(item.scheduledDate).toLocaleDateString()} • {item.type || 'CALL'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-green-50"
                                                onClick={(e) => handleWhatsApp(item.lead?.phone || '', e)}
                                                title="WhatsApp"
                                            >
                                                <WhatsAppIcon />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-[#007AFF] hover:bg-blue-50"
                                                onClick={(e) => handleCall(item.lead?.phone || '', e)}
                                                title="Call"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openLead(item.leadId)}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-muted-foreground italic">
                                    No follow-ups scheduled.
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
