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
    AlertCircle
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
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{students.reduce((acc, s) => acc + (s.admission?.feeAmount || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Total revenue committed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ₹{students.reduce((acc, s) => acc + (s.admission?.feePaid || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Cash received</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ₹{students.reduce((acc, s) => acc + (s.admission?.feeBalance || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Pending payments</p>
                    </CardContent>
                </Card>
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
