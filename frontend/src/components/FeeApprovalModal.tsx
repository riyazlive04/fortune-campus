import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, IndianRupee, ArrowRight } from "lucide-react";
import { notificationsApi, storage } from "@/lib/api";
import { useNavigate } from "react-router-dom";

// Parse payment mode from notification message
const parseMode = (message: string): string => {
    const match = /via (CASH|UPI)/i.exec(message);
    return match ? match[1].toUpperCase() : "CASH";
};

// Parse amount from notification message
const parseAmount = (message: string): string => {
    const match = /₹([\d,]+)/.exec(message);
    return match ? `₹${match[1]}` : "";
};

// Parse student name from notification message
const parseStudent = (message: string): string => {
    const match = /for student (.+)\.?$/.exec(message);
    return match ? match[1].replace(/\.$/, "") : "";
};

// Parse channel partner name
const parsePartner = (message: string): string => {
    const match = /Channel Partner (.+?) has/.exec(message);
    return match ? match[1] : "Channel Partner";
};

const FeeApprovalModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingNotifications, setPendingNotifications] = useState<any[]>([]);
    const user = storage.getUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role !== "CEO") return;

        const checkPendingApprovals = async () => {
            try {
                const response = await notificationsApi.getNotifications({ limit: 50 });
                if (response.success) {
                    const notifications = response.data.notifications || [];
                    const feeNotifs = notifications.filter(
                        (n: any) => !n.isRead && n.title === "New Fee Approval Request"
                    );
                    if (feeNotifs.length > 0) {
                        setPendingNotifications(feeNotifs);
                        setIsOpen(true);
                    }
                }
            } catch (error) {
                console.error("Failed to check fee approvals:", error);
            }
        };

        checkPendingApprovals();
        const interval = setInterval(checkPendingApprovals, 60000);
        return () => clearInterval(interval);
    }, [user?.role]);

    const handleReviewAll = () => {
        setIsOpen(false);
        navigate("/fees?tab=pending");
    };

    if (pendingNotifications.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[480px] border-primary/20 bg-card/95 backdrop-blur-md">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-500/10">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                            </div>
                            <DialogTitle className="text-lg font-bold">Action Required</DialogTitle>
                        </div>
                        <Badge className="bg-amber-500 text-white text-sm px-2.5 py-0.5">
                            {pendingNotifications.length} Pending
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground pt-1 pl-1">
                        The following fee payments are awaiting your approval.
                    </p>
                </DialogHeader>

                {/* Notification List */}
                <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {pendingNotifications.map((notif, index) => {
                        const mode = parseMode(notif.message);
                        const amount = parseAmount(notif.message);
                        const student = parseStudent(notif.message);
                        const partner = parsePartner(notif.message);
                        return (
                            <div
                                key={notif.id}
                                className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/50 px-4 py-3 gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                        <IndianRupee className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{student}</p>
                                        <p className="text-xs text-muted-foreground truncate">by {partner}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-sm font-bold text-primary">{amount}</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${mode === "UPI" ? "border-blue-400 text-blue-600" : "border-green-400 text-green-600"}`}
                                    >
                                        {mode}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="flex sm:justify-between gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>
                        Check Later
                    </Button>
                    <Button onClick={handleReviewAll} className="gap-2">
                        Review All
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FeeApprovalModal;
