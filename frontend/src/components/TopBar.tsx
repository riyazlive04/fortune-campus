import { useState, useEffect } from "react";
import { Bell, ChevronDown, Building2, LogOut, User as UserIcon, Settings } from "lucide-react";
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
    <header className={`fixed top-0 right-0 z-30 flex h-16 items-center justify-between bg-card/80 backdrop-blur-md px-6 transition-all duration-300 ${sidebarCollapsed ? "left-16" : "left-60"}`}>
      <div className="flex items-center gap-3">
        {/* Branch selector */}
        {user?.branch && (
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-4 py-1.5 transition-colors hover:bg-muted/50">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[12px] font-bold text-foreground/80 lowercase first-letter:uppercase">{user.branch.name}</span>
          </div>
        )}
        {!user?.branch && user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-4 py-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[12px] font-bold text-foreground/80">Fortune Campus</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />

        <div className="h-8 w-px bg-border/60" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-3 rounded-full pl-1.5 pr-3 py-1.5 hover:bg-muted/50 transition-all">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[11px] font-bold text-primary transition-transform group-hover:scale-105">
                {user?.photo ? (
                  <img src={user.photo} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  getUserInitials()
                )}
              </div>
              <div className="hidden sm:block text-left mr-1">
                <p className="text-[13px] font-bold text-foreground leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                  {user?.role ? getRoleLabel(user.role) : 'User'}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl border-border shadow-lg">
            <div className="px-2 py-1.5 mb-1 bg-muted/30 rounded-t-lg">
              <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Account</p>
            </div>
            <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-lg mx-1 cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4 opacity-70" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="rounded-lg mx-1">
              <Settings className="mr-2 h-4 w-4 opacity-70" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60 my-1" />
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg mx-1 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
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

