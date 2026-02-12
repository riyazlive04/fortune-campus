import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserPlus, GraduationCap, BookOpen,
  ClipboardList, Briefcase, Calendar, FolderKanban, Award,
  BarChart3, Bell, MessageSquare, ChevronLeft, ChevronRight, Settings, UsersRound
} from "lucide-react";
import { storage } from "@/lib/api";

const navSections = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", path: "/", icon: LayoutDashboard },
      { title: "Leads & Enquiries", path: "/leads", icon: UserPlus, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Admissions", path: "/admissions", icon: ClipboardList, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Courses & Syllabus", path: "/courses", icon: BookOpen, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
      { title: "Trainers", path: "/trainers", icon: GraduationCap, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Students", path: "/students", icon: Users, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
      { title: "Attendance", path: "/attendance", icon: Calendar, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
      { title: "Student Growth", path: "/growth", icon: BarChart3, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
    ],
  },
  {
    label: "Outcomes",
    items: [
      { title: "Portfolio", path: "/portfolio", icon: FolderKanban, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
      { title: "Placements", path: "/placements", icon: Briefcase, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Incentives", path: "/incentives", icon: Award, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Reports", path: "/reports", icon: BarChart3, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Branch Insights", path: "/branch-insights", icon: LayoutDashboard, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { title: "User Management", path: "/users", icon: UsersRound, roles: ['ADMIN', 'CEO'] },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const user = storage.getUser();
  const role = user?.role;

  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || item.roles.includes(role))
  })).filter(section => section.items.length > 0);

  return (
    <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              FI
            </div>
            <span className="text-sm font-semibold text-sidebar-accent-foreground">Fortune Innovatives</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            FI
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {filteredSections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`mx-2 mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};

export default AppSidebar;
