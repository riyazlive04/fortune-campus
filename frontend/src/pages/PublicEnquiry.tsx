import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Sparkles, GraduationCap, ArrowRight, ShieldCheck, Zap, Mandala } from "lucide-react";
import { leadsApi, coursesApi, branchesApi } from "@/lib/api";

const PublicEnquiry = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        courseId: "",
        branchId: "",
        location: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coursesRes, branchesRes] = await Promise.all([
                    coursesApi.getPublicCourses(),
                    branchesApi.getPublicBranches()
                ]);

                const validCourses = coursesRes.data || [];
                setCourses(Array.isArray(validCourses) ? validCourses : []);

                const validBranches = branchesRes.data || [];
                setBranches(Array.isArray(validBranches) ? validBranches : []);
            } catch (err) {
                console.error("Failed to fetch form data", err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await leadsApi.createPublicLead({
                ...formData,
                source: "Website Enquiry",
                status: "NEW",
            });

            setSuccess(true);
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                courseId: "",
                branchId: "",
                location: "",
            });

            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            setError(err.message || "Failed to submit enquiry. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-500/30 font-sans">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-500/5 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-600/5 blur-[100px] rounded-full" />
            </div>

            {/* Header / Brand */}
            <header className="relative z-10 w-full px-6 py-10">
                <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-4">
                    <div className="flex items-center gap-4 group transition-transform hover:scale-105 duration-300">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb] shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10">
                            <span className="text-2xl font-black text-white italic">FI</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-none">
                                FORTUNE <span className="text-[#2563eb]">INNOVATIVES</span>
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mt-1">Transform Your Future</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-6 pb-20">
                <div className="w-full max-w-xl">
                    {/* Hero Section */}
                    <div className="text-center mb-10 space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-2 animate-fade-in shadow-sm">
                            <Sparkles className="h-3 w-3" />
                            Launch Your Career
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Start Your Learning <br />
                            <span className="text-[#2563eb]">Journey Today</span>
                        </h2>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                            Join thousands of students who have transformed their careers with our industry-leading courses.
                        </p>
                    </div>

                    {/* Enquiry Card */}
                    <div className="relative">
                        {/* Decorative Background Card Shadow */}
                        <div className="absolute -inset-4 bg-white/40 blur-2xl rounded-[3rem] -z-10" />

                        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] overflow-hidden p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] ring-1 ring-slate-100">
                            {success ? (
                                <div className="py-20 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                        <CheckCircle2 className="h-10 w-10 text-blue-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold text-slate-900">Enquiry Received!</h3>
                                        <p className="text-slate-500 font-medium">Thank you for choosing us. <br />Our counselor will contact you shortly.</p>
                                    </div>
                                    <Button
                                        onClick={() => setSuccess(false)}
                                        className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 px-8 py-6 h-auto"
                                    >
                                        Go back
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-600 rounded-2xl animate-in shake-in duration-300">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="font-medium">{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="e.g. John"
                                                required
                                                disabled={loading}
                                                className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                placeholder="Optional"
                                                disabled={loading}
                                                className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@example.com"
                                            required
                                            disabled={loading}
                                            className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Work/Mobile</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+91 Phone"
                                                required
                                                disabled={loading}
                                                className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Location</Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="City, State"
                                                required
                                                disabled={loading}
                                                className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="courseId" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Interested Course</Label>
                                            <Select
                                                value={formData.courseId}
                                                onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                                                disabled={loading}
                                                required
                                            >
                                                <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-blue-500/20 text-slate-900 focus:border-blue-500 transition-all font-medium">
                                                    <SelectValue placeholder="Select course" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-slate-200">
                                                    {courses.map((course) => (
                                                        <SelectItem key={course.id} value={course.id} className="focus:bg-blue-50 focus:text-blue-700 font-medium">
                                                            {course.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="branchId" className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Preferred Branch</Label>
                                            <Select
                                                value={formData.branchId}
                                                onValueChange={(value) => setFormData({ ...formData, branchId: value })}
                                                disabled={loading}
                                                required
                                            >
                                                <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-blue-500/20 text-slate-900 focus:border-blue-500 transition-all font-medium">
                                                    <SelectValue placeholder="Select branch" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-slate-200">
                                                    {branches.map((branch) => (
                                                        <SelectItem key={branch.id} value={branch.id} className="focus:bg-blue-50 focus:text-blue-700 font-medium">
                                                            {branch.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/30 group transition-all duration-300"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                Submit Enquiry <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>

                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2 px-2">
                                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-blue-500" /> Secure Submission</span>
                                        <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-amber-500" /> Instant Reach</span>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Simple Minimal Footer */}
            <footer className="relative z-10 w-full px-6 py-10">
                <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    <p>Developed by Sirah Digital</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicEnquiry;
