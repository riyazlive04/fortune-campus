import { useState, useEffect } from "react";
import { Plus, Filter, Eye, Trash2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

const Users = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  const currentUser = storage.getUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    branchId: "",
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

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  // Auto-set branch for BRANCH_HEAD users creating users
  useEffect(() => {
    if (currentUser?.role === 'BRANCH_HEAD' && currentUser.branchId && !formData.branchId) {
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
    return true;
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
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }

      if (result.success && result.data) {
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
        });

        toast({
          title: "Success",
          description: "User created successfully",
        });
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

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTempPassword(null);
    setPasswordCopied(false);
    setError(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
      branchId: "",
    });
  };

  const roleVariant = (role: string): "success" | "warning" | "info" | "neutral" => {
    const map: Record<string, "success" | "warning" | "info" | "neutral"> = {
      ADMIN: "success",
      BRANCH_HEAD: "warning",
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
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
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
          (isAdmin || currentUser?.role === 'BRANCH_HEAD') && (
            <Button size="sm" className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Create User
            </Button>
          )
        }
      />

      <DataTable columns={columns} data={users} searchPlaceholder="Search users..." />

      {/* Create User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. A temporary password will be generated.
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    disabled={submitting}
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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleChange("role", value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {isAdmin && (
                      <>
                        <SelectItem value="BRANCH_HEAD">Branch Head</SelectItem>
                        <SelectItem value="TRAINER">Trainer</SelectItem>
                        <SelectItem value="STUDENT">Student</SelectItem>
                      </>
                    )}
                    {currentUser?.role === 'BRANCH_HEAD' && (
                      <>
                        <SelectItem value="TRAINER">Trainer</SelectItem>
                        <SelectItem value="STUDENT">Student</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formData.role && formData.role !== 'ADMIN' && (
                <div className="space-y-2">
                  <Label htmlFor="branchId">Branch *</Label>
                  <Select
                    value={formData.branchId}
                    onValueChange={(value) => handleChange("branchId", value)}
                    disabled={submitting || currentUser?.role === 'BRANCH_HEAD'}
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
                  {currentUser?.role === 'BRANCH_HEAD' && (
                    <p className="text-xs text-muted-foreground">
                      You can only create users in your branch
                    </p>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
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
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
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
