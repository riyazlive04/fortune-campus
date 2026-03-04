import { useState, useEffect, useRef } from "react";
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
import { studentsApi, storage } from "@/lib/api";
import { useNavigate } from "react-router-dom";

// ─── sessionStorage: remember which pending request IDs the CEO dismissed ───
const SESSION_KEY = "fee_approval_dismissed_ids";

const getDismissedIds = (): Set<string> => {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? new Set(raw.split(",").filter(Boolean)) : new Set();
    } catch {
        return new Set();
    }
};

const addDismissedIds = (ids: string[]) => {
    try {
        const existing = getDismissedIds();
        ids.forEach((id) => existing.add(id));
        sessionStorage.setItem(SESSION_KEY, Array.from(existing).join(","));
    } catch { /* ignore */ }
};

const FeeApprovalModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const user = storage.getUser();
    const navigate = useNavigate();
    // Track the IDs currently shown so we can persist on dismiss
    const shownIdsRef = useRef<string[]>([]);

    useEffect(() => {
        if (user?.role !== "CEO") return;

        const checkPendingRequests = async () => {
            try {
                // ── Source of truth: the actual PENDING fee requests ──────────
                // This correctly returns empty when all have been approved/rejected.
                // Using notifications was wrong because they stay "unread" even after approval.
                const res = await studentsApi.getFeeRequests("PENDING", 1, 50);
                if (!res.success) return;

                const requests: any[] = res.data?.requests || [];
                const dismissedIds = getDismissedIds();

                // Only surface requests the CEO hasn't dismissed this session
                const visible = requests.filter((r: any) => !dismissedIds.has(r.id));

                if (visible.length === 0) {
                    // Nothing to show — close if open
                    setIsOpen(false);
                    setPendingRequests([]);
                    return;
                }

                // Only re-open if there are NEW ids not yet shown
                const currentShownIds = new Set(shownIdsRef.current);
                const hasNew = visible.some((r: any) => !currentShownIds.has(r.id));

                if (hasNew) {
                    shownIdsRef.current = visible.map((r: any) => r.id);
                    setPendingRequests(visible);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Failed to check pending fee requests:", error);
            }
        };

        checkPendingRequests();
        const interval = setInterval(checkPendingRequests, 60000);
        return () => clearInterval(interval);
    }, [user?.role]);

    const handleCheckLater = () => {
        addDismissedIds(shownIdsRef.current);
        setIsOpen(false);
    };

    const handleReviewAll = () => {
        addDismissedIds(shownIdsRef.current);
        setIsOpen(false);
        navigate("/fees?tab=pending");
    };

    if (pendingRequests.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCheckLater(); }}>
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
                            {pendingRequests.length} Pending
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground pt-1 pl-1">
                        The following fee payments are awaiting your approval.
                    </p>
                </DialogHeader>

                {/* Request List */}
                <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {pendingRequests.map((req) => (
                        <div
                            key={req.id}
                            className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/50 px-4 py-3 gap-3"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                    <IndianRupee className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                        {req.student?.user?.firstName} {req.student?.user?.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        by {req.requestedBy?.firstName} {req.requestedBy?.lastName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-bold text-primary">
                                    ₹{(req.amount || 0).toLocaleString()}
                                </span>
                                <Badge
                                    variant="outline"
                                    className={`text-xs ${req.paymentMode === "UPI"
                                            ? "border-blue-400 text-blue-600"
                                            : "border-green-400 text-green-600"
                                        }`}
                                >
                                    {req.paymentMode}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="flex sm:justify-between gap-2 pt-2">
                    <Button variant="ghost" onClick={handleCheckLater}>
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
