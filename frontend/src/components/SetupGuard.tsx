import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { setupApi } from "@/lib/api";

interface SetupGuardProps {
  children: React.ReactNode;
}

const SetupGuard = ({ children }: SetupGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const result = await setupApi.checkStatus();
        
        if (result.success && result.data) {
          const { setupRequired } = result.data;
          
          // If setup is required and we're not on the setup page, redirect
          if (setupRequired && location.pathname !== '/setup') {
            navigate('/setup', { replace: true });
          }
          // If setup is NOT required and we're on the setup page, redirect to login
          else if (!setupRequired && location.pathname === '/setup') {
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error('Failed to check setup status:', error);
        // On error, assume setup might be needed, allow navigation
      } finally {
        setChecking(false);
      }
    };

    checkSetupStatus();
  }, [navigate, location.pathname]);

  // Show loading state while checking
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SetupGuard;
