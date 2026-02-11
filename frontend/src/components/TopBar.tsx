import { useState, useEffect } from "react";
import { Bell, ChevronDown, Building2, LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { storage } from "@/lib/api";
import NotificationDropdown from "@/components/NotificationDropdown";

interface TopBarProps {
  sidebarCollapsed: boolean;
}

const TopBar = ({ sidebarCollapsed }: TopBarProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(storage.getUser());

  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(storage.getUser());
    };

    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  const handleLogout = () => {
    storage.clear();
    navigate("/login", { replace: true });
  };

  const getUserInitials = () => {
    if (!user) return "??";
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
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

  return (
    <header className={`fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6 transition-all duration-300 ${sidebarCollapsed ? "left-16" : "left-60"}`}>
      <div className="flex items-center gap-3">
        {/* Branch selector */}
        {user?.branch && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user.branch.name}</span>
          </div>
        )}
        {!user?.branch && user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Fortune Campus</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <NotificationDropdown />

        <div className="h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {user?.photo ? (
                  <img src={user.photo} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  getUserInitials()
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {user?.role ? getRoleLabel(user.role) : 'User'}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem disabled>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;

