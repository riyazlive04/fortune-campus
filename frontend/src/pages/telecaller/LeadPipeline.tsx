import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Phone, Mail, Calendar, RefreshCw, Search, Filter } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { leadsApi, branchesApi, coursesApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import LeadModal from "@/components/LeadModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    { id: "DEMO_SCHEDULED", label: "Demo", color: "bg-teal-500/10 text-teal-500 border-teal-500/20" },
    { id: "CONVERTED", label: "Converted", color: "bg-green-500/10 text-green-500 border-green-500/20" },
];

const WhatsAppIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className || "h-4 w-4 fill-current text-[#25D366]"} xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

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
                    {lead.branch?.name && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 bg-primary/5 text-primary border-primary/20">
                            {lead.branch.name}
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
                            className="h-7 w-7 rounded-full hover:bg-green-50"
                            onClick={handleWhatsApp}
                            title="WhatsApp Lead"
                        >
                            <WhatsAppIcon className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-blue-50 text-[#007AFF]"
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
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
    const [selectedSource, setSelectedSource] = useState<string>("all");
    const [selectedCourse, setSelectedCourse] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
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
            }
        } catch (error) {
            console.error("Failed to fetch branches", error);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await coursesApi.getCourses();
            if (res.success && res.data?.courses) {
                setCourses(res.data.courses);
            } else if (res.success && Array.isArray(res.data)) {
                setCourses(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch courses", error);
        }
    };

    const fetchLeads = async (showToast = false) => {
        try {
            setLoading(true);
            const params: any = { limit: 100 };

            // Explicitly set branchId from selector or user state
            let targetBranchId: string | undefined = undefined;
            if (isCEO || user?.role === "TELECALLER") {
                targetBranchId = selectedBranchId;
            } else {
                targetBranchId = user?.branchId;
            }

            if (targetBranchId && targetBranchId !== "all") {
                params.branchId = targetBranchId;
            }

            if (selectedSource !== "all") {
                params.source = selectedSource;
            }

            if (searchTerm) {
                params.search = searchTerm;
            }

            // Interested course filter (if backend supports or handle locally)
            // For now, we'll pass it to backend and see
            if (selectedCourse !== "all") {
                params.interestedCourse = selectedCourse;
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
        fetchCourses();
    }, []);

    useEffect(() => {
        if (isCEO || user?.role === 'TELECALLER' || (user?.branchId)) {
            fetchLeads();
        }
    }, [selectedBranchId, selectedSource, selectedCourse, user?.branchId, user?.role]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isCEO || user?.role === 'TELECALLER' || (user?.branchId)) {
                fetchLeads();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

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
            <div className="p-6 pb-0">
                <PageHeader
                    title="Lead Pipeline"
                    description="Drag and drop management of your sales funnel"
                />

                <div className="bg-card border border-border/50 rounded-xl p-4 mt-6 mb-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {(isCEO || user?.role === 'TELECALLER') && (
                            <div className="space-y-1.5 flex-1 min-w-[200px]">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Branch</Label>
                                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                    <SelectTrigger className="rounded-lg h-9 bg-muted/20">
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>
                                        {(isCEO ? branches : (user?.assignedBranches || [])).map((b: any) => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5 flex-1 min-w-[150px]">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Source</Label>
                            <Select value={selectedSource} onValueChange={setSelectedSource}>
                                <SelectTrigger className="rounded-lg h-9 bg-muted/20">
                                    <SelectValue placeholder="Select Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    <SelectItem value="WEBSITE">Website</SelectItem>
                                    <SelectItem value="PHONE">Phone</SelectItem>
                                    <SelectItem value="WALK_IN">Walk-in</SelectItem>
                                    <SelectItem value="REFERRAL">Referral</SelectItem>
                                    <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                                    <SelectItem value="ADVERTISEMENT">Advertisement</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-[180px]">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Course</Label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                <SelectTrigger className="rounded-lg h-9 bg-muted/20">
                                    <SelectValue placeholder="Select Course" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses.map((course: any) => (
                                        <SelectItem key={course.id} value={course.name}>{course.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Search Leads</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Name, Email, Phone..."
                                    className="pl-9 h-9 rounded-lg bg-muted/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-lg"
                                title="Apply Filters"
                                onClick={() => fetchLeads(true)}
                                disabled={loading}
                            >
                                <Filter className={`h-4 w-4 ${loading ? 'opacity-50' : ''}`} />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 rounded-lg"
                                title="Refresh Pipeline"
                                onClick={() => fetchLeads(true)}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                className="h-9 rounded-lg gap-2"
                                onClick={() => handleOpenModal()}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">New Lead</span>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        {isCEO && selectedBranchId !== 'all' && (
                            <Badge variant="secondary" className="px-3 py-1 bg-primary/5 text-primary border-primary/10">
                                {branches.find(b => b.id === selectedBranchId)?.name}
                            </Badge>
                        )}
                        <Badge variant="secondary" className="px-3 py-1 bg-muted/50 text-muted-foreground">
                            Active Pipeline
                        </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Total: <span className="font-bold text-foreground">{leads.length} leads</span>
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
