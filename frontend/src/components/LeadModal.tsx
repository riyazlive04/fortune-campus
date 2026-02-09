
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
import { leadsApi, coursesApi, branchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    leadId?: string | null; // If provided, we are in View/Edit mode
}

const LeadModal = ({ isOpen, onClose, onSuccess, leadId }: LeadModalProps) => {
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

    const isEditMode = !!leadId;

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
                    branchId: "",
                    notes: "",
                    followUpDate: "",
                });
            }
        }
    }, [isOpen, leadId]);

    const fetchLeadDetails = async (id: string) => {
        try {
            setFetching(true);
            const res = await leadsApi.getLeadById(id);
            const lead = res.data;

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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Lead" : "New Lead"}</DialogTitle>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="source">Source</Label>
                                <Select
                                    value={formData.source}
                                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Source" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New</SelectItem>
                                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                                        <SelectItem value="QUALIFIED">Qualified</SelectItem>
                                        <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                                        <SelectItem value="CONVERTED">Converted</SelectItem>
                                        <SelectItem value="LOST">Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="course">Interested Course</Label>
                                <Select
                                    value={formData.interestedCourse}
                                    onValueChange={(v) => setFormData({ ...formData, interestedCourse: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Course" />
                                    </SelectTrigger>
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
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="followUpDate">Next Follow-up</Label>
                            <Input
                                id="followUpDate"
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Add any additional context here..."
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? "Update Lead" : "Create Lead"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default LeadModal;
