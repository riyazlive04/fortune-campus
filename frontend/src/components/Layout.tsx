import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";
import { storage, branchesApi, coursesApi } from "@/lib/api";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import GlowOverlay from "./GlowOverlay";
import FeeApprovalModal from "./FeeApprovalModal";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const token = storage.getToken();
    const user = storage.getUser();

    if (!token || !user) {
      // Redirect to login if not authenticated
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Global data fetching for caching
  useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await branchesApi.getBranches();
      return res.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await coursesApi.getCourses();
      return res.data || [];
    },
    staleTime: 30 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <GlowOverlay />
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar sidebarCollapsed={collapsed} />
      <FeeApprovalModal />
      <main className={`pt-16 flex-1 transition-all duration-300 ${collapsed ? "ml-28" : "ml-72"}`}>
        <div className="p-6 h-full relative">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
      <div className={`transition-all duration-300 ${collapsed ? "ml-28" : "ml-72"}`}>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
