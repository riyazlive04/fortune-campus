
import { useState, useEffect } from "react";
import { portfolioTasksApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, X, ExternalLink, MessageSquare } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

const PortfolioManager = () => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [remarks, setRemarks] = useState("");
    const { toast } = useToast();

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const res = await portfolioTasksApi.getPendingSubmissions();
            if (res.success) {
                setSubmissions(res.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch submissions",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await portfolioTasksApi.reviewSubmission(id, { status, remarks });
            if (res.success) {
                toast({
                    title: "Success",
                    description: `Submission ${status.toLowerCase()} successfully`,
                });
                setReviewingId(null);
                setRemarks("");
                fetchSubmissions();
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to review submission",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold">Portfolio Submissions</h3>
                <p className="text-sm text-muted-foreground">Review and approve student project work.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground bg-card border rounded-xl">Loading submissions...</div>
                ) : submissions.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground bg-card border rounded-xl">No pending submissions found.</div>
                ) : (
                    submissions.map((sub: any) => (
                        <div key={sub.id} className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <StatusBadge status="PENDING" variant="warning" />
                                        <span className="text-xs text-muted-foreground">Submitted {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-foreground mb-1">{sub.task.title}</h4>
                                    <p className="text-sm text-muted-foreground mb-3">{sub.task.description || "No description provided."}</p>

                                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold uppercase">Student</span>
                                            <span className="font-medium">{sub.student.user.firstName} {sub.student.user.lastName}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground font-semibold uppercase">Task ID</span>
                                            <span className="font-mono text-xs">{sub.task.id.split('-')[0]}</span>
                                        </div>
                                    </div>

                                    {sub.workUrl && (
                                        <a
                                            href={sub.workUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-semibold"
                                        >
                                            <ExternalLink className="w-4 h-4" /> View Sample Work
                                        </a>
                                    )}
                                </div>

                                <div className="md:w-72 flex flex-col gap-3">
                                    {reviewingId === sub.id ? (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <textarea
                                                className="w-full text-sm p-3 bg-muted border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                                placeholder="Add review remarks..."
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                rows={3}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="default"
                                                    className="flex-1 bg-success hover:bg-success/90"
                                                    onClick={() => handleReview(sub.id, 'APPROVED')}
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="flex-1"
                                                    onClick={() => handleReview(sub.id, 'REJECTED')}
                                                >
                                                    <X className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                className="w-full text-xs"
                                                onClick={() => { setReviewingId(null); setRemarks(""); }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                className="w-full flex items-center gap-2"
                                                onClick={() => setReviewingId(sub.id)}
                                            >
                                                <MessageSquare className="w-4 h-4" /> Review Submission
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PortfolioManager;
