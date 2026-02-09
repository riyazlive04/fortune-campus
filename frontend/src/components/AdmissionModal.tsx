
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
import { Loader2 } from "lucide-react";

interface AdmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    admissionId?: string | null;
}

const AdmissionModal = ({ isOpen, onClose, onSuccess, admissionId }: AdmissionModalProps) => {
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
        dateOfBirth: "",
        gender: "MALE",
        address: "",
        courseId: "",
        branchId: "",
        batchName: "",
        feeAmount: "",
    });

    const isEditMode = !!admissionId;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesData, branchesData] = await Promise.all([
                    coursesApi.getCourses(),
                    branchesApi.getBranches()
                ]);

                // Check for different response structures
                const validCourses = coursesData.data?.courses || coursesData.data || [];
                const validBranches = branchesData.data?.branches || branchesData.data || [];

                setCourses(Array.isArray(validCourses) ? validCourses : []);
                setBranches(Array.isArray(validBranches) ? validBranches : []);
            } catch (error) {
                console.error("Failed to fetch support data", error);
            }
        };

        if (isOpen) {
            fetchData();
            if (admissionId) {
                fetchAdmissionDetails(admissionId);
            } else {
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    dateOfBirth: "",
                    gender: "MALE",
                    address: "",
                    courseId: "",
                    branchId: "",
                    batchName: "",
                    feeAmount: "",
                });
            }
        }
    }, [isOpen, admissionId]);

    const fetchAdmissionDetails = async (id: string) => {
        try {
            setFetching(true);
            const res = await admissionsApi.getAdmissionById(id);
            const admission = res.data;

            if (admission) {
                setFormData({
                    firstName: admission.firstName,
                    lastName: admission.lastName,
                    email: admission.email || "",
                    phone: admission.phone,
                    dateOfBirth: admission.dateOfBirth ? new Date(admission.dateOfBirth).toISOString().split('T')[0] : "",
                    gender: admission.gender || "MALE",
                    address: admission.address || "",
                    courseId: admission.courseId,
                    branchId: admission.branchId,
                    batchName: admission.batchName || "",
                    feeAmount: admission.feeAmount.toString(),
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Admission" : "New Admission"}</DialogTitle>
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
                                    required
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
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input
                                    id="dob"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(v) => setFormData({ ...formData, gender: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="course">Course</Label>
                                <Select
                                    value={formData.courseId}
                                    onValueChange={(v) => setFormData({ ...formData, courseId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="batchName">Batch Name</Label>
                                <Input
                                    id="batchName"
                                    value={formData.batchName}
                                    onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                                    placeholder="e.g. FSD-JAN-2026"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="feeAmount">Total Fee Amount</Label>
                                <Input
                                    id="feeAmount"
                                    type="number"
                                    value={formData.feeAmount}
                                    onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode ? "Update Admission" : "Create Admission"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AdmissionModal;
