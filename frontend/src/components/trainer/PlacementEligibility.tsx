
import { useState, useEffect } from "react";
import { trainerApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

interface PlacementEligibilityProps {
    batches: any[];
}

const PlacementEligibility = ({ batches }: PlacementEligibilityProps) => {
    const [selectedBatch, setSelectedBatch] = useState<string>(batches[0]?.id || "");
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const fetchStudents = async () => {
        if (!selectedBatch) return;
        try {
            setLoading(true);
            const res = await trainerApi.getBatchStudents(selectedBatch);
            if (res.success) {
                setStudents(res.data);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [selectedBatch]);

    const handleRunCheck = async () => {
        try {
            setLoading(true);
            const res = await trainerApi.checkEligibility(selectedBatch);
            if (res.success) {
                toast({
                    title: "Check Complete",
                    description: `Eligibility updated for ${res.data.updatedCount} students.`
                });
                fetchStudents();
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold">Placement Eligibility</h3>
                    <p className="text-sm text-muted-foreground">Automated checks based on attendance & portfolio.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-background border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <Button onClick={handleRunCheck} size="sm" className="gap-2" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Run Auto-Check
                    </Button>
                </div>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden">
                {students.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No students found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold">Student</th>
                                    <th className="px-6 py-4 text-left font-semibold">Eligibility Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">Criteria Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">Fee Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {students.map(student => {
                                    const isEligible = student.placementEligible;
                                    return (
                                        <tr key={student.id} className="hover:bg-muted/30">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{student.user.firstName} {student.user.lastName}</span>
                                                    <span className="text-xs text-muted-foreground">{student.enrollmentNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEligible ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Eligible
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
                                                        <XCircle className="w-3.5 h-3.5" /> Not Eligible
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className={student.certificateLocked ? "text-destructive" : "text-success"}>
                                                            {student.certificateLocked ? "• Certificate Locked" : "• Certificate Unlocked"}
                                                        </span>
                                                    </div>
                                                    {/* Attendance stat would go here if available in student object */}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.admission && (
                                                    <div className="text-xs">
                                                        <div className="font-medium">Total: ₹{student.admission.totalFees}</div>
                                                        <div className={student.admission.pendingFees > 0 ? "text-destructive" : "text-success"}>
                                                            Pending: ₹{student.admission.pendingFees}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button variant="ghost" size="sm" className="text-xs h-7">View Details</Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                    <p className="font-semibold mb-1">Eligibility Criteria:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                        <li>Minimum 75% attendance record.</li>
                        <li>All portfolio tasks submitted and approved (Certificate Unlocked).</li>
                        <li>No active backlogs (based on academic record).</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PlacementEligibility;
