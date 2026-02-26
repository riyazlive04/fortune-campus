import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
    IndianRupee
} from 'lucide-react';
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
import PageHeader from '@/components/PageHeader';
import StudentModal from '@/components/StudentModal';

const Fees = () => {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();
    const user = storage.getUser();
    const isCEO = user?.role === 'CEO';

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await studentsApi.getStudents({ limit: 100 });
            if (res.success) {
                setStudents(res.data.students || res.data);
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

    useEffect(() => {
        fetchStudents();
    }, []);

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
        if (balance > 0 && (student.admission?.feePaid ?? 0) > 0) return { label: 'Partial', class: 'bg-yellow-500', icon: <Clock className="h-4 w-4" /> };
        return { label: 'Pending', class: 'bg-red-500', icon: <AlertCircle className="h-4 w-4" /> };
    };

    const handleEditFee = (student: any) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
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
                            ₹{students.reduce((acc, s) => acc + (s.admission?.feeAmount || 0), 0).toLocaleString()}
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
                            ₹{students.reduce((acc, s) => acc + (s.admission?.feePaid || 0), 0).toLocaleString()}
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
                            ₹{students.reduce((acc, s) => acc + (s.admission?.feeBalance || 0), 0).toLocaleString()}
                        </h3>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-red-50 text-rose-600 border border-rose-100/50 mt-1">Pending payments</span>
                    </div>
                </div>
            </div>

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
                                            Loading records...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            No fee records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student) => {
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
                </CardContent>
            </Card>

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
        </div>
    );
};

export default Fees;
