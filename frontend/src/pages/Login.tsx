import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Footer from "@/components/Footer";
import { authApi, storage } from "@/lib/api";
import { motion, Variants, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpg"; // Importing the logo

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailStr = formData.email.trim();
    if (!emailStr || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setIsSuccess(false);
    setError(null);

    try {
      console.log(`Attempting login with email: '${emailStr}'`);
      const result = await authApi.login(emailStr, formData.password);

      if (result.success && result.data) {
        // Store token and user data
        storage.setToken(result.data.token);
        storage.setUser(result.data.user);

        // Show satisfying success animation for a moment
        setIsSuccess(true);
        setLoading(false);

        // Wait 800ms so the user can see the "Success!" checkmark animation
        await new Promise(resolve => setTimeout(resolve, 800));

        // Redirect to dashboard based on role
        if (result.data.user?.role === 'TELECALLER') {
          navigate("/telecaller/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        setError(result.message || "Login failed - no data");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login catch error:", err);
      setError(`Login Error: ${err.message || 'Unknown'}`);
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-background relative overflow-hidden">
      {/* Optional subtle background animation */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="w-full max-w-sm relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8 text-center flex flex-col items-center">
          <motion.img
            src={logo}
            alt="Fortune Innovatives Logo"
            className="w-auto h-20 sm:h-24 mb-6 object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fortune Innovatives</h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">Authorized Training Center</p>
        </motion.div>

        <motion.div variants={itemVariants} className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-xl">
          <form onSubmit={handleLogin} className={`space-y-5 transition-all duration-300 ${loading || isSuccess ? "opacity-80 pointer-events-none scale-[0.98]" : ""}`}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" className={`w-full shadow-lg rounded-lg py-5 text-md font-semibold transition-all overflow-hidden relative ${isSuccess ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25 text-white' : 'shadow-primary/25'}`} disabled={loading || isSuccess}>
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center absolute inset-0"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Success
                    </motion.div>
                  ) : loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center absolute inset-0"
                    >
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Signing in...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signin"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center absolute inset-0"
                    >
                      Sign In
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Invisible placeholder to maintain button height */}
                <div className="invisible flex items-center justify-center">Sign In</div>
              </Button>
            </motion.div>
          </form>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6 text-center">
          <Button variant="link" className="text-muted-foreground hover:text-primary transition-colors" onClick={() => navigate("/enquiry")}>
            Looking for courses? Enquire Now
          </Button>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 opacity-80 hover:opacity-100 transition-opacity">
          <Footer />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
