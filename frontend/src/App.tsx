import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import SetupGuard from "./components/SetupGuard";
import Setup from "./pages/Setup";
import Login from "./pages/Login";
import PublicEnquiry from "./pages/PublicEnquiry";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Leads from "./pages/Leads";
import Admissions from "./pages/Admissions";
import Courses from "./pages/Courses";
import Trainers from "./pages/Trainers";
import Batches from "./pages/Batches";
import Students from "./pages/Students";
import Fees from "./pages/Fees";
import Attendance from "./pages/Attendance";
import Portfolio from "./pages/Portfolio";
import Placements from "./pages/Placements";
import Incentives from "./pages/Incentives";
import StudentGrowth from "./pages/StudentGrowth";
import Notifications from "./pages/Notifications";
import TelecallerDashboard from "./pages/telecaller/TelecallerDashboard";
import LeadPipeline from "./pages/telecaller/LeadPipeline";
import TelecallerAnalytics from "./pages/telecaller/TelecallerAnalytics";
import CeoPerformance from "./pages/CeoPerformance";
import NotFound from "./pages/NotFound";
import PageTransition from "./components/PageTransition";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SetupGuard>
          <Routes>
            <Route path="/setup" element={<PageTransition><Setup /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/enquiry" element={<PageTransition><PublicEnquiry /></PageTransition>} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/trainers" element={<Trainers />} />
              <Route path="/batches" element={<Batches />} />
              <Route path="/students" element={<Students />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/placements" element={<Placements />} />
              <Route path="/incentives" element={<Incentives />} />
              <Route path="/growth" element={<StudentGrowth />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/telecaller/dashboard" element={<TelecallerDashboard />} />
              <Route path="/telecaller/pipeline" element={<LeadPipeline />} />
              <Route path="/telecaller/analytics" element={<TelecallerAnalytics />} />
              <Route path="/ceo-analytics" element={<CeoPerformance />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SetupGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
