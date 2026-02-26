import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trainersApi, ratingsApi, incentivesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Star, Info, Check } from "lucide-react";

interface AllocateIncentiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultTrainerId?: string | null;
}

const AllocateIncentiveModal = ({ isOpen, onClose, onSuccess, defaultTrainerId }: AllocateIncentiveModalProps) => {
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
    const [performanceData, setPerformanceData] = useState<any | null>(null);
    const [suggestedAmount, setSuggestedAmount] = useState<number | null>(null);
    const [multiplier, setMultiplier] = useState<number>(1);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchTrainers();
            if (defaultTrainerId) {
                setFormData(prev => ({ ...prev, trainerId: defaultTrainerId }));
                fetchPerformanceMetrics(defaultTrainerId);
            }
        } else {
            // Reset form when closed
            setFormData({
                trainerId: "",
                amount: "",
                type: "PERFORMANCE",
                description: "",
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
            });
            setPerformanceData(null);
            setSuggestedAmount(null);
            setMultiplier(1);
        }
    }, [isOpen, defaultTrainerId]);

    const fetchPerformanceMetrics = async (id: string) => {
        try {
            const res = await ratingsApi.getPerformanceMetrics(id);
            if (res.success) {
                setPerformanceData(res.data);
                calculateSuggestion(res.data.totalScore);
            }
        } catch (error) {
            console.error("Failed to fetch performance metrics", error);
        }
    };

    const calculateSuggestion = (score: number) => {
        let mult = 1;
        if (score >= 90) mult = 1.5;
        else if (score >= 80) mult = 1.25;
        else if (score >= 70) mult = 1.1;
        else if (score >= 60) mult = 1.0;
        else mult = 0.8;

        setMultiplier(mult);
        // Base performance incentive: 5000
        const base = 5000;
        setSuggestedAmount(Math.round(base * mult));
    };

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
        if (field === "trainerId" && value) {
            fetchPerformanceMetrics(value);
        }
    };

    const applySuggestion = () => {
        if (suggestedAmount) {
            setFormData(prev => ({
                ...prev,
                amount: suggestedAmount.toString(),
                description: `${prev.description}${prev.description ? '. ' : ''}Based on ${performanceData?.totalScore}/100 performance score (${multiplier}x multiplier).`.trim()
            }));
        }
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

                    {performanceData && formData.type === "PERFORMANCE" && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 animate-fade-in space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span>Total Score: {performanceData.totalScore}/100</span>
                                </div>
                                <div className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                                    {multiplier}x Multiplier
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] border-t border-slate-200 pt-2">
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Trainer Rating (15%):</span>
                                    <span className="font-semibold text-slate-800">{performanceData.metrics?.rating?.score.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Attendance (15%):</span>
                                    <span className="font-semibold text-slate-800">{performanceData.metrics?.attendance?.score.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Student Portfolio (35%):</span>
                                    <span className="font-semibold text-slate-800">{performanceData.metrics?.portfolio?.score.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>Student Tests (35%):</span>
                                    <span className="font-semibold text-slate-800">{performanceData.metrics?.tests?.score.toFixed(1)}%</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Info className="h-3.5 w-3.5" />
                                    <span>Suggested: ₹{suggestedAmount?.toLocaleString()}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={applySuggestion}
                                    className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    <Check className="h-3 w-3 mr-1" />
                                    Apply Multiplier
                                </Button>
                            </div>
                        </div>
                    )}

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
