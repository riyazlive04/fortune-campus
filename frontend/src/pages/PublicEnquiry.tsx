import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { leadsApi, coursesApi } from "@/lib/api";

const PublicEnquiry = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        courseId: "",
        message: "",
    });

    // Fetch courses on component mount
    useState(() => {
        const fetchCourses = async () => {
            try {
                const response = await coursesApi.getCourses();
                const validCourses = response.data?.courses || response.data || [];
                setCourses(Array.isArray(validCourses) ? validCourses : []);
            } catch (err) {
                console.error("Failed to fetch courses", err);
            }
        };
        fetchCourses();
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                message: "",
            });

            // Reset success message after 5 seconds
            setTimeout(() => setSuccess(false), 5000);
        } catch (err: any) {
            setError(err.message || "Failed to submit enquiry. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-lg font-bold text-white">
                            FI
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Fortune Innovatives</h1>
                            <p className="text-xs text-gray-600">Transform Your Future</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-12">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Left Column - Info */}
                        <div className="space-y-8">
                            <div className="animate-fade-in">
                                <h2 className="text-4xl font-bold text-gray-900 lg:text-5xl">
                                    Start Your Learning Journey Today
                                </h2>
                                <p className="mt-4 text-lg text-gray-600">
                                    Join thousands of students who have transformed their careers with our industry-leading courses.
                                </p>
                            </div>

                            {/* Features */}
                            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                                <div className="flex items-start gap-4 rounded-lg bg-white p-4 shadow-sm">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Expert Instructors</h3>
                                        <p className="text-sm text-gray-600">Learn from industry professionals with years of experience</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 rounded-lg bg-white p-4 shadow-sm">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Placement Support</h3>
                                        <p className="text-sm text-gray-600">100% placement assistance with top companies</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 rounded-lg bg-white p-4 shadow-sm">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Hands-on Projects</h3>
                                        <p className="text-sm text-gray-600">Build real-world projects to showcase your skills</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 rounded-lg bg-white p-6 shadow-sm animate-fade-in" style={{ animationDelay: "0.2s" }}>
                                <h3 className="font-semibold text-gray-900">Contact Us</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>+91 99522 70424</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span>ind.fortuneinnovatives@gmail.com</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span> College Road, Tiruppur</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Form */}
                        <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
                            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
                                <h3 className="mb-6 text-2xl font-bold text-gray-900">Get Started Now</h3>

                                {success && (
                                    <Alert className="mb-6 border-green-200 bg-green-50">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800">
                                            Thank you! We'll get back to you soon.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {error && (
                                    <Alert variant="destructive" className="mb-6">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="John"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                placeholder="Doe"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@example.com"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number *</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+91 XXXXX XXXXX"
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="courseId">Course Interest *</Label>
                                        <Select
                                            value={formData.courseId}
                                            onValueChange={(value) => setFormData({ ...formData, courseId: value })}
                                            disabled={loading}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a course" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courses.map((course) => (
                                                    <SelectItem key={course.id} value={course.id}>
                                                        {course.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message (Optional)</Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Tell us about your learning goals..."
                                            rows={4}
                                            disabled={loading}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {loading ? "Submitting..." : "Submit Enquiry"}
                                    </Button>

                                    <p className="text-center text-xs text-gray-500">
                                        By submitting this form, you agree to our terms and privacy policy.
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-white py-6">
                <div className="container mx-auto px-4 text-center text-sm text-gray-600">
                    <p>© 2024 Fortune Innovatives. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicEnquiry;
