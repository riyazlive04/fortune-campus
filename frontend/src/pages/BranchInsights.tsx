
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { reportsApi, branchesApi, storage } from "@/lib/api";
import {
    Users, TrendingUp, AlertCircle, CheckCircle2,
    MapPin, IndianRupee, Share2, Calendar,
    Star, ClipboardCheck, Briefcase, Plus, Loader2, Bell
} from "lucide-react";

/**
 * Highly Resilient BranchInsights Dashboard
 * Includes session recovery logic and absolute defensive rendering.
 */
const BranchInsights = () => {
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [branchData, setBranchData] = useState<any>({
        admissions: [],
        feesPending: [],
        placementEligible: [],
        expenses: { expenses: [], totalAmount: 0 },
        eventPlans: []
    });
    const [sessionError, setSessionError] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                // Check session
                const user = storage.getUser();
                const effectiveBranchId = user?.branchId || user?.branch?.id;

                if (!effectiveBranchId && user?.role === 'CHANNEL_PARTNER') {
                    console.error("Session Incomplete: branchId missing");
                    setSessionError(true);
                }

                // Fetch branches (for context or switching if admin)
                const res = await branchesApi.getBranches().catch(() => ({ data: { branches: [] } }));
                const branchList = Array.isArray(res?.data) ? res.data : (res?.data?.branches || []);
                setBranches(branchList);

                // Set initial branch
                if (branchList.length > 0) {
                    setSelectedBranch(branchList[0].id);
                } else if (effectiveBranchId) {
                    setSelectedBranch(effectiveBranchId);
                }
            } catch (error) {
                console.error("Initialization failed", error);
            }
        };
        initializeDashboard();
    }, []);

    useEffect(() => {
        if (!selectedBranch) return;

        const fetchWorkflowData = async () => {
            try {
                setLoading(true);
                const [adm, fees, placement] = await Promise.all([
                    reportsApi.getDailyAdmissions(selectedBranch).catch(() => ({ data: [] })),
                    reportsApi.getFeesPending(selectedBranch).catch(() => ({ data: [] })),
                    reportsApi.getPlacementEligible(selectedBranch).catch(() => ({ data: [] })),
                ]);

                const now = new Date();
                const exp = (await reportsApi.getExpenses(selectedBranch, now.getMonth() + 1, now.getFullYear()).catch(() => ({ data: { expenses: [], totalAmount: 0 } })));

                setBranchData({
                    admissions: adm?.data || [],
                    feesPending: fees?.data || [],
                    placementEligible: placement?.data || [],
                    expenses: exp?.data || { expenses: [], totalAmount: 0 },
                    eventPlans: []
                });
            } catch (error: any) {
                console.error("Workflow fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkflowData();
    }, [selectedBranch]);

    if (sessionError) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center p-6">
                <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2">Session Incomplete</h1>
                <p className="text-muted-foreground max-w-md mb-6">
                    Your login session is missing branch information. Please sign out and sign in again to resolve this.
                </p>
                <Button onClick={() => { storage.clear(); window.location.href = '/login'; }}>
                    Sign Out & Re-login
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <PageHeader
                    title="Branch Performance"
                    description="Operational dashboard for branch heads."
                />

                <div className="flex items-center gap-2 bg-card border rounded-lg p-2 shadow-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="w-[200px] border-none focus:ring-0 shadow-none">
                            <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches.length > 0 ? (
                                branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))
                            ) : selectedBranch ? (
                                <SelectItem value={selectedBranch}>Current Branch</SelectItem>
                            ) : (
                                <SelectItem value="none" disabled>No branches available</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground italic">Synchronizing branch metrics...</p>
                </div>
            ) : !selectedBranch ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center h-64">
                        <MapPin className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Please select or assign a branch to view insights.</p>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="admissions" className="space-y-6">
                    <TabsList className="bg-muted/50 p-1">
                        <TabsTrigger value="admissions" className="gap-2"><Users className="h-4 w-4" /> Admissions</TabsTrigger>
                        <TabsTrigger value="fees" className="gap-2"><IndianRupee className="h-4 w-4" /> Fees</TabsTrigger>
                        <TabsTrigger value="operations" className="gap-2"><ClipboardCheck className="h-4 w-4" /> Operations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="admissions" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                                        Daily Admissions <CheckCircle2 className="h-4 w-4 text-primary" />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{branchData?.admissions?.length || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Verified enrollments today</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Enrollment History</CardTitle>
                                <CardDescription>Last 24 hours of admission activity.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="relative overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs bg-muted/50 border-y font-semibold text-muted-foreground">
                                            <tr>
                                                <th className="px-6 py-3">Student Name</th>
                                                <th className="px-6 py-3">Course</th>
                                                <th className="px-6 py-3">Fee Status</th>
                                                <th className="px-6 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {branchData?.admissions?.map((adm: any) => (
                                                <tr key={adm.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{adm.firstName} {adm.lastName}</td>
                                                    <td className="px-6 py-4">{adm.course?.name || '---'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${adm.feePaid >= adm.feeAmount ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {adm.feePaid >= adm.feeAmount ? 'Paid' : 'Partial'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                                            {adm.status}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!branchData?.admissions || branchData?.admissions.length === 0) && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                                        No admission records found for this period.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="fees" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Fee Recovery & Balances</CardTitle>
                                <CardDescription>Students with outstanding payments.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {branchData?.feesPending?.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                                                    <IndianRupee className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.firstName} {item.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{item.course?.name || 'General Course'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-destructive">₹{item.feeBalance || 0}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance Due</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!branchData?.feesPending || branchData?.feesPending.length === 0) && (
                                        <div className="p-12 text-center text-muted-foreground italic">
                                            Excellent! No pending fees for this branch.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="operations">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader><CardTitle>Branch Expenses (MTD)</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">₹{branchData?.expenses?.totalAmount || 0}</div>
                                    <div className="mt-4 space-y-2">
                                        {branchData?.expenses?.expenses?.slice(0, 5).map((exp: any) => (
                                            <div key={exp.id} className="flex justify-between text-sm py-1 border-b">
                                                <span className="text-muted-foreground">{exp.category}</span>
                                                <span>₹{exp.amount}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="flex flex-col justify-center items-center text-center p-6 border-dashed">
                                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                                <CardTitle className="text-lg">Event Planning</CardTitle>
                                <CardDescription className="mb-4">Schedule Industrial Visits or Seminars for this branch.</CardDescription>
                                <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Plan New Event</Button>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default BranchInsights;

