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
import Attendance from "./pages/Attendance";
import Portfolio from "./pages/Portfolio";
import Placements from "./pages/Placements";
import Incentives from "./pages/Incentives";
import Reports from "./pages/Reports";
import StudentGrowth from "./pages/StudentGrowth";
import BranchInsights from "./pages/BranchInsights";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SetupGuard>
          <Routes>
            <Route path="/setup" element={<Setup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/enquiry" element={<PublicEnquiry />} />
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
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/placements" element={<Placements />} />
              <Route path="/incentives" element={<Incentives />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/growth" element={<StudentGrowth />} />
              <Route path="/branch-insights" element={<BranchInsights />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SetupGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
