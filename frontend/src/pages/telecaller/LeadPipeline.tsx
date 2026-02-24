import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Phone, Mail, Calendar, MessageSquare, RefreshCw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { leadsApi, branchesApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import LeadModal from "@/components/LeadModal";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    useDroppable,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PIPELINE_STATUSES = [
    { id: "NEW", label: "New", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { id: "CONTACTED", label: "Contacted", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
    { id: "INTERESTED", label: "Interested", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { id: "NEGOTIATING", label: "Negotiating", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    { id: "CONVERTED", label: "Converted", color: "bg-green-500/10 text-green-500 border-green-500/20" },
];

const SortableLeadCard = ({ lead, status, onEdit }: { lead: any; status: any; onEdit: (id: string) => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: lead.id,
        data: {
            type: 'lead',
            lead,
            status: lead.status
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanPhone = lead.phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.location.href = `tel:${lead.phone}`;
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group shadow-sm hover:shadow-md hover:border-primary/50 cursor-grab active:cursor-grabbing transition-all active:scale-[0.98]"
            onClick={() => onEdit(lead.id)}
        >
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm line-clamp-1">
                        {lead.firstName} {lead.lastName}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className={`text-[10px] py-0 px-1 ${status.color}`}>
                        {lead.interestedCourse || "General"}
                    </Badge>
                    {lead.source && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 bg-muted/50">
                            {lead.source}
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-muted/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{lead.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-end">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex -space-x-1.5">
                        <div className="h-5 w-5 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[8px] font-bold">
                            {lead.firstName[0]}
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
                            onClick={handleWhatsApp}
                            title="WhatsApp Lead"
                        >
                            <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-success/10 hover:text-success"
                            onClick={handleCall}
                            title="Call Lead"
                        >
                            <Phone className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const Lane = ({ id, label, count, loading, children }: any) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`w-80 flex flex-col gap-4 rounded-lg transition-colors pb-4 ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''}`}
        >
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-muted/50">
                        {loading ? "..." : count}
                    </Badge>
                </div>
            </div>
            {children}
        </div>
    );
};

const LeadPipeline = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
    const [activeId, setActiveId] = useState<string | null>(null);
    const { toast } = useToast();

    const user = storage.getUser();
    const isCEO = user?.role === "CEO";

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchBranches = async () => {
        if (!isCEO) return;
        try {
            const res = await branchesApi.getBranches();
            if (res.success && res.data?.branches) {
                setBranches(res.data.branches);
                // No need to set selectedBranchId to first branch, keep "all" as default
            }
        } catch (error) {
            console.error("Failed to fetch branches", error);
        }
    };

    const fetchLeads = async (showToast = false) => {
        try {
            setLoading(true);
            const params: any = { limit: 100 };

            // Explicitly set branchId from selector (CEO) or user state (Telecaller)
            const targetBranchId = isCEO ? selectedBranchId : user?.branchId;

            if (targetBranchId && targetBranchId !== "all") {
                params.branchId = targetBranchId;
            }

            // If telecaller, we might want to filter by assignedToId
            // However, the requested behavior seeems to be for the whole branch pipeline
            // but let's ensure we log it for debugging.
            console.log("Fetching leads with params:", params, "User Branch:", user?.branchId);
            const res = await leadsApi.getLeads(params);
            if (res.success && res.data?.leads) {
                setLeads(res.data.leads);
                if (showToast) {
                    toast({
                        title: "Pipeline Refreshed",
                        description: `Loaded ${res.data.leads.length} leads.`,
                    });
                }
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch leads for pipeline",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (isCEO || (user?.branchId)) {
            fetchLeads();
        }
    }, [selectedBranchId, user?.branchId]);

    const getLeadsByStatus = (status: string) => {
        return leads.filter(l => l.status === status);
    };

    const handleOpenModal = (id?: string) => {
        setSelectedLeadId(id || null);
        setModalOpen(true);
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const leadId = active.id;
        let newStatus = over.id;

        // If the drop target is an item, get its status from the data
        if (over.data.current?.type === 'lead') {
            newStatus = over.data.current.status;
        } else if (!PIPELINE_STATUSES.find(s => s.id === newStatus)) {
            // Check if dropped on a lane which might have status ID as its ID
            // If it's not a valid status, we don't know where it went
            return;
        }

        // Find the lead
        const lead = leads.find(l => l.id === leadId);
        if (!lead || lead.status === newStatus) return;

        // Optimistic update
        const previousLeads = [...leads];
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

        try {
            await leadsApi.updateLead(leadId, { status: newStatus });
            toast({
                title: "Status Updated",
                description: `${lead.firstName}'s status moved to ${PIPELINE_STATUSES.find(s => s.id === newStatus)?.label}`,
            });
        } catch (error: any) {
            setLeads(previousLeads);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "Could not update lead status",
            });
        }
    };

    const activeLead = activeId ? leads.find(l => l.id === activeId) : null;
    const activeStatus = activeLead ? PIPELINE_STATUSES.find(s => s.id === activeLead.status) : null;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50/50">
            <div className="p-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Lead Pipeline"
                    description="Drag and drop management of your sales funnel"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-muted-foreground/10">
                            <Badge variant="outline" className="h-5 px-1 bg-primary/10 text-primary border-primary/20">
                                {isCEO
                                    ? (selectedBranchId === "all" ? "All Branches" : branches.find(b => b.id === selectedBranchId)?.name || "Selected Branch")
                                    : (user?.branch?.name || "Local Branch")
                                }
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground">Active Pipeline</span>
                        </div>

                        {isCEO && (
                            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                <SelectTrigger className="w-[180px] h-9 bg-card">
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground mr-2">
                            Total: {leads.length} leads
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchLeads(true)}
                            disabled={loading}
                            className="h-9 gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto min-h-0 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/30">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="inline-flex gap-6 p-8 h-full min-w-full">
                        {PIPELINE_STATUSES.map(status => (
                            <Lane
                                key={status.id}
                                id={status.id}
                                label={status.label}
                                count={getLeadsByStatus(status.id).length}
                                loading={loading}
                            >
                                <SortableContext
                                    id={status.id}
                                    items={getLeadsByStatus(status.id).map(l => l.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin min-h-[200px]">
                                        {loading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <Card key={i} className="shadow-none border-dashed bg-muted/30">
                                                    <CardContent className="p-4 space-y-2">
                                                        <Skeleton className="h-4 w-3/4" />
                                                        <Skeleton className="h-3 w-1/2" />
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            getLeadsByStatus(status.id).map(lead => (
                                                <SortableLeadCard
                                                    key={lead.id}
                                                    lead={lead}
                                                    status={status}
                                                    onEdit={handleOpenModal}
                                                />
                                            ))
                                        )}

                                        {!loading && getLeadsByStatus(status.id).length === 0 && (
                                            <div className="h-24 flex items-center justify-center rounded-lg border-2 border-dashed border-muted/50 text-xs text-muted-foreground italic">
                                                No leads here
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </Lane>
                        ))}
                    </div>

                    <DragOverlay dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                                active: {
                                    opacity: '0.5',
                                },
                            },
                        }),
                    }}>
                        {activeLead ? (
                            <SortableLeadCard
                                lead={activeLead}
                                status={activeStatus}
                                onEdit={() => { }}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {modalOpen && (
                <LeadModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={fetchLeads}
                    leadId={selectedLeadId}
                    defaultBranchId={isCEO ? selectedBranchId : user?.branchId}
                />
            )}
        </div>
    );
};

export default LeadPipeline;
