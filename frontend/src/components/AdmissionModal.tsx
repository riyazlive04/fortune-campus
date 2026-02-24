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
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CheckCircle, XCircle, Copy, Check } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { admissionsApi, coursesApi, branchesApi, batchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
    const [batches, setBatches] = useState<any[]>([]);

    // New state for showing generated credentials
    const [credentials, setCredentials] = useState<{ username: string, password: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: undefined as Date | undefined,
        gender: "",
        address: "",
        courseId: "",
        branchId: "",
        batchName: "",
        feeAmount: "",
        feePaid: "",
        paymentPlan: "SINGLE",
        status: "NEW"
    });

    const isEditMode = !!admissionId;
    const [admissionData, setAdmissionData] = useState<any>(null);

    useEffect(() => {
        const fetchSupportData = async () => {
            try {
                const [coursesRes, branchesRes, batchesRes] = await Promise.all([
                    coursesApi.getCourses(),
                    branchesApi.getBranches(),
                    batchesApi.getBatches({ limit: 100 })
                ]);
                setCourses(coursesRes.success ? (coursesRes.data.courses || coursesRes.data) : []);
                setBranches(branchesRes.success ? (branchesRes.data.branches || branchesRes.data) : []);
                setBatches(batchesRes.success ? (batchesRes.data.batches || batchesRes.data) : []);
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
                    dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth) : undefined,
                    gender: "",
                    address: initialData.address || "",
                    courseId: initialData.courseId || "",
                    branchId: initialData.branchId || "",
                    batchName: "",
                    feeAmount: "",
                    feePaid: "",
                    paymentPlan: "SINGLE",
                    status: "NEW"
                });
            } else {
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    dateOfBirth: undefined,
                    gender: "",
                    address: "",
                    courseId: "",
                    branchId: "",
                    batchName: "",
                    feeAmount: "",
                    feePaid: "",
                    paymentPlan: "SINGLE",
                    status: "NEW"
                });
            }
        }
    }, [isOpen, admissionId, initialData]);

    const fetchAdmissionDetails = async (id: string) => {
        try {
            setFetching(true);
            const res = await admissionsApi.getAdmissionById(id);
            if (res.success) {
                const adm = res.data.admission || res.data;
                setAdmissionData(adm);
                setFormData({
                    firstName: adm.firstName,
                    lastName: adm.lastName,
                    email: adm.email || "",
                    phone: adm.phone,
                    dateOfBirth: adm.dateOfBirth ? new Date(adm.dateOfBirth) : undefined,
                    gender: adm.gender || "",
                    address: adm.address || "",
                    courseId: adm.courseId,
                    branchId: adm.branchId,
                    batchName: adm.batchName || "",
                    feeAmount: adm.feeAmount?.toString() || "",
                    feePaid: adm.feePaid?.toString() || "",
                    paymentPlan: adm.paymentPlan || "SINGLE",
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
                dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : undefined,
                feeAmount: Number(formData.feeAmount),
                feePaid: Number(formData.feePaid) || 0,
                paymentPlan: formData.paymentPlan,
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
                if (res.data?.credentials) {
                    setCredentials(res.data.credentials);
                } else {
                    onSuccess();
                    onClose();
                }
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

    const handleCloseCredentials = () => {
        setCredentials(null);
        setCopied(false);
        onSuccess();
        onClose();
    };

    const copyToClipboard = () => {
        if (credentials) {
            navigator.clipboard.writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open && !credentials) onClose();
            }}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <DialogTitle>{isEditMode ? `Admission: ${formData.firstName || 'undefined'}` : "New Admission"}</DialogTitle>
                            {isEditMode && <StatusBadge status={formData.status} variant={formData.status === 'CONVERTED' ? 'success' : formData.status === 'NEW' ? 'warning' : formData.status === 'CONTACTED' ? 'info' : 'danger'} />}
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
                                <div className="space-y-2 flex flex-col pt-1">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !formData.dateOfBirth && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.dateOfBirth}
                                                onSelect={(date) => setFormData({ ...formData, dateOfBirth: date })}
                                                initialFocus
                                                captionLayout="dropdown-buttons"
                                                fromYear={1950}
                                                toYear={2026}
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                                    <Label htmlFor="feeAmount">Total Fee</Label>
                                    <Input id="feeAmount" type="number" value={formData.feeAmount} onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="feePaid">Initial Paid Amount</Label>
                                    <Input id="feePaid" type="number" value={formData.feePaid} onChange={(e) => setFormData({ ...formData, feePaid: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="paymentPlan">Payment Plan</Label>
                                    <Select value={formData.paymentPlan} onValueChange={(v) => setFormData({ ...formData, paymentPlan: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SINGLE">Single Payment</SelectItem>
                                            <SelectItem value="INSTALLMENT">Installment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="batchName">Recommended Batch</Label>
                                    <Select value={formData.batchName} onValueChange={(v) => setFormData({ ...formData, batchName: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="text-muted-foreground italic">No Batch Decided</SelectItem>
                                            {batches
                                                .filter(b => (!formData.branchId || b.branchId === formData.branchId) && (!formData.courseId || b.courseId === formData.courseId))
                                                .map(b => (
                                                    <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Admission Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New</SelectItem>
                                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="DROPOUT">Dropout</SelectItem>
                                        <SelectItem value="CLOSED">Closed</SelectItem>
                                        {/* Status CONVERTED is hidden from manual selection because it should only be set by the conversion button */}
                                        {formData.status === 'CONVERTED' && <SelectItem value="CONVERTED">Converted</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter className="flex justify-between items-center pt-6">
                                <div className="flex gap-2">
                                    {isEditMode && formData.status !== 'CLOSED' && (
                                        <Button
                                            type="button"
                                            variant={formData.status === 'CONVERTED' ? "outline" : "default"}
                                            className="gap-2"
                                            onClick={handleApprove}
                                            disabled={approving}
                                        >
                                            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : formData.status === 'CONVERTED' ? <Copy className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                            {formData.status === 'CONVERTED' ? "View Credentials" : "Convert to Student"}
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

            <AlertDialog open={!!credentials} onOpenChange={(open) => {
                if (!open) handleCloseCredentials();
            }}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-success">
                            <CheckCircle className="h-5 w-5" />
                            Student Created Successfully
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Please copy and share these login credentials with the student. They will need this to access the portal.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {credentials && (
                        <div className="bg-muted p-4 rounded-md space-y-3 relative my-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={copyToClipboard}
                                title="Copy credentials"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                            <div className="grid grid-cols-[80px_1fr] gap-2 items-center text-sm">
                                <span className="text-muted-foreground font-medium">Username:</span>
                                <span className="font-mono bg-background px-2 py-1 rounded border overflow-x-auto whitespace-nowrap">{credentials.username}</span>

                                <span className="text-muted-foreground font-medium">Password:</span>
                                <span className="font-mono bg-background px-2 py-1 rounded border">{credentials.password}</span>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleCloseCredentials}>
                            Done
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AdmissionModal;
