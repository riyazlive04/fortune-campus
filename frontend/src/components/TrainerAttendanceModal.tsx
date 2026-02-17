
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

interface TrainerAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    trainer: {
        id: string;
        name: string;
    } | null;
}

const TrainerAttendanceModal = ({ isOpen, onClose, onSuccess, trainer }: TrainerAttendanceModalProps) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("PRESENT");
    const [remarks, setRemarks] = useState("");
    const [inTime, setInTime] = useState("");
    const [inPeriod, setInPeriod] = useState<"AM" | "PM">("AM");
    const [outTime, setOutTime] = useState("");
    const [outPeriod, setOutPeriod] = useState<"AM" | "PM">("AM");
    const { toast } = useToast();

    const convertTo24h = (timeStr: string, period: "AM" | "PM") => {
        if (!timeStr) return undefined;

        let hours: number;
        let minutes: number = 0;

        // More flexible parsing: H, HH, H:MM, HH:MM, HHMM
        const timeMatch = timeStr.trim().match(/^(\d{1,2})(?::?(\d{2}))?$/);

        if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        } else {
            return undefined;
        }

        if (hours < 1 || hours > 12) return undefined;
        if (minutes < 0 || minutes > 59) return undefined;

        let h24 = hours;
        if (period === "PM" && hours < 12) h24 += 12;
        if (period === "AM" && hours === 12) h24 = 0;

        return `${h24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trainer) return;

        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            const formattedIn = convertTo24h(inTime, inPeriod);
            const formattedOut = convertTo24h(outTime, outPeriod);

            if (inTime && !formattedIn) {
                throw new Error("Invalid In Time. Please use format like '9' or '09:30'.");
            }
            if (outTime && !formattedOut) {
                throw new Error("Invalid Out Time. Please use format like '5' or '17:30'.");
            }

            // Construct full ISO strings for times if provided
            const inTimeISO = formattedIn ? `${today}T${formattedIn}:00` : undefined;
            const outTimeISO = formattedOut ? `${today}T${formattedOut}:00` : undefined;

            await trainerAttendanceApi.markAttendance({
                trainerId: trainer.id,
                date: today,
                status,
                remarks,
                inTime: inTimeISO,
                outTime: outTimeISO
            });

            toast({
                title: "Success",
                description: `Attendance marked for ${trainer.name}`,
            });
            onSuccess();
        } catch (error: any) {
            console.error("Failed to mark attendance", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to mark attendance",
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
                        <DialogTitle>Mark Attendance</DialogTitle>
                        <DialogDescription>
                            Recording attendance for <strong>{trainer?.name}</strong> for today.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRESENT">Present</SelectItem>
                                    <SelectItem value="ABSENT">Absent</SelectItem>
                                    <SelectItem value="LATE">Late</SelectItem>
                                    <SelectItem value="HALFDAY">Half Day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>In Time</Label>
                                <div className="flex gap-1">
                                    <Input
                                        placeholder="09:00"
                                        value={inTime}
                                        onChange={(e) => setInTime(e.target.value)}
                                        className="h-10"
                                    />
                                    <div className="flex border rounded-md overflow-hidden h-10">
                                        <button
                                            type="button"
                                            onClick={() => setInPeriod("AM")}
                                            className={`px-3 text-xs font-bold transition-colors ${inPeriod === 'AM' ? 'bg-primary text-white' : 'bg-background hover:bg-muted'}`}
                                        >
                                            AM
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInPeriod("PM")}
                                            className={`px-3 text-xs font-bold transition-colors ${inPeriod === 'PM' ? 'bg-primary text-white' : 'bg-background hover:bg-muted'}`}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Out Time</Label>
                                <div className="flex gap-1">
                                    <Input
                                        placeholder="06:00"
                                        value={outTime}
                                        onChange={(e) => setOutTime(e.target.value)}
                                        className="h-10"
                                    />
                                    <div className="flex border rounded-md overflow-hidden h-10">
                                        <button
                                            type="button"
                                            onClick={() => setOutPeriod("AM")}
                                            className={`px-3 text-xs font-bold transition-colors ${outPeriod === 'AM' ? 'bg-primary text-white' : 'bg-background hover:bg-muted'}`}
                                        >
                                            AM
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setOutPeriod("PM")}
                                            className={`px-3 text-xs font-bold transition-colors ${outPeriod === 'PM' ? 'bg-primary text-white' : 'bg-background hover:bg-muted'}`}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea
                                id="remarks"
                                placeholder="Any additional notes..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Attendance
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default TrainerAttendanceModal;
