import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Trophy, Users, Building2, Star, Target, GraduationCap, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import { authApi, storage, placementApi, companyApi } from "@/lib/api";
import { motion, Variants, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ placedCount: 2500, successRate: 98 });
  const [partners, setPartners] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [statsRes, companiesRes] = await Promise.all([
          placementApi.getPublicStats().catch(() => null),
          companyApi.getPublicList().catch(() => null)
        ]);

        if (statsRes && statsRes.data) {
          setStats({
            placedCount: statsRes.data.placedCount || 2500,
            successRate: statsRes.data.successRate || 98
          });
        }

        if (companiesRes && companiesRes.data?.companies) {
          setPartners(companiesRes.data.companies);
        }
      } catch (err) {
        console.error("Failed to fetch public marketing data", err);
      }
    };
    fetchPublicData();
  }, []);

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
      const result = await authApi.login(emailStr, formData.password);
      if (result.success && result.data) {
        storage.setToken(result.data.token);
        storage.setUser(result.data.user);
        setIsSuccess(true);
        setLoading(false);
        await new Promise(resolve => setTimeout(resolve, 800));
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
      setError(`Login Error: ${err.message || 'Unknown'}`);
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const fallbackPartners = [
    "NITTANY", "GRASP", "HEINI", "CODE PIXEL", "SGS & CO",
    "THE CHENNAI SILKS", "SAGOUS", "FROG", "PALETTE", "PROPRINT", "NPLUS"
  ];

  const currentPartners = partners.length > 0 ? partners.map(p => p.name) : fallbackPartners;

  return (
    <div className="flex min-h-screen bg-white dark:bg-background font-inter overflow-hidden">
      {/* Left Section: Brand Blue Modern Marketing (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center p-16">
        {/* Modern Mesh Gradient Background with Brand Blue */}
        <div className="absolute inset-0 z-0">
          <motion.div
            className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-400/40 blur-[130px]"
            animate={{
              x: [0, 40, 0],
              y: [0, 20, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/30 blur-[130px]"
            animate={{
              x: [0, -40, 0],
              y: [0, -20, 0],
              scale: [1, 1.25, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-white/10 blur-[150px]"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none mix-blend-overlay" />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-lg"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        >
          {/* Refined Glass Badge */}
          <div className="inline-flex items-center space-x-2.5 bg-white/20 backdrop-blur-3xl px-5 py-2.5 rounded-full mb-10 border border-white/20 shadow-xl shadow-blue-900/10">
            <div className="bg-white p-1 rounded-full shadow-md">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            </div>
            <span className="text-[11px] font-black tracking-[0.25em] uppercase text-white/90 drop-shadow-sm">Authorized Training Center</span>
          </div>

          <h2 className="text-6xl font-black font-outfit leading-[1.05] mb-8 text-white tracking-tighter drop-shadow-2xl">
            Elevate Your <br />
            <span className="text-white relative inline-block">
              Career Path
              <motion.div
                className="absolute bottom-1 left-0 w-full h-1.5 bg-white/30 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.8, duration: 1 }}
              />
            </span>
          </h2>

          <p className="text-xl text-white/80 mb-14 leading-relaxed max-w-md font-semibold drop-shadow-sm">
            Join South India's premier legacy institute. We specialize in transforming ambitious students into industry-ready professionals.
          </p>

          <div className="grid grid-cols-2 gap-8 mb-16">
            {/* Stat Card 1 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-white/20 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-3xl border border-white/10 p-8 rounded-2xl flex flex-col items-start transition-all duration-300 hover:bg-white/[0.15] hover:-translate-y-1 shadow-2xl shadow-blue-900/10">
                <div className="bg-white/20 p-3 rounded-xl mb-5 border border-white/10 shadow-inner">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="text-4xl font-black font-outfit mb-1.5 text-white tracking-tight">{stats.placedCount}+</div>
                <div className="text-[10px] text-white/60 uppercase tracking-[0.25em] font-black italic">Successful Placements</div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-white/20 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-3xl border border-white/10 p-8 rounded-2xl flex flex-col items-start transition-all duration-300 hover:bg-white/[0.15] hover:-translate-y-1 shadow-2xl shadow-blue-900/10">
                <div className="bg-white/20 p-3 rounded-xl mb-5 border border-white/10 shadow-inner">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="text-4xl font-black font-outfit mb-1.5 text-white tracking-tight">150+</div>
                <div className="text-[10px] text-white/60 uppercase tracking-[0.25em] font-black italic">Global Partnerships</div>
              </div>
            </div>

            {/* Mini Stats Row */}
            <div className="col-span-2 flex items-center space-x-12 px-4 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="flex flex-col">
                <div className="flex items-center space-x-2 text-white mb-0.5">
                  <GraduationCap className="w-4 h-4 text-white/70" />
                  <span className="text-2xl font-black font-outfit">10+</span>
                </div>
                <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">Years Mastery</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2 text-white mb-0.5">
                  <MapPin className="w-4 h-4 text-white/70" />
                  <span className="text-2xl font-black font-outfit">4+</span>
                </div>
                <span className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">Major Cities</span>
              </div>
              <div className="flex-grow flex justify-end pr-2 opacity-30 select-none">
                <Target className="w-8 h-8 text-white rotate-12" />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-8 ml-1">Trusted By Industry Leaders</h4>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {currentPartners.slice(0, 5).map((partner, idx) => (
                <span key={idx} className="text-sm font-black text-white/80 hover:text-white transition-all cursor-default tracking-tighter uppercase font-outfit italic hover:scale-110 drop-shadow-md">
                  {partner}
                </span>
              ))}
              <span className="text-xs font-black text-white/50 uppercase tracking-tighter self-center ml-2 border-l border-white/20 pl-4 py-1">and 40+ more partners</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Section: Clean Professional Auth */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between py-12 px-8 sm:px-16 lg:px-24 bg-white dark:bg-background relative overflow-y-auto">
        {/* Subtle Decorative Circle */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full pointer-events-none blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full pointer-events-none blur-3xl" />

        <main className="flex-grow flex items-center justify-center">
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-14 text-center">
              <motion.div
                className="mb-10 inline-block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
              >
                <img src={logo} alt="Fortune Campus Logo" className="h-24 w-auto object-contain" />
              </motion.div>
              <h1 className="text-5xl font-black font-outfit tracking-tighter text-slate-900 dark:text-white mb-4">Welcome</h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">Ready to continue your <span className="text-primary font-black border-b-2 border-primary/20">excellence</span> cycle?</p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-8">
              <form onSubmit={handleLogin} className={`space-y-6 ${loading || isSuccess ? "opacity-60 pointer-events-none" : ""}`}>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400 ml-1">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@fortunecampus.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-16 px-6 rounded-2xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-inner text-md font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400">Password🔑</Label>
                    <a href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors">Reset?</a>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Your security key"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-16 px-6 rounded-2xl border-slate-200 bg-slate-50/50 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-inner text-md font-medium"
                  />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-center space-x-3 text-red-600 shadow-sm">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-bold tracking-tight">{error}</span>
                    </div>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading || isSuccess}
                  className={`h-16 w-full rounded-2xl text-md font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group shadow-2xl shadow-primary/30 ${isSuccess ? 'bg-emerald-600' : 'bg-primary hover:bg-primary/90'}`}
                >
                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      <motion.div key="success" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center space-x-2">
                        <CheckCircle2 className="h-5 w-5" /> <span>Authorized</span>
                      </motion.div>
                    ) : loading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Verifying...</span>
                      </motion.div>
                    ) : (
                      <motion.div key="signin" initial={{ y: 0 }} className="flex items-center space-x-2 group-hover:scale-105 transition-transform duration-300">
                        <span>Authenticate</span>
                        <Target className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </form>

              <motion.div variants={itemVariants} className="pt-8 text-center">
                <Button
                  variant="ghost"
                  className="rounded-2xl h-14 px-10 font-black text-[11px] uppercase tracking-[0.3em] text-slate-400 hover:text-primary hover:bg-primary/5 transition-all group border border-transparent hover:border-primary/10"
                  onClick={() => navigate("/enquiry")}
                >
                  Enroll Yourself to FI <span className="ml-3 group-hover:translate-x-2 transition-transform duration-300">→</span>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </main>

        <footer className="pt-12">
          <div className="flex flex-col sm:flex-row items-center justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-300/80">
            <p>
              Developed by{" "}
              <a
                href="https://sirahdigital.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-900 dark:text-white hover:text-primary transition-colors font-black underline-offset-4 hover:underline"
              >
                Sirah Digital
              </a>
            </p>
            <div className="flex items-center space-x-8 mt-6 sm:mt-0">
              <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
              <div className="border-l border-slate-200 h-4 ml-2" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Login;
