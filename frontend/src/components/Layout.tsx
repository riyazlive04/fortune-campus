import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";
import { storage } from "@/lib/api";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = storage.getToken();
    const user = storage.getUser();

    if (!token || !user) {
      // Redirect to login if not authenticated
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar sidebarCollapsed={collapsed} />
      <main className={`pt-16 flex-1 transition-all duration-300 ${collapsed ? "ml-16" : "ml-60"}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <div className={`transition-all duration-300 ${collapsed ? "ml-16" : "ml-60"}`}>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
