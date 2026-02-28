import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardList, Briefcase, Calendar, FolderKanban, Award,
  BarChart3, Bell, MessageSquare, ChevronLeft, ChevronRight, Settings, UsersRound, Layers, DollarSign
} from "lucide-react";
import { storage } from "@/lib/api";
import logo from "@/assets/logo.jpg";
import { motion, AnimatePresence } from "framer-motion";

const navSections = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", path: "/", icon: LayoutDashboard, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER', 'STUDENT'] },
      { title: "Telecaller Desk", path: "/telecaller/dashboard", icon: LayoutDashboard, roles: ['TELECALLER', 'ADMIN'] },
      { title: "Lead Pipeline", path: "/telecaller/pipeline", icon: FolderKanban, roles: ['TELECALLER', 'ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Admissions", path: "/admissions", icon: ClipboardList, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Fees Management System", path: "/fees", icon: DollarSign, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Courses & Syllabus", path: "/courses", icon: BookOpen, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
      { title: "Batches", path: "/batches", icon: Layers, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
      { title: "Trainers", path: "/trainers", icon: GraduationCap, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Students", path: "/students", icon: Users, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
      { title: "Attendance", path: "/attendance", icon: Calendar, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
      { title: "Trainer Growth", path: "/growth", icon: BarChart3, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER', 'TRAINER'] },
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
      { title: "CEO Analytics", path: "/ceo-analytics", icon: BarChart3, roles: ['CEO'] },
      { title: "Telecaller Analytics", path: "/telecaller/analytics", icon: BarChart3, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
      { title: "Notifications", path: "/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { title: "User Management", path: "/users", icon: UsersRound, roles: ['ADMIN', 'CEO', 'CHANNEL_PARTNER'] },
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
    <aside className={`fixed left-4 top-4 bottom-4 z-40 flex flex-col glass-card transition-all duration-500 rounded-3xl overflow-hidden border border-white/20 select-none ${collapsed ? "w-20" : "w-64"}`}>
      {/* Logo Section */}
      <div className="flex h-40 items-center justify-center px-6 relative">
        <motion.div
          initial={false}
          animate={{ scale: collapsed ? 0.75 : 1 }}
          className="flex h-full w-full items-center justify-center py-6"
        >
          <div className="relative group flex items-center justify-center w-full h-full bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Subtle Gradient overlay for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-50" />

            <img
              src={logo}
              alt="Fortune Campus"
              className="relative z-10 h-24 w-auto max-w-[90%] object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </motion.div>
        <div className="absolute bottom-4 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-6 space-y-8"
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none',   // IE/Edge
        }}
      >
        <style>{`
          nav::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
        {filteredSections.map((section) => (
          <div key={section.label} className="space-y-2">
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-3"
              >
                {section.label}
              </motion.p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[13px] font-bold transition-all duration-300 group ${isActive
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      } ${collapsed ? "justify-center px-0 mx-2" : "mx-1"}`
                    }
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-primary/5 rounded-2xl border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    <div className={`relative z-10 flex items-center justify-center transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                      <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground/70"}`} />
                    </div>

                    {!collapsed && (
                      <motion.span
                        initial={false}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative z-10 truncate tracking-tight"
                      >
                        {item.title}
                      </motion.span>
                    )}

                    {isActive && !collapsed && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                      />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 mt-auto">
        <button
          onClick={onToggle}
          className="flex w-full h-12 items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-all duration-300 border border-white/5 hover:border-primary/20 group"
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.div>
        </button>
      </div>
    </aside>
  );
};


export default AppSidebar;
