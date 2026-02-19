import { useState, useEffect } from "react";
import { Plus, Filter, Eye, Trash2, Copy, CheckCircle2, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { storage, coursesApi, API_BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import StudentModal from "@/components/StudentModal";
import TrainerModal from "@/components/TrainerModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, UserPlus, Users as UsersIcon, School } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  branchId?: string;
  isActive: boolean;
  createdAt: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  trainerProfile?: {
    specialization: string;
    experience: number;
  };
  studentProfile?: {
    courseId: string;
  };
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Course {
  id: string;
  name: string;
  isActive: boolean;
}

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<any | null>(null);
  const [selectedTrainerIdForEdit, setSelectedTrainerIdForEdit] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const currentUser = storage.getUser();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'CEO';

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    branchId: "",
    password: "",
    specialization: "",
    experience: "",
    courseId: "",
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setUsers(result.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setBranches(result.data.branches || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const result = await coursesApi.getCourses();
      if (result.success) {
        setCourses(result.data.courses || result.data || []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchCourses();
  }, []);

  // Auto-set branch for CHANNEL_PARTNER users creating users
  useEffect(() => {
    if (currentUser?.role === 'CHANNEL_PARTNER' && currentUser.branchId && !formData.branchId) {
      setFormData(prev => ({
        ...prev,
        branchId: currentUser.branchId || '',
      }));
    }
  }, [currentUser, formData.branchId]);

  const handleChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format");
      return false;
    }
    if (!formData.role) {
      setError("Role is required");
      return false;
    }
    if (formData.role !== 'ADMIN' && !formData.branchId) {
      setError("Branch is required for non-admin users");
      return false;
    }
    if (formData.role === 'STUDENT') {
      // Specialized fields moved to StudentModal
    }
    return true;
  };

  const handleEditUser = (user: User) => {
    if (user.role === 'STUDENT') {
      // Find the full student record if possible, or just pass basic info
      // For editing student, the StudentModal expects a student object with relations
      // The users list might not have all relations needed for StudentModal
      // But we can pass what we have
      setSelectedStudentForEdit(user);
      setIsStudentModalOpen(true);
      return;
    }

    if (user.role === 'TRAINER') {
      setSelectedTrainerIdForEdit(user.id);
      setIsTrainerModalOpen(true);
      return;
    }

    setEditMode(true);
    setEditingUserId(user.id);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      branchId: user.branchId || "",
      password: "", // Keep password empty for edit
      specialization: user.trainerProfile?.specialization || "",
      experience: user.trainerProfile?.experience?.toString() || "",
      courseId: user.studentProfile?.courseId || "",
    });
    setIsDialogOpen(true);
  };

  const handleCreateUser = (role: string) => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: role,
      branchId: currentUser?.branchId || "",
      password: "",
      specialization: "",
      experience: "",
      courseId: "",
    });

    if (role === 'STUDENT') {
      setIsStudentModalOpen(true);
    } else if (role === 'TRAINER') {
      setIsTrainerModalOpen(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = storage.getToken();

      // Prepare request body
      const body: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        isActive: true,
      };

      // For create mode, include all fields
      if (!editMode) {
        body.email = formData.email;
        body.role = formData.role;
        body.branchId = formData.branchId;
        if (formData.role === 'TRAINER') {
          body.specialization = formData.specialization;
          body.experience = formData.experience;
        }
        if (formData.role === 'STUDENT') {
          body.courseId = formData.courseId;
        }
      }
      // For edit mode, only include optional fields
      else {
        if (formData.branchId) body.branchId = formData.branchId;
        // Include password only if it's provided
        if (formData.password) body.password = formData.password;

        if (formData.role === 'TRAINER') {
          body.specialization = formData.specialization;
          body.experience = formData.experience;
        }
        if (formData.role === 'STUDENT') {
          body.courseId = formData.courseId;
        }
      }

      const url = editMode
        ? `${API_BASE_URL}/users/${editingUserId}`
        : `${API_BASE_URL}/users`;

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editMode ? body : formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }

      if (result.success && result.data) {
        if (editMode) {
          fetchUsers();
          handleCloseDialog();
          toast({
            title: "Success",
            description: "User updated successfully",
          });
        } else {
          setTempPassword(result.data.tempPassword);
          setPasswordCopied(false);
          // Refresh users list
          fetchUsers();
          // Reset form
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            role: "",
            branchId: "",
            password: "",
            specialization: "",
            experience: "",
            courseId: "",
          });

          toast({
            title: "Success",
            description: "User created successfully",
          });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setPasswordCopied(true);
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
      });
      setTimeout(() => setPasswordCopied(false), 3000);
    }
  };

  const handleToggleActive = async (user: User) => {
    const newStatus = !user.isActive;
    const action = newStatus ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} user`);

      toast({
        title: "Success",
        description: `User ${action}d successfully`,
      });
      fetchUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action} user`,
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTempPassword(null);
    setPasswordCopied(false);
    setError(null);
    setEditMode(false);
    setEditingUserId(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      branchId: "",
      password: "",
      specialization: "",
      experience: "",
      courseId: "",
    });
  };

  const roleVariant = (role: string): "success" | "warning" | "info" | "neutral" => {
    const map: Record<string, "success" | "warning" | "info" | "neutral"> = {
      ADMIN: "success",
      CHANNEL_PARTNER: "warning",
      TRAINER: "info",
      STUDENT: "neutral",
    };
    return map[role] || "neutral";
  };

  const columns = [
    { key: "name", label: "Name", render: (r: User) => <span className="font-medium">{r.firstName} {r.lastName}</span> },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone", render: (r: User) => r.phone || "-" },
    { key: "role", label: "Role", render: (r: User) => <StatusBadge status={r.role} variant={roleVariant(r.role)} /> },
    { key: "branch", label: "Branch", render: (r: User) => r.branch?.name || "-" },
    {
      key: "status", label: "Status", render: (r: User) => (
        <StatusBadge
          status={r.isActive ? "Active" : "Inactive"}
          variant={r.isActive ? "success" : "neutral"}
        />
      )
    },
    {
      key: "actions",
      label: "",
      render: (r: User) => (
        <div className="flex gap-2">
          {currentUser?.role === 'CEO' && (
            <Button variant="ghost" size="sm" onClick={() => handleEditUser(r)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {(isAdmin || currentUser?.role === 'CHANNEL_PARTNER') && (
            <Button
              variant="ghost"
              size="sm"
              className={r.isActive ? "text-destructive hover:text-destructive" : "text-green-600 hover:text-green-700"}
              onClick={() => handleToggleActive(r)}
              title={r.isActive ? "Deactivate user" : "Activate user"}
            >
              {r.isActive ? <Trash2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
        actions={
          (isAdmin || currentUser?.role === 'CHANNEL_PARTNER') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Create User <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
                <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => handleCreateUser('STUDENT')}>
                  <School className="mr-2 h-4 w-4 text-emerald-600" />
                  <span>New Student</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => handleCreateUser('TRAINER')}>
                  <UsersIcon className="mr-2 h-4 w-4 text-emerald-600" />
                  <span>New Trainer</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem className="cursor-pointer py-2.5" onClick={() => handleCreateUser('CHANNEL_PARTNER')}>
                    <UserPlus className="mr-2 h-4 w-4 text-emerald-600" />
                    <span>Channel Partner</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      <DataTable columns={columns} data={users} searchPlaceholder="Search users..." />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setSelectedStudentForEdit(null);
        }}
        onSuccess={fetchUsers}
        student={selectedStudentForEdit}
        initialData={formData}
      />

      <TrainerModal
        isOpen={isTrainerModalOpen}
        onClose={() => {
          setIsTrainerModalOpen(false);
          setSelectedTrainerIdForEdit(null);
        }}
        onSuccess={fetchUsers}
        trainerId={selectedTrainerIdForEdit}
        initialData={formData}
      />

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {editMode
                ? 'Update user information and optionally change password.'
                : 'Add a new user to the system. A temporary password will be generated.'}
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            // Show temporary password after successful creation
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  User created successfully! Share this temporary password with the user.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <div className="flex gap-2">
                  <Input
                    value={tempPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                  >
                    {passwordCopied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ This password will not be shown again. Make sure to save it.
                </p>
              </div>

              <DialogFooter>
                <Button onClick={handleCloseDialog}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            // Show create user form
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Name Group */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    disabled={submitting}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    disabled={submitting}
                    placeholder="Enter last name"
                    required
                  />
                </div>

                {/* Contact Group */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    disabled={submitting || editMode}
                    placeholder="example@company.com"
                    required
                  />
                  {editMode && (
                    <p className="text-[11px] text-muted-foreground italic">Email cannot be changed</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    disabled={submitting}
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>

                {/* Role & Password Group */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                    disabled={submitting || !isAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="CHANNEL_PARTNER">Channel Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editMode ? (
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password (Optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      disabled={submitting}
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-end pb-1 lg:pb-2">
                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md border border-dashed text-center w-full">
                      A temporary password will be shown after creation
                    </p>
                  </div>
                )}

                {/* Branch Selection - Span full if alone, but here we can pair it or keep it single */}
                {formData.role && formData.role !== 'ADMIN' && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="branchId">Branch *</Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={(value) => handleChange("branchId", value)}
                      disabled={submitting || currentUser?.role === 'CHANNEL_PARTNER'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentUser?.role === 'CHANNEL_PARTNER' && (
                      <p className="text-xs text-muted-foreground">
                        You can only create users in your branch
                      </p>
                    )}
                  </div>
                )}


              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editMode ? 'Update User' : 'Create User'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;

