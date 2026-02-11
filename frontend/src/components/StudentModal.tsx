import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { studentsApi, coursesApi, branchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface StudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    student?: any | null;
}

const SOFTWARE_OPTIONS = [
    "Illustrator",
    "Photoshop",
    "Coreldraw",
    "Premiere Pro",
    "After Effects",
    "Visual Studio Code",
    "Github",
    "Figma",
    "Adobe XD",
    "Balsamiq",
    "Invision",
    "Gemini CAD",
    "Tally Erp9"
];

const StudentModal = ({ isOpen, onClose, onSuccess, student }: StudentModalProps) => {
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
    const { toast } = useToast();

    const isEditMode = !!student;

    const [formData, setFormData] = useState({
        // Personal Information
        firstName: "",
        lastName: "",
        dateOfJoining: "",
        dateOfBirth: "",
        gender: "",
        email: "",
        phone: "",
        parentPhone: "",
        address: "",

        // Academic Information
        courseId: "",
        branchId: "",
        qualification: "",
        leadSource: "",
        enrollmentNumber: "", // Auto-generated
        // selectedSoftware moved to separate state array

        // Identity & Compliance
        aadhaarNumber: "",
        panNumber: "",
        photo: null as File | null,

        // Fee Information
        totalFee: "",
        paymentPlan: "",
        initialPaid: "",
        // balanceAmount is calculated, not stored
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesData, branchesData] = await Promise.all([
                    coursesApi.getCourses(),
                    branchesApi.getBranches()
                ]);

                setCourses(coursesData.success ? (coursesData.data.courses || coursesData.data) : []);
                setBranches(branchesData.success ? (branchesData.data.branches || branchesData.data) : []);
            } catch (error) {
                console.error("Failed to fetch support data", error);
            }
        };

        if (isOpen) {
            fetchData();
            if (student) {
                // Edit mode - populate with existing student data
                setFormData({
                    firstName: student.user?.firstName || "",
                    lastName: student.user?.lastName || "",
                    dateOfJoining: student.dateOfJoining || "",
                    dateOfBirth: student.dateOfBirth || "",
                    gender: student.gender || "",
                    email: student.user?.email || "",
                    phone: student.user?.phone || "",
                    parentPhone: student.parentPhone || "",
                    address: student.address || "",
                    courseId: student.courseId || "",
                    branchId: student.branchId || "",
                    qualification: student.qualification || "",
                    leadSource: student.leadSource || "",
                    enrollmentNumber: student.enrollmentNumber || "",
                    aadhaarNumber: student.aadhaarNumber || "",
                    panNumber: student.panNumber || "",
                    photo: null,
                    totalFee: student.admission?.feeAmount?.toString() || "",
                    paymentPlan: student.admission?.paymentPlan || "",
                    initialPaid: student.admission?.feePaid?.toString() || "",
                });
                // Set selected software from student data
                const savedSoftware = student.selectedSoftware ? student.selectedSoftware.split(", ") : [];
                setSelectedSoftware(savedSoftware);
            } else {
                // Create mode - reset form
                setFormData({
                    firstName: "",
                    lastName: "",
                    dateOfJoining: "",
                    dateOfBirth: "",
                    gender: "",
                    email: "",
                    phone: "",
                    parentPhone: "",
                    address: "",
                    courseId: "",
                    branchId: "",
                    qualification: "",
                    leadSource: "",
                    enrollmentNumber: "",
                    aadhaarNumber: "",
                    panNumber: "",
                    photo: null,
                    totalFee: "",
                    paymentPlan: "",
                    initialPaid: "",
                });
                // Reset selected software
                setSelectedSoftware([]);
            }
        }
    }, [isOpen, student]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, photo: e.target.files![0] }));
        }
    };

    const handleSoftwareToggle = (software: string) => {
        setSelectedSoftware(prev => {
            if (prev.includes(software)) {
                return prev.filter(s => s !== software);
            } else {
                return [...prev, software];
            }
        });
    };

    const calculateBalance = () => {
        const total = parseFloat(formData.totalFee) || 0;
        const paid = parseFloat(formData.initialPaid) || 0;
        return total - paid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email ||
            !formData.phone || !formData.dateOfJoining || !formData.dateOfBirth ||
            !formData.gender || !formData.parentPhone || !formData.address ||
            !formData.courseId || !formData.branchId || selectedSoftware.length === 0 ||
            !formData.qualification || !formData.leadSource || !formData.aadhaarNumber ||
            !formData.totalFee || !formData.paymentPlan || !formData.initialPaid) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields marked with *",
            });
            return;
        }

        // Validate Aadhaar (12 digits)
        if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Aadhaar number must be exactly 12 digits",
            });
            return;
        }

        // Validate PAN if provided (format: ABCDE1234F)
        if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Invalid PAN number format",
            });
            return;
        }

        // Validate photo upload for new students
        if (!isEditMode && !formData.photo) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Photo upload is required",
            });
            return;
        }

        try {
            setLoading(true);

            if (isEditMode) {
                // Edit existing student
                const updateData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    dateOfJoining: formData.dateOfJoining,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    parentPhone: formData.parentPhone,
                    address: formData.address,
                    courseId: formData.courseId,
                    branchId: formData.branchId,
                    selectedSoftware: selectedSoftware.join(", "),
                    qualification: formData.qualification,
                    leadSource: formData.leadSource,
                    aadhaarNumber: formData.aadhaarNumber,
                    panNumber: formData.panNumber,
                };

                await studentsApi.updateStudent(student.id, updateData);
                toast({ title: "Success", description: "Student updated successfully" });
            } else {
                // Create new student
                const createData = {
                    // Personal Info
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    dateOfJoining: formData.dateOfJoining,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    parentPhone: formData.parentPhone,
                    address: formData.address,

                    // Academic Info
                    courseId: formData.courseId,
                    branchId: formData.branchId,
                    selectedSoftware: selectedSoftware.join(", "),
                    qualification: formData.qualification,
                    leadSource: formData.leadSource,

                    // Identity
                    aadhaarNumber: formData.aadhaarNumber,
                    panNumber: formData.panNumber,

                    // Fee Info
                    feeAmount: parseFloat(formData.totalFee),
                    feePaid: parseFloat(formData.initialPaid),
                    paymentPlan: formData.paymentPlan,
                };

                await studentsApi.createStudent(createData);
                toast({ title: "Success", description: "Student created successfully" });
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to save student",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Student" : "Add New Student"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Personal Information */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-primary">1. Personal Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => handleChange("firstName", e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => handleChange("lastName", e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                                <Input
                                    id="dateOfJoining"
                                    type="date"
                                    value={formData.dateOfJoining}
                                    onChange={(e) => handleChange("dateOfJoining", e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <Select
                                    value={formData.gender}
                                    onValueChange={(value) => handleChange("gender", value)}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    disabled={loading || isEditMode}
                                    required
                                />
                                {isEditMode && (
                                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange("phone", e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="parentPhone">Parent Phone *</Label>
                                <Input
                                    id="parentPhone"
                                    type="tel"
                                    value={formData.parentPhone}
                                    onChange={(e) => handleChange("parentPhone", e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address *</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => handleChange("address", e.target.value)}
                                disabled={loading}
                                rows={2}
                                required
                            />
                        </div>
                    </div>

                    {/* Section 2: Academic Information */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-primary">2. Academic Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="course">Course *</Label>
                                <Select
                                    value={formData.courseId}
                                    onValueChange={(value) => handleChange("courseId", value)}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.map(course => (
                                            <SelectItem key={course.id} value={course.id}>
                                                {course.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branch">Branch *</Label>
                                <Select
                                    value={formData.branchId}
                                    onValueChange={(value) => handleChange("branchId", value)}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label>Selected Software(s) *</Label>
                                <div className="grid grid-cols-3 gap-3 border rounded-lg p-4">
                                    {SOFTWARE_OPTIONS.map((software) => (
                                        <div key={software} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`software-${software}`}
                                                checked={selectedSoftware.includes(software)}
                                                onCheckedChange={() => handleSoftwareToggle(software)}
                                                disabled={loading}
                                            />
                                            <label
                                                htmlFor={`software-${software}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {software}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Select one or more software applications
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="qualification">Qualification *</Label>
                                <Select
                                    value={formData.qualification}
                                    onValueChange={(value) => handleChange("qualification", value)}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select qualification" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10TH">10th Standard</SelectItem>
                                        <SelectItem value="12TH">12th Standard</SelectItem>
                                        <SelectItem value="DIPLOMA">Diploma</SelectItem>
                                        <SelectItem value="BACHELORS">Bachelor's Degree</SelectItem>
                                        <SelectItem value="MASTERS">Master's Degree</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="leadSource">Lead Source *</Label>
                                <Select
                                    value={formData.leadSource}
                                    onValueChange={(value) => handleChange("leadSource", value)}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select lead source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WEBSITE">Website</SelectItem>
                                        <SelectItem value="PHONE">Phone Call</SelectItem>
                                        <SelectItem value="WALK_IN">Walk-in</SelectItem>
                                        <SelectItem value="REFERRAL">Referral</SelectItem>
                                        <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
                                        <SelectItem value="ADVERTISEMENT">Advertisement</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                                <Input
                                    id="enrollmentNumber"
                                    value={formData.enrollmentNumber || "Auto-generated"}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Auto-generated upon creation</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Identity & Compliance */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-primary">3. Identity & Compliance</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="aadhaarNumber">Aadhaar Number *</Label>
                                <Input
                                    id="aadhaarNumber"
                                    value={formData.aadhaarNumber}
                                    onChange={(e) => handleChange("aadhaarNumber", e.target.value)}
                                    disabled={loading}
                                    placeholder="12-digit Aadhaar number"
                                    maxLength={12}
                                    pattern="\d{12}"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Must be exactly 12 digits</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="panNumber">PAN Number (Optional)</Label>
                                <Input
                                    id="panNumber"
                                    value={formData.panNumber}
                                    onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase())}
                                    disabled={loading}
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                />
                                <p className="text-xs text-muted-foreground">Format: ABCDE1234F</p>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="photo">Photo Upload {!isEditMode && "*"}</Label>
                                <Input
                                    id="photo"
                                    type="file"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                    accept="image/*"
                                    required={!isEditMode}
                                />
                                <p className="text-xs text-muted-foreground">Upload a recent passport-size photo</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Fee Information */}
                    <div className="border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-primary">4. Fee Information</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="totalFee">Total Course Fee *</Label>
                                <Input
                                    id="totalFee"
                                    type="number"
                                    value={formData.totalFee}
                                    onChange={(e) => handleChange("totalFee", e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter total fee"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentPlan">Payment Plan *</Label>
                                <Select
                                    value={formData.paymentPlan}
                                    onValueChange={(value) => handleChange("paymentPlan", value)}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SINGLE">Single Payment</SelectItem>
                                        <SelectItem value="INSTALLMENT">Installment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="initialPaid">Initial Amount Paid *</Label>
                                <Input
                                    id="initialPaid"
                                    type="number"
                                    value={formData.initialPaid}
                                    onChange={(e) => handleChange("initialPaid", e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter amount paid"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="balanceAmount">Balance Amount</Label>
                                <Input
                                    id="balanceAmount"
                                    value={`₹ ${calculateBalance().toFixed(2)}`}
                                    disabled
                                    className="bg-muted font-semibold"
                                />
                                <p className="text-xs text-muted-foreground">Auto-calculated</p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? "Update Student" : "Add Student"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StudentModal;
