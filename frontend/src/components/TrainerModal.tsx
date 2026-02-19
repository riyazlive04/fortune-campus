
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
import { trainersApi, branchesApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";

interface TrainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    trainerId?: string | null;
    readonly?: boolean;
    initialData?: any;
}

const TrainerModal = ({ isOpen, onClose, onSuccess, trainerId, readonly = false, initialData }: TrainerModalProps) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const { toast } = useToast();
    const user = storage.getUser();
    const isChannelPartner = user?.role === 'CHANNEL_PARTNER';
    const isAdmin = user?.role === 'CEO' || user?.role === 'ADMIN';

    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        employeeId: "",
        specialization: "",
        experience: "",
        qualification: "",
        branchId: "",
        isActive: true,
    });

    const isEditMode = !!trainerId;

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await branchesApi.getBranches();
                const fetchedBranches = response.data?.branches || response.data || [];
                setBranches(Array.isArray(fetchedBranches) ? fetchedBranches : []);
            } catch (error) {
                console.error("Failed to fetch branches", error);
            }
        };

        if (isOpen) {
            fetchBranches();
        }
    }, [isOpen, isAdmin]);

    useEffect(() => {
        const fetchTrainerDetails = async (id: string) => {
            try {
                setFetching(true);
                const res = await trainersApi.getTrainerById(id);
                const trainer = res.data || res;

                if (trainer) {
                    setFormData({
                        firstName: trainer.user?.firstName || "",
                        lastName: trainer.user?.lastName || "",
                        email: trainer.user?.email || "",
                        phone: trainer.user?.phone || "",
                        employeeId: trainer.employeeId || "",
                        specialization: trainer.specialization || "",
                        experience: trainer.experience?.toString() || "",
                        qualification: trainer.qualification || "",
                        branchId: trainer.branchId,
                        isActive: trainer.isActive,
                    });
                }
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch trainer details",
                });
                onClose();
            } finally {
                setFetching(false);
            }
        };

        if (isOpen) {
            if (trainerId) {
                fetchTrainerDetails(trainerId);
            } else {
                setFormData({
                    firstName: initialData?.firstName || "",
                    lastName: initialData?.lastName || "",
                    email: initialData?.email || "",
                    phone: initialData?.phone || "",
                    employeeId: "",
                    specialization: initialData?.specialization || "",
                    experience: initialData?.experience || "",
                    qualification: "",
                    branchId: user?.branchId || initialData?.branchId || "",
                    isActive: true,
                });
            }
        }
    }, [isOpen, trainerId, user?.branchId, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...formData,
                experience: Number(formData.experience),
            };

            if (isEditMode && trainerId) {
                await trainersApi.updateTrainer(trainerId, payload);
                toast({ title: "Success", description: "Trainer updated successfully" });
            } else {
                const res = await trainersApi.createTrainer(payload);
                const responseData = res.data || res;

                if (responseData.tempPassword) {
                    setTempPassword(responseData.tempPassword);
                    setShowPasswordDialog(true);
                    onSuccess();
                    setLoading(false);
                    return;
                }

                toast({ title: "Success", description: "Trainer created successfully" });
            }

            if (!showPasswordDialog) {
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save trainer",
            });
        } finally {
            setLoading(false);
        }
    };

    if (showPasswordDialog && tempPassword) {
        return (
            <Dialog open={showPasswordDialog} onOpenChange={(open) => {
                if (!open) {
                    setShowPasswordDialog(false);
                    onClose();
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Trainer Created Successfully</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-lg text-center space-y-2">
                            <Label>Temporary Password</Label>
                            <div className="text-2xl font-bold tracking-wider text-primary">
                                {tempPassword}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Please share this password with the trainer immediately.
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => {
                                navigator.clipboard.writeText(tempPassword);
                                toast({ title: "Copied", description: "Password copied to clipboard" });
                            }}
                        >
                            <Copy className="mr-2 h-4 w-4" /> Copy Password
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => {
                            setShowPasswordDialog(false);
                            onClose();
                        }}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? (readonly ? "Trainer Details" : "Edit Trainer") : "New Trainer"}</DialogTitle>
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
                                    disabled={readonly || isEditMode}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    disabled={readonly || isEditMode}
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
                                    disabled={readonly || isEditMode}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    disabled={readonly || isEditMode}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="employeeId">Employee ID</Label>
                                <Input
                                    id="employeeId"
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                    disabled={readonly || isEditMode}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="qualification">Qualification</Label>
                                <Input
                                    id="qualification"
                                    value={formData.qualification}
                                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                    required
                                    disabled={readonly}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input
                                id="specialization"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                placeholder="e.g. Full Stack, Data Science"
                                required
                                disabled={readonly}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="experience">Experience (Years)</Label>
                                <Input
                                    id="experience"
                                    type="number"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    required
                                    disabled={readonly}
                                />
                            </div>
                            {((isAdmin || !isChannelPartner) && branches.length > 0) && (
                                <div className="space-y-2">
                                    <Label htmlFor="branch">Branch</Label>
                                    <Select
                                        value={formData.branchId}
                                        onValueChange={(v) => setFormData({ ...formData, branchId: v })}
                                        disabled={readonly || isEditMode}
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
                            )}
                            {isChannelPartner && (
                                <div className="space-y-2">
                                    <Label htmlFor="branch">Branch</Label>
                                    <Input
                                        value={branches.find(b => b.id === user?.branchId)?.name || "My Branch"}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                {readonly ? "Close" : "Cancel"}
                            </Button>
                            {!readonly && (
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? "Update Trainer" : "Create Trainer"}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );

};

export default TrainerModal;
