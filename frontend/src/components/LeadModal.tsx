
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { leadsApi, coursesApi, branchesApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, History, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    leadId?: string | null; // If provided, we are in View/Edit mode
    defaultBranchId?: string; // Optional default for new leads
}

const LeadModal = ({ isOpen, onClose, onSuccess, leadId, defaultBranchId }: LeadModalProps) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        source: "WEBSITE",
        status: "NEW",
        interestedCourse: "",
        branchId: "",
        notes: "",
        followUpDate: "",
    });

    const [callLogs, setCallLogs] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("details");
    const [callData, setCallData] = useState({
        callStatus: "Connected",
        notes: "",
        nextFollowUpDate: "",
    });

    const isEditMode = !!leadId;
    const user = storage.getUser();
    const isTelecaller = user?.role === "TELECALLER";
    const isCEO = user?.role === "CEO";

    const fetchActivity = async (id: string) => {
        try {
            const [logsRes, historyRes] = await Promise.all([
                leadsApi.getCallLogs(id),
                leadsApi.getHistory(id)
            ]);
            if (logsRes.success) setCallLogs(logsRes.data);
            if (historyRes.success) setHistory(historyRes.data);
        } catch (error) {
            console.error("Failed to fetch activity", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesData, branchesData] = await Promise.all([
                    coursesApi.getCourses(),
                    branchesApi.getBranches()
                ]);

                // Use .success instead of .status for response validation
                setCourses(coursesData.success ? (coursesData.data.courses || coursesData.data) : []);
                setBranches(branchesData.success ? (branchesData.data.branches || branchesData.data) : []);
            } catch (error) {
                console.error("Failed to fetch support data", error);
            }
        };

        if (isOpen) {
            fetchData();
            if (leadId) {
                fetchLeadDetails(leadId);
                fetchActivity(leadId);
            } else {
                // Reset form for new lead
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    source: "WEBSITE",
                    status: "NEW",
                    interestedCourse: "",
                    branchId: defaultBranchId || (isTelecaller ? user?.branchId : ""),
                    notes: "",
                    followUpDate: "",
                });
                setCallLogs([]);
                setHistory([]);
                setActiveTab("details");
            }
        }
    }, [isOpen, leadId]);

    const fetchLeadDetails = async (id: string) => {
        try {
            setFetching(true);
            const res = await leadsApi.getLeadById(id);
            const lead = res.data?.lead || res.data;

            if (lead) {
                setFormData({
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email || "",
                    phone: lead.phone,
                    source: lead.source,
                    status: lead.status,
                    interestedCourse: lead.interestedCourse || "",
                    branchId: lead.branchId,
                    notes: lead.notes || "",
                    followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : "",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch lead details",
            });
        } finally {
            setFetching(false);
        }
    };

    const handleLogCall = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadId) return;
        try {
            setLoading(true);
            await leadsApi.logCall(leadId, callData);
            toast({ title: "Success", description: "Call logged successfully" });
            setCallData({ callStatus: "Connected", notes: "", nextFollowUpDate: "" });
            fetchActivity(leadId);
            onSuccess(); // Trigger refresh in parent (dashboard stats)
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleConvert = async () => {
        if (!leadId) return;
        try {
            setLoading(true);
            const course = courses.find(c => c.name === formData.interestedCourse);
            await leadsApi.convertLeadToAdmission(leadId, {
                courseId: course?.id || "",
                feeAmount: 0
            });
            toast({ title: "Success", description: "Lead converted successfully" });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEditMode && leadId) {
                await leadsApi.updateLead(leadId, formData);
                toast({ title: "Success", description: "Lead updated successfully" });
            } else {
                await leadsApi.createLead(formData);
                toast({ title: "Success", description: "Lead created successfully" });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save lead",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle>{isEditMode ? "Lead Console" : "New Lead"}</DialogTitle>
                        {isEditMode && formData.status !== 'CONVERTED' && (
                            <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleConvert} disabled={loading}>
                                <GraduationCap className="h-4 w-4" /> Convert
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="activity">Activity & Logs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="pt-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                            disabled={isEditMode && !isTelecaller}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            required
                                            disabled={isEditMode && !isTelecaller}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            disabled={isEditMode && !isTelecaller}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            disabled={isEditMode}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="source">Source</Label>
                                        <Select
                                            value={formData.source}
                                            onValueChange={(v) => setFormData({ ...formData, source: v })}
                                            disabled={isEditMode && !isTelecaller}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="WEBSITE">Website</SelectItem>
                                                <SelectItem value="PHONE">Phone</SelectItem>
                                                <SelectItem value="WALK_IN">Walk-in</SelectItem>
                                                <SelectItem value="REFERRAL">Referral</SelectItem>
                                                <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(v) => setFormData({ ...formData, status: v })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NEW">New</SelectItem>
                                                <SelectItem value="CONTACTED">Contacted</SelectItem>
                                                <SelectItem value="INTERESTED">Interested</SelectItem>
                                                <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                                                <SelectItem value="CALL_BACK_LATER">Call Back Later</SelectItem>
                                                <SelectItem value="DEMO_SCHEDULED">Demo Scheduled</SelectItem>
                                                <SelectItem value="READY_FOR_ADMISSION">Ready</SelectItem>
                                                <SelectItem value="CONVERTED">Converted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="course">Course</Label>
                                        <Select
                                            value={formData.interestedCourse}
                                            onValueChange={(v) => setFormData({ ...formData, interestedCourse: v })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
                                            <SelectContent>
                                                {courses.map((c) => (
                                                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="branch">Branch</Label>
                                        <Select
                                            value={formData.branchId}
                                            onValueChange={(v) => setFormData({ ...formData, branchId: v })}
                                            disabled={isEditMode && !isCEO}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                                            <SelectContent>
                                                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="followUpDate">Next Follow-up Date</Label>
                                        <Input
                                            id="followUpDate"
                                            type="date"
                                            className="h-8"
                                            value={formData.followUpDate}
                                            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isEditMode ? "Update Details" : "Create Lead"}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="activity" className="pt-4 space-y-6">
                            {/* Call Logging Form */}
                            {isEditMode && (
                                <form onSubmit={handleLogCall} className="bg-muted/30 p-4 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> Log New Call
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select value={callData.callStatus} onValueChange={(v) => setCallData({ ...callData, callStatus: v })}>
                                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Connected">Connected</SelectItem>
                                                <SelectItem value="Not Picked">Not Picked</SelectItem>
                                                <SelectItem value="Switched Off">Switched Off</SelectItem>
                                                <SelectItem value="Busy">Busy</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="date"
                                            className="h-8"
                                            value={callData.nextFollowUpDate}
                                            onChange={(e) => setCallData({ ...callData, nextFollowUpDate: e.target.value })}
                                        />
                                    </div>
                                    <Textarea
                                        placeholder="Call notes..."
                                        className="min-h-[60px] text-sm"
                                        value={callData.notes}
                                        onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
                                    />
                                    <Button type="submit" size="sm" className="w-full" disabled={loading}>
                                        Log Call Attempt
                                    </Button>
                                </form>
                            )}

                            {/* Activity Feed */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <History className="h-4 w-4" /> Activity History
                                </h4>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {callLogs.map((log: any) => (
                                        <div key={log.id} className="text-xs p-2 border rounded bg-card">
                                            <div className="flex justify-between font-medium">
                                                <span>{log.callStatus}</span>
                                                <span className="text-muted-foreground">{new Date(log.callDate).toLocaleString()}</span>
                                            </div>
                                            <p className="mt-1">{log.notes}</p>
                                        </div>
                                    ))}
                                    {history.map((h: any) => (
                                        <div key={h.id} className="text-[10px] p-2 border-l-2 border-primary bg-primary/5 text-muted-foreground italic">
                                            Status changed from {h.oldStatus || 'NONE'} to {h.newStatus} by {h.changedBy?.firstName}
                                        </div>
                                    ))}
                                    {callLogs.length === 0 && history.length === 0 && (
                                        <div className="text-center text-muted-foreground py-8 italic text-sm">
                                            No activity logged yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default LeadModal;
