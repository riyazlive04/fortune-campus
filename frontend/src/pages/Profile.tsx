import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, User, Lock, Camera, Loader2, Trash } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setProfile(result.data);
        setProfileForm({
          firstName: result.data.firstName || "",
          lastName: result.data.lastName || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      if (result.success && result.data) {
        // Update stored user data
        const currentUser = storage.getUser();
        storage.setUser({ ...currentUser, ...result.data });

        setProfile(result.data);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setPhotoLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const token = storage.getToken();
        const response = await fetch(`${API_BASE_URL}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            photo: base64String
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to upload photo');
        }

        if (result.success && result.data) {
          // Update stored user data
          const currentUser = storage.getUser();
          storage.setUser({ ...currentUser, photo: result.data.photo });

          setProfile(result.data);
          toast({
            title: "Success",
            description: "Profile photo updated successfully",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile.photo) return;

    setPhotoLoading(true);
    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          photo: null
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove photo');
      }

      setProfile(prev => ({ ...prev, photo: null }));

      // Update local storage to trigger TopBar update
      const currentUser = storage.getUser();
      if (currentUser) {
        storage.setUser({ ...currentUser, photo: null });
      }

      toast({
        title: "Success",
        description: "Profile photo removed successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to remove photo",
        variant: "destructive",
      });
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password');
      }

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const token = storage.getToken();

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      storage.clear();
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted",
      });
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete account",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: "Admin",
      CHANNEL_PARTNER: "Channel Partner",
      TRAINER: "Trainer",
      STUDENT: "Student",
    };
    return roleMap[role] || role;
  };

  if (!profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account information and security settings"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative group mx-auto w-24 h-24">
              <div
                onClick={handlePhotoClick}
                className="cursor-pointer overflow-hidden rounded-full w-24 h-24 ring-2 ring-primary/20 transition-all hover:ring-primary/40 flex items-center justify-center bg-primary/10"
              >
                {profile.photo ? (
                  <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-2xl font-bold text-primary">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    {photoLoading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="text-center space-y-2">
              <div>
                <h3 className="text-lg font-semibold">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handlePhotoClick}
                disabled={photoLoading}
              >
                {photoLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-4 w-4" />
                )}
                Change Photo
              </Button>

              {profile.photo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleRemovePhoto}
                  disabled={photoLoading}
                >
                  {photoLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="mr-2 h-4 w-4" />
                  )}
                  Remove Photo
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <StatusBadge
                  status={getRoleLabel(profile.role)}
                  variant={profile.role === 'ADMIN' ? 'success' : 'info'}
                />
              </div>
              {profile.branch && (
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="font-medium">{profile.branch.name}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge
                  status={profile.isActive ? 'Active' : 'Inactive'}
                  variant={profile.isActive ? 'success' : 'neutral'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profileForm.firstName}
                          onChange={handleProfileChange}
                          disabled={loading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profileForm.lastName}
                          onChange={handleProfileChange}
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Update Profile
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        disabled={loading}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        disabled={loading}
                        required
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;

