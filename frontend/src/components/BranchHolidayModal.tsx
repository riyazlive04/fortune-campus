import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trainerAttendanceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BranchHolidayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BranchHolidayModal = ({ isOpen, onClose, onSuccess }: BranchHolidayModalProps) => {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState("HOLIDAY");
    const [remarks, setRemarks] = useState("");
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);

            await trainerAttendanceApi.markBulkAttendance({
                date,
                status,
                remarks,
            });

            toast({
                title: "Success",
                description: `Successfully marked ${status} for all trainers`,
            });
            onSuccess();
        } catch (error: any) {
            console.error("Failed to mark branch holiday", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to mark branch holiday",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Mark Branch Leave / Holiday</DialogTitle>
                        <DialogDescription>
                            This will apply the selected status to <strong>all active trainers</strong> in your branch for the specified date.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                                    <SelectItem value="LEAVE">Branch Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="remarks">Remarks / Reason</Label>
                            <Textarea
                                id="remarks"
                                placeholder="e.g. Public Holiday, Branch off..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply to All Trainers
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default BranchHolidayModal;
