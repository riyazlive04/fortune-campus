import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trainersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AllocateIncentiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AllocateIncentiveModal = ({ isOpen, onClose, onSuccess }: AllocateIncentiveModalProps) => {
    const [loading, setLoading] = useState(false);
    const [trainers, setTrainers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        trainerId: "",
        amount: "",
        type: "PERFORMANCE",
        description: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    });
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchTrainers();
        }
    }, [isOpen]);

    const fetchTrainers = async () => {
        try {
            // Assuming we can fetch trainers for the current branch
            // We need to fetch all active trainers.
            const response = await trainersApi.getTrainers({ limit: 100, isActive: true });
            setTrainers(response.data?.trainers || []);
        } catch (error) {
            console.error("Failed to fetch trainers", error);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.trainerId || !formData.amount) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please fill in all required fields",
            });
            return;
        }

        try {
            setLoading(true);
            const selectedTrainer = trainers.find(t => t.id === formData.trainerId);
            if (!selectedTrainer) throw new Error("Selected trainer not found");

            // We need to pass userId for the incentive. 
            // The backend createIncentive expects userId. 
            // It also takes trainerId optionally.
            // So we should pass the trainer's userId as userId, and trainerId as trainerId.

            const payload = {
                userId: selectedTrainer.userId, // The User ID of the trainer
                trainerId: selectedTrainer.id,
                amount: Number(formData.amount),
                type: formData.type,
                description: formData.description,
                month: Number(formData.month),
                year: Number(formData.year),
                referenceType: "MANUAL_ALLOCATION"
            };

            // We need to import incentivesApi. 
            // I'll assume it's passed as a prop or imported in the parent, but here I'll standardise by expecting the submit handler to do it or importing it here.
            // Better to import it here.
            const { incentivesApi } = await import("@/lib/api");
            await incentivesApi.createIncentive(payload);

            toast({
                title: "Success",
                description: "Incentive allocated successfully",
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Allocation error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to allocate incentive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Allocate Incentive</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="trainer">Trainer</Label>
                        <Select
                            value={formData.trainerId}
                            onValueChange={(val) => handleChange("trainerId", val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Trainer" />
                            </SelectTrigger>
                            <SelectContent>
                                {trainers.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.user?.firstName} {t.user?.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={formData.amount}
                                onChange={(e) => handleChange("amount", e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => handleChange("type", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERFORMANCE">Performance</SelectItem>
                                    <SelectItem value="PLACEMENT">Placement</SelectItem>
                                    <SelectItem value="BONUS">Bonus</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Month</Label>
                            <Select
                                value={formData.month.toString()}
                                onValueChange={(val) => handleChange("month", Number(val))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <SelectItem key={m} value={m.toString()}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input
                                type="number"
                                value={formData.year}
                                onChange={(e) => handleChange("year", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Reason for incentive..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Allocating..." : "Allocate"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AllocateIncentiveModal;
