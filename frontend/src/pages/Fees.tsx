import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { storage, studentsApi } from '@/lib/api';
import {
    DollarSign,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Eye,
    ArrowUpDown,
    Download,
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Wallet,
    TrendingDown,
    IndianRupee,
    Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import FeeReceipt from '@/components/FeeReceipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import PageHeader from '@/components/PageHeader';
import StudentModal from '@/components/StudentModal';

const Fees = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [studentMeta, setStudentMeta] = useState<any>(null);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [pendingMeta, setPendingMeta] = useState<any>(null);
    const [bills, setBills] = useState<any[]>([]);
    const [billsMeta, setBillsMeta] = useState<any>(null);
    const [feeStats, setFeeStats] = useState<any>(null);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'records');

    const [studentPage, setStudentPage] = useState(1);
    const [pendingPage, setPendingPage] = useState(1);
    const [billsPage, setBillsPage] = useState(1);

    const [searchTerm, setSearchTerm] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);
    const { toast } = useToast();
    const user = storage.getUser();
    const isCEO = user?.role === 'CEO';

    const fetchFeeStats = async () => {
        try {
            const res = await studentsApi.getFeeStats();
            if (res.success) {
                setFeeStats(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch fee stats", error);
        }
    };

    const fetchStudents = async (page = 1) => {
        try {
            setLoading(true);
            const res = await studentsApi.getStudents({
                page,
                limit: 10,
                search: searchTerm
            });
            if (res.success) {
                setStudents(res.data.students || []);
                setStudentMeta(res.data.meta);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch student fee records",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async (page = 1) => {
        try {
            setLoadingRequests(true);
            const res = await studentsApi.getFeeRequests('PENDING', page, 10);
            if (res.success) {
                setPendingRequests(res.data.requests);
                setPendingMeta(res.data.meta);
            }
        } catch (error) {
            console.error("Failed to fetch pending requests", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    const fetchBills = async (page = 1) => {
        try {
            setLoadingRequests(true);
            const res = await studentsApi.getFeeRequests('APPROVED', page, 10);
            if (res.success) {
                setBills(res.data.requests);
                setBillsMeta(res.data.meta);
            }
        } catch (error) {
            console.error("Failed to fetch bills", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        fetchFeeStats();
        fetchStudents(1);
        fetchRequests(1);
        fetchBills(1);
    }, [searchTerm]);

    // Use separate effects for page changes to avoid resetting to page 1 on search
    useEffect(() => {
        fetchStudents(studentPage);
    }, [studentPage]);

    useEffect(() => {
        fetchRequests(pendingPage);
    }, [pendingPage]);

    useEffect(() => {
        fetchBills(billsPage);
    }, [billsPage]);

    const filteredStudents = students.filter(s => {
        const studentName = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
        const matchesSearch =
            studentName.includes(searchTerm.toLowerCase()) ||
            s.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBranch = branchFilter === 'all' || s.branchId === branchFilter;

        return matchesSearch && matchesBranch;
    });

    const getFeeStatus = (student: any) => {
        const balance = student.admission?.feeBalance ?? 0;
        if (balance <= 0) return { label: 'Paid', class: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> };
        if (balance > 0 && (student.admission?.feePaid ?? 0) > 0) return { label: 'Partial', class: 'bg-yellow-500 text-black', icon: <Clock className="h-4 w-4" /> };
        return { label: 'Pending', class: 'bg-red-500', icon: <AlertCircle className="h-4 w-4" /> };
    };

    const handleEditFee = (student: any) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleApprove = async (id: string) => {
        try {
            await studentsApi.approveFeeRequest(id);
            toast({ title: "Success", description: "Fee request approved" });
            fetchRequests();
            fetchStudents();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    };

    const handleReject = async (id: string) => {
        try {
            await studentsApi.rejectFeeRequest(id);
            toast({ title: "Success", description: "Fee request rejected" });
            fetchRequests();
        } catch (err: any) {
            toast({ variant: "destructive", title: "Error", description: err.message });
        }
    };

    const handleDownloadReceipt = async (request: any) => {
        try {
            setDownloadingId(request.id);
            const res = await studentsApi.getFeeRequest(request.id);
            if (!res) throw new Error("Failed to fetch receipt details");

            const fullData = res;
            setReceiptData(fullData);

            setTimeout(async () => {
                const element = document.getElementById('fee-receipt-content');
                if (!element) return;

                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`Receipt_${fullData.student.enrollmentNumber}_${request.id.substring(0, 8)}.pdf`);

                setDownloadingId(null);
                setReceiptData(null);

                toast({
                    title: "Success",
                    description: "Receipt downloaded successfully",
                });
            }, 500);

        } catch (error) {
            console.error("Download Error:", error);
            setDownloadingId(null);
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: "Could not generate receipt PDF"
            });
        }
    };

    const handleSendToStudent = async (id: string) => {
        try {
            await studentsApi.sendFeeReceipt(id);
            toast({
                title: "Success",
                description: "Receipt sent to student dashboard successfully",
            });
            fetchRequests();
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Failed to send receipt to student",
            });
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Fee Management"
                description="Monitor and manage student fees, payments, and balances."
            />

            <div className="grid gap-4 md:grid-cols-3">
                {/* Total Receivables */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg group h-full flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-blue-500" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-blue-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Total Receivables</p>
                        <div className="rounded-full p-2.5 bg-blue-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                            <IndianRupee className="h-4 w-4 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">
                            ₹{feeStats?.totalReceivables?.toLocaleString() || '0'}
                        </h3>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-muted/50 text-muted-foreground border border-border/50 mt-1">Total revenue committed</span>
                    </div>
                </div>

                {/* Total Collected */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg group h-full flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-emerald-500" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-emerald-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Total Collected</p>
                        <div className="rounded-full p-2.5 bg-emerald-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                        </div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">
                            ₹{feeStats?.totalCollected?.toLocaleString() || '0'}
                        </h3>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 mt-1">Cash received</span>
                    </div>
                </div>

                {/* Outstanding Balance */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg group h-full flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-rose-500" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-rose-500" />
                    <div className="flex items-center justify-between relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Outstanding Balance</p>
                        <div className="rounded-full p-2.5 bg-rose-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                            <TrendingDown className="h-4 w-4 text-rose-600" />
                        </div>
                    </div>
                    <div className="mt-2 relative z-10">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">
                            ₹{feeStats?.outstandingBalance?.toLocaleString() || '0'}
                        </h3>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-50 text-rose-600 border border-rose-100/50 mt-1">Pending payments</span>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="records">Fee Records</TabsTrigger>
                    {isCEO && (
                        <TabsTrigger value="pending">
                            Pending Approvals {pendingRequests.length > 0 && <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>}
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="bills">Bills / Receipts</TabsTrigger>
                </TabsList>

                <TabsContent value="records">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <CardTitle>Fee Records</CardTitle>
                                    <CardDescription>Consolidated view of all student payment statuses.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search student or ID..."
                                            className="pl-9"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" size="icon">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>ID / Enrollment</TableHead>
                                            <TableHead>Total Fee</TableHead>
                                            <TableHead>Paid</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-10">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                                                    Loading records...
                                                </TableCell>
                                            </TableRow>
                                        ) : students.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-10">
                                                    No fee records found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            students.map((student) => {
                                                const status = getFeeStatus(student);
                                                return (
                                                    <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="font-medium">
                                                            {student.user?.firstName} {student.user?.lastName}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {student.enrollmentNumber}
                                                        </TableCell>
                                                        <TableCell>₹{(student.admission?.feeAmount || 0).toLocaleString()}</TableCell>
                                                        <TableCell className="text-green-600 font-medium">
                                                            ₹{(student.admission?.feePaid || 0).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-red-600 font-medium">
                                                            ₹{(student.admission?.feeBalance || 0).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={`flex items-center gap-1 w-fit ${status.class}`}>
                                                                {status.icon}
                                                                {status.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => handleEditFee(student)}>
                                                                        <Edit className="mr-2 h-4 w-4" /> Edit Fees
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem>
                                                                        <Eye className="mr-2 h-4 w-4" /> View Transactions
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {studentMeta && studentMeta.totalPages > 1 && (
                                <div className="flex items-center justify-end space-x-2 py-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                                        disabled={studentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm font-medium">
                                        Page {studentPage} of {studentMeta.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setStudentPage(p => Math.min(studentMeta.totalPages, p + 1))}
                                        disabled={studentPage === studentMeta.totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {isCEO && (
                    <TabsContent value="pending">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Fee Approvals</CardTitle>
                                <CardDescription>Review and approve fee payment declarations from Channel Partners.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Branch</TableHead>
                                                <TableHead>Mode/Txn</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Requested By</TableHead>
                                                {isCEO && <TableHead className="text-right">Actions</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loadingRequests ? (
                                                <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                            ) : pendingRequests.length === 0 ? (
                                                <TableRow><TableCell colSpan={7} className="text-center py-10">No pending requests.</TableCell></TableRow>
                                            ) : (
                                                pendingRequests.map(req => (
                                                    <TableRow key={req.id}>
                                                        <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                                        <TableCell>{req.student.user.firstName} {req.student.user.lastName}</TableCell>
                                                        <TableCell>{req.branch.name}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{req.paymentMode}</Badge>
                                                            {req.transactionId && <div className="text-xs text-muted-foreground mt-1">{req.transactionId}</div>}
                                                        </TableCell>
                                                        <TableCell className="font-bold text-blue-600">₹{(req.amount).toLocaleString()}</TableCell>
                                                        <TableCell>{req.requestedBy.firstName} {req.requestedBy.lastName}</TableCell>
                                                        {isCEO && (
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => handleApprove(req.id)}>Approve</Button>
                                                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleReject(req.id)}>Reject</Button>
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {pendingMeta && pendingMeta.totalPages > 1 && (
                                    <div className="flex items-center justify-end space-x-2 py-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                                            disabled={pendingPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <div className="text-sm font-medium">
                                            Page {pendingPage} of {pendingMeta.totalPages}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPendingPage(p => Math.min(pendingMeta.totalPages, p + 1))}
                                            disabled={pendingPage === pendingMeta.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="bills">
                    <Card>
                        <CardHeader>
                            <CardTitle>Approved Bills & Receipts</CardTitle>
                            <CardDescription>View all approved payment receipts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Branch</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Approved By</TableHead>
                                            <TableHead className="text-right">Receipt</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingRequests ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                        ) : bills.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-10">No bills generated yet.</TableCell></TableRow>
                                        ) : (
                                            bills.map(req => (
                                                <TableRow key={req.id}>
                                                    <TableCell>{new Date(req.updatedAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>{req.student.user.firstName} {req.student.user.lastName}</TableCell>
                                                    <TableCell>{req.branch.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{req.paymentMode}</Badge>
                                                        {req.transactionId && <div className="text-xs text-muted-foreground mt-1">{req.transactionId}</div>}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-emerald-600">₹{(req.amount).toLocaleString()}</TableCell>
                                                    <TableCell>{req.approvedBy?.firstName} {req.approvedBy?.lastName}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                disabled={downloadingId === req.id}
                                                                onClick={() => handleDownloadReceipt(req)}
                                                            >
                                                                {downloadingId === req.id ? (
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                )}
                                                                Download
                                                            </Button>

                                                            {!isCEO && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                                                    disabled={req.isSentToStudent}
                                                                    onClick={() => handleSendToStudent(req.id)}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    {req.isSentToStudent ? "Sent" : "Send Receipt"}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {billsMeta && billsMeta.totalPages > 1 && (
                                <div className="flex items-center justify-end space-x-2 py-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setBillsPage(p => Math.max(1, p - 1))}
                                        disabled={billsPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm font-medium">
                                        Page {billsPage} of {billsMeta.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setBillsPage(p => Math.min(billsMeta.totalPages, p + 1))}
                                        disabled={billsPage === billsMeta.totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {selectedStudent && (
                <StudentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    student={selectedStudent}
                    mode="fees"
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchStudents();
                    }}
                />
            )}

            {/* Hidden Receipt Component for PDF generation */}
            <div style={{ position: 'fixed', left: '-9999px', top: '0' }}>
                {receiptData && (
                    <div id="fee-receipt-content" style={{ background: 'white' }}>
                        <FeeReceipt data={receiptData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Fees;
