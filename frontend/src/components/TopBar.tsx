import { Bell, ChevronDown, Building2, LogOut } from "lucide-react";
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

interface TopBarProps {
  sidebarCollapsed: boolean;
}

const TopBar = ({ sidebarCollapsed }: TopBarProps) => {
  const navigate = useNavigate();
  const user = storage.getUser();

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
      BRANCH_HEAD: "Branch Head",
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
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            3
          </span>
        </Button>

        <div className="h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {getUserInitials()}
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
