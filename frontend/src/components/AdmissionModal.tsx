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
import { admissionsApi, coursesApi, branchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface AdmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    admissionId?: string | null;
    initialData?: any;
    leadId?: string | null;
}

const AdmissionModal = ({ isOpen, onClose, onSuccess, admissionId, initialData, leadId }: AdmissionModalProps) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [approving, setApproving] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        courseId: "",
        branchId: "",
        batchName: "",
        feeAmount: "",
        status: "PENDING"
    });

    const isEditMode = !!admissionId;
    const [admissionData, setAdmissionData] = useState<any>(null);

    useEffect(() => {
        const fetchSupportData = async () => {
            try {
                const [coursesRes, branchesRes] = await Promise.all([
                    coursesApi.getCourses(),
                    branchesApi.getBranches()
                ]);
                setCourses(coursesRes.success ? (coursesRes.data.courses || coursesRes.data) : []);
                setBranches(branchesRes.success ? (branchesRes.data.branches || branchesRes.data) : []);
            } catch (error) {
                console.error("Failed to fetch support data", error);
            }
        };

        if (isOpen) {
            fetchSupportData();
            if (admissionId) {
                fetchAdmissionDetails(admissionId);
            } else if (initialData) {
                // Pre-fill from lead data
                setFormData({
                    firstName: initialData.firstName || "",
                    lastName: initialData.lastName || "",
                    email: initialData.email || "",
                    phone: initialData.phone || "",
                    dateOfBirth: "",
                    gender: "",
                    address: "",
                    courseId: initialData.courseId || "",
                    branchId: initialData.branchId || "",
                    batchName: "",
                    feeAmount: "",
                    status: "PENDING"
                });
            } else {
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    dateOfBirth: "",
                    gender: "",
                    address: "",
                    courseId: "",
                    branchId: "",
                    batchName: "",
                    feeAmount: "",
                    status: "PENDING"
                });
            }
        }
    }, [isOpen, admissionId, initialData]);

    const fetchAdmissionDetails = async (id: string) => {
        try {
            setFetching(true);
            const res = await admissionsApi.getAdmissionById(id);
            if (res.success) {
                const adm = res.data;
                setAdmissionData(adm);
                setFormData({
                    firstName: adm.firstName,
                    lastName: adm.lastName,
                    email: adm.email || "",
                    phone: adm.phone,
                    dateOfBirth: adm.dateOfBirth ? new Date(adm.dateOfBirth).toISOString().split('T')[0] : "",
                    gender: adm.gender || "",
                    address: adm.address || "",
                    courseId: adm.courseId,
                    branchId: adm.branchId,
                    batchName: adm.batchName || "",
                    feeAmount: adm.feeAmount.toString(),
                    status: adm.status
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch admission details",
            });
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...formData,
                feeAmount: Number(formData.feeAmount),
                leadId: leadId || undefined
            };

            if (isEditMode && admissionId) {
                await admissionsApi.updateAdmission(admissionId, payload);
                toast({ title: "Success", description: "Admission updated successfully" });
            } else {
                await admissionsApi.createAdmission(payload);
                toast({ title: "Success", description: "Admission created successfully" });
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save admission",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!admissionId) return;
        try {
            setApproving(true);
            const res = await admissionsApi.approveAdmission(admissionId);
            if (res.success) {
                toast({ title: "Approved", description: "Admission approved and student record created." });
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Approval failed",
            });
        } finally {
            setApproving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle>{isEditMode ? `Admission: ${formData.firstName}` : "New Admission"}</DialogTitle>
                        {isEditMode && <StatusBadge status={formData.status} variant={formData.status === 'APPROVED' ? 'success' : 'warning'} />}
                    </div>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="branchId">Branch</Label>
                                <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="courseId">Course</Label>
                                <Select value={formData.courseId} onValueChange={(v) => setFormData({ ...formData, courseId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                                    <SelectContent>
                                        {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="feeAmount">Fee Amount (Full)</Label>
                                <Input id="feeAmount" type="number" value={formData.feeAmount} onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="batchName">Recommended Batch</Label>
                                <Input id="batchName" value={formData.batchName} onChange={(e) => setFormData({ ...formData, batchName: e.target.value })} placeholder="e.g. Morning 10AM" />
                            </div>
                        </div>

                        <DialogFooter className="flex justify-between items-center pt-6">
                            <div className="flex gap-2">
                                {isEditMode && formData.status === 'PENDING' && (
                                    <Button type="button" variant="default" className="gap-2" onClick={handleApprove} disabled={approving}>
                                        {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                        Approve
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? "Save Changes" : "Submit Admission"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AdmissionModal;
