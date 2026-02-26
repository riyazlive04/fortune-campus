import { useState, useEffect } from "react";
import {
    Users,
    TrendingUp,
    DollarSign,
    PieChart as PieChartIcon,
    Download,
    Filter,
    RefreshCw,
    BarChart3,
    Target,
    AlertTriangle,
    ShieldAlert,
    BrainCircuit
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import KPICard from "@/components/KPICard";
import { reportsApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

const CeoPerformance = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const now = new Date();
    const [filterMode, setFilterMode] = useState<'ytd' | 'mtd' | 'custom'>('mtd');
    // YTD: which year; MTD: which month (1-12); custom: a specific start date
    const [ytdYear, setYtdYear] = useState<number>(now.getFullYear());
    const [mtdMonth, setMtdMonth] = useState<string>(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const [customStart, setCustomStart] = useState<string>(now.toISOString().split('T')[0]);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [gapDetailModal, setGapDetailModal] = useState<{ open: boolean; category: string; filter: 'total' | 'improving' | 'resolved' } | null>(null);
    const { toast } = useToast();

    const openGapDetail = (category: string, filter: 'total' | 'improving' | 'resolved') => {
        setGapDetailModal({ open: true, category, filter });
    };

    const getFilteredGaps = () => {
        if (!gapDetailModal) return [];
        const gaps = data?.performanceGaps?.[gapDetailModal.category] || [];
        if (gapDetailModal.filter === 'total') return gaps;
        if (gapDetailModal.filter === 'improving') return gaps.filter((g: any) => g.status === 'IMPROVING');
        if (gapDetailModal.filter === 'resolved') return gaps.filter((g: any) => g.status === 'RESOLVED');
        return gaps;
    };

    const gapFilterLabel = () => {
        if (!gapDetailModal) return '';
        if (gapDetailModal.filter === 'total') return 'All Issues';
        if (gapDetailModal.filter === 'improving') return 'In Progress';
        return 'Resolved';
    };

    const getGapsSummary = (category: string) => {
        const gaps = data?.performanceGaps?.[category] || [];
        if (gaps.length === 0) return null;

        const resolvedCount = gaps.filter((g: any) => g.status === 'RESOLVED').length;
        const improvingCount = gaps.filter((g: any) => g.status === 'IMPROVING').length;
        const resolutionRate = ((resolvedCount / gaps.length) * 100).toFixed(0);

        // Find most common word/theme in weaknesses (simplified)
        const themes = gaps.map((g: any) => g.weakness.split(' ')[0]).reduce((acc: any, theme: string) => {
            const cleanTheme = theme.replace(/[^a-zA-Z]/g, '');
            if (cleanTheme.length > 3) {
                acc[cleanTheme] = (acc[cleanTheme] || 0) + 1;
            }
            return acc;
        }, {});
        const topTheme = Object.entries(themes).sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0] || "General";

        const insight = gaps.length > 0
            ? `Primarily focusing on ${topTheme} related gaps. ${resolutionRate}% of identified issues have been successfully resolved.`
            : "No significant patterns identified yet.";

        return {
            total: gaps.length,
            resolved: resolvedCount,
            improving: improvingCount,
            rate: resolutionRate,
            topTheme,
            insight
        };
    };

    const openMetricDetails = (metric: string) => {
        setSelectedMetric(metric);
        setIsModalOpen(true);
    };

    const fetchData = async (startDate: string, endDate: string) => {
        try {
            setLoading(true);
            console.log('[CEO Filter] startDate:', startDate, 'endDate:', endDate);
            const res = await reportsApi.getCEOOverallReport(undefined, undefined, startDate, endDate);
            setData(res.data);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error fetching analytics",
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper to compute the [startDate, endDate] from current filter state
    const computeDateRange = (mode: typeof filterMode, year: number, month: string, custom: string): [string, string] => {
        const today = new Date();
        // Use local date (IST) as end
        const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        let startDate: string;
        if (mode === 'ytd') {
            startDate = `${year}-01-01`;
        } else if (mode === 'mtd') {
            startDate = `${month}-01`;
        } else {
            // Custom: show only that specific date (start = end = selected date)
            startDate = custom;
            return [custom, custom];
        }
        return [startDate, endDate];
    };

    useEffect(() => {
        const [start, end] = computeDateRange(filterMode, ytdYear, mtdMonth, customStart);
        fetchData(start, end);
    }, [filterMode, ytdYear, mtdMonth, customStart]);

    // Year options for YTD picker
    const currentYear = new Date().getFullYear();
    const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);

    if (loading && !data) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="CEO Global Analytics"
                description="Consolidated performance across all branches"
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* 3-mode toggle */}
                        <div className="flex items-center rounded-xl border bg-muted/50 p-1 gap-0.5 shadow-sm">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground px-2">Revenue 💲</span>
                            {(['ytd', 'mtd', 'custom'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setFilterMode(mode)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${filterMode === mode
                                        ? 'bg-primary text-primary-foreground shadow'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-background'
                                        }`}
                                >
                                    {mode === 'ytd' ? 'Year to Date' : mode === 'mtd' ? 'Month to Date' : 'Custom Date'}
                                </button>
                            ))}
                        </div>

                        {/* Secondary picker — changes based on mode */}
                        {filterMode === 'ytd' && (
                            <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">From Year</span>
                                <select
                                    value={ytdYear}
                                    onChange={e => setYtdYear(Number(e.target.value))}
                                    className="text-sm font-semibold bg-transparent border-none focus:outline-none text-foreground cursor-pointer"
                                >
                                    {YEAR_OPTIONS.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <span className="text-[10px] text-muted-foreground">→ Today</span>
                            </div>
                        )}

                        {filterMode === 'mtd' && (
                            <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">From Month</span>
                                <input
                                    type="month"
                                    value={mtdMonth}
                                    max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                                    onChange={e => setMtdMonth(e.target.value)}
                                    className="text-sm font-semibold bg-transparent border-none focus:outline-none text-foreground cursor-pointer"
                                />
                                <span className="text-[10px] text-muted-foreground">→ Today</span>
                            </div>
                        )}

                        {filterMode === 'custom' && (
                            <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1.5 shadow-sm">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Date</span>
                                <input
                                    type="date"
                                    value={customStart}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={e => setCustomStart(e.target.value)}
                                    className="text-sm font-semibold bg-transparent border-none focus:outline-none text-foreground cursor-pointer"
                                />
                                <span className="text-[10px] text-muted-foreground">(Only this day)</span>
                            </div>
                        )}

                        <Button variant="outline" size="sm" onClick={() => { const [s, e] = computeDateRange(filterMode, ytdYear, mtdMonth, customStart); fetchData(s, e); }} className="gap-2 h-10">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="gap-2 h-10">
                            <Download className="h-4 w-4" /> Export All
                        </Button>
                    </div>
                }
            />

            {/* Global KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Global Leads"
                    value={data?.overall?.totalLeads || 0}
                    change="Total across all branches"
                    changeType="neutral"
                    icon={Users}
                    accentColor="bg-primary"
                    onClick={() => openMetricDetails('leads')}
                />

                <KPICard
                    title="Total Admissions"
                    value={data?.overall?.totalAdmissions || 0}
                    change={`${((data?.overall?.totalAdmissions / (data?.overall?.totalLeads || 1)) * 100).toFixed(1)}% Conversion Rate`}
                    changeType="positive"
                    icon={TrendingUp}
                    accentColor="bg-emerald-500"
                    onClick={() => openMetricDetails('admissions')}
                />

                <KPICard
                    title="Global Revenue"
                    value={formatCurrency(data?.overall?.totalRevenue || 0)}
                    change="Projected Fees"
                    changeType="neutral"
                    icon={DollarSign}
                    accentColor="bg-amber-500"
                    onClick={() => openMetricDetails('revenue')}
                />

                <KPICard
                    title="Collections"
                    value={formatCurrency(data?.overall?.totalCollected || 0)}
                    change={`${((data?.overall?.totalCollected / (data?.overall?.totalRevenue || 1)) * 100).toFixed(1)}% Collected`}
                    changeType="positive"
                    icon={Target}
                    accentColor="bg-purple-500"
                    onClick={() => openMetricDetails('collections')}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Lead Sources */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-primary" />
                            Lead Source Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data?.leadSources || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="source"
                                    >
                                        {(data?.leadSources || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Lead Conversion Funnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.conversionFunnel || []} layout="vertical" margin={{ left: 20, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="status"
                                        type="category"
                                        stroke="#888888"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        width={100}
                                        tickFormatter={(value) => value.replace(/_/g, ' ')}
                                    />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Branch Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Multi-Branch Revenue Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.branchComparison || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="branch" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" name="Expected Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="collected" name="Actually Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Branch Table Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Branch Summary Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Branch</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Leads</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Conversions</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Admissions Revenue</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Collected</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right">Health</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {(data?.branchComparison || []).map((branch: any) => (
                                    <tr key={branch.branch} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle font-medium">{branch.branch}</td>
                                        <td className="p-4 align-middle">{branch.leads}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-2">
                                                {branch.conversions}
                                                <span className="text-[10px] text-muted-foreground italic">
                                                    ({branch.leads > 0 ? ((branch.conversions / branch.leads) * 100).toFixed(0) : 0}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">{formatCurrency(branch.revenue)}</td>
                                        <td className="p-4 align-middle text-emerald-600 font-semibold">{formatCurrency(branch.collected)}</td>
                                        <td className="p-4 align-middle text-right">
                                            {branch.collected / branch.revenue > 0.8 ? (
                                                <span className="text-emerald-500 font-bold">Excellent</span>
                                            ) : branch.collected / branch.revenue > 0.5 ? (
                                                <span className="text-amber-500 font-bold">Moderate</span>
                                            ) : (
                                                <span className="text-rose-500 font-bold">Needs Focus</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Improvement Center */}
            <Card className="border-rose-500/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-rose-500/[0.02] border-b border-rose-500/5 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BrainCircuit className="h-5 w-5 text-rose-500" />
                            Performance Improvement Center
                        </CardTitle>
                        <Badge variant="outline" className="text-rose-600 bg-rose-50 border-rose-200">
                            Attention Required
                        </Badge>
                    </div>
                    <CardDescription>
                        Identified weaknesses and skill gaps across students, trainers, and telecallers
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="students" className="w-full">
                        <div className="px-6 border-b bg-muted/30">
                            <TabsList className="h-12 w-full justify-start bg-transparent gap-6">
                                <TabsTrigger value="students" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none px-0">
                                    Students
                                </TabsTrigger>
                                <TabsTrigger value="trainers" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none px-0">
                                    Trainers
                                </TabsTrigger>
                                <TabsTrigger value="telecallers" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none px-0">
                                    Telecallers
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {['students', 'trainers', 'telecallers'].map((cat) => {
                            const summary = getGapsSummary(cat);
                            return (
                                <TabsContent key={cat} value={cat} className="m-0">
                                    <ScrollArea className="h-[450px]">
                                        <div className="p-6">
                                            {summary && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                    {/* Total Issues — matches KPICard blue */}
                                                    <button
                                                        onClick={() => openGapDetail(cat, 'total')}
                                                        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg group cursor-pointer hover:border-rose-400/40 hover:-translate-y-1 text-left h-full flex flex-col justify-between"
                                                    >
                                                        <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-rose-500" />
                                                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-rose-500" />
                                                        <div className="flex items-center justify-between relative z-10">
                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Total Issues</p>
                                                            <div className="rounded-full p-2.5 bg-rose-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                                                                <ShieldAlert className="h-4 w-4 text-rose-600" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 relative z-10">
                                                            <h3 className="text-2xl font-black tracking-tight text-foreground">{summary.total}</h3>
                                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-muted/50 text-muted-foreground border border-border/50 mt-1">Found in this period</span>
                                                        </div>
                                                    </button>

                                                    {/* Active Progress — matches KPICard amber */}
                                                    <button
                                                        onClick={() => openGapDetail(cat, 'improving')}
                                                        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg group cursor-pointer hover:border-amber-400/40 hover:-translate-y-1 text-left h-full flex flex-col justify-between"
                                                    >
                                                        <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-amber-500" />
                                                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-amber-500" />
                                                        <div className="flex items-center justify-between relative z-10">
                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Active Progress</p>
                                                            <div className="rounded-full p-2.5 bg-amber-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                                                                <RefreshCw className="h-4 w-4 text-amber-600" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 relative z-10">
                                                            <h3 className="text-2xl font-black tracking-tight text-foreground">{summary.improving}</h3>
                                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100/50 mt-1">Currently being addressed</span>
                                                        </div>
                                                    </button>

                                                    {/* Resolution Rate — matches KPICard emerald */}
                                                    <button
                                                        onClick={() => openGapDetail(cat, 'resolved')}
                                                        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg group cursor-pointer hover:border-emerald-400/40 hover:-translate-y-1 text-left h-full flex flex-col justify-between"
                                                    >
                                                        <div className="absolute top-0 left-0 w-full h-[3px] opacity-80 bg-emerald-500" />
                                                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity bg-emerald-500" />
                                                        <div className="flex items-center justify-between relative z-10">
                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Resolution Rate</p>
                                                            <div className="rounded-full p-2.5 bg-emerald-500 bg-opacity-10 group-hover:bg-opacity-20 transition-colors">
                                                                <Target className="h-4 w-4 text-emerald-600" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 relative z-10">
                                                            <h3 className="text-2xl font-black tracking-tight text-foreground">{summary.rate}%</h3>
                                                            <div className="h-1.5 w-full bg-emerald-100 rounded-full mt-2 overflow-hidden">
                                                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${summary.rate}%` }} />
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            )}

                                            {summary && (
                                                <div className="mb-6 bg-rose-50/20 border border-rose-200/30 rounded-xl p-5 flex gap-4 items-start shadow-sm">
                                                    <div className="h-12 w-12 rounded-full bg-rose-100/50 flex items-center justify-center shrink-0 border border-rose-200">
                                                        <ShieldAlert className="h-6 w-6 text-rose-500" />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                                                <Target className="h-3 w-3" />
                                                                Overall Problem Identified
                                                            </h4>
                                                            <p className="text-sm font-semibold text-rose-900 mt-1">
                                                                Recurring theme in {cat}: <span className="underline decoration-rose-300 underline-offset-4 font-black">{summary.topTheme} Gaps</span>
                                                            </p>
                                                        </div>
                                                        <div className="pt-2 border-t border-rose-100">
                                                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                                <RefreshCw className="h-3 w-3" />
                                                                Needed Improvement
                                                            </h4>
                                                            <p className="text-xs text-slate-700 mt-1 leading-relaxed italic">
                                                                {summary.insight}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(!data?.performanceGaps?.[cat] || data.performanceGaps[cat].length === 0) ? (
                                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                                                    <ShieldAlert className="h-10 w-10 mb-2 opacity-20" />
                                                    <p>No critical weaknesses identified for this category</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {data.performanceGaps[cat].map((gap: any) => (
                                                        <div key={gap.id} className="group relative flex flex-col gap-2 p-4 rounded-xl border bg-card hover:border-rose-200 hover:shadow-sm transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 text-xs font-bold">
                                                                        {gap.targetUser.firstName[0]}{gap.targetUser.lastName[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-sm leading-none">
                                                                            {gap.targetUser.firstName} {gap.targetUser.lastName}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground mt-1">
                                                                            Logged by {gap.createdBy.firstName} at {gap.branch.name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Badge className={
                                                                    gap.status === 'IDENTIFIED' ? 'bg-rose-500' :
                                                                        gap.status === 'IMPROVING' ? 'bg-amber-500' : 'bg-emerald-500'
                                                                }>
                                                                    {gap.status}
                                                                </Badge>
                                                            </div>
                                                            <div className="mt-2 flex items-start gap-2 bg-rose-50/50 p-3 rounded-lg border border-rose-100/50">
                                                                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-rose-900">Weakness / Skills Gap:</p>
                                                                    <p className="text-sm text-rose-700 mt-1">{gap.weakness}</p>
                                                                </div>
                                                            </div>
                                                            {gap.improvementPlan && (
                                                                <div className="mt-1 flex items-start gap-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                                                                    <div className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5 flex items-center justify-center">
                                                                        <RefreshCw className="h-3 w-3" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-emerald-900">Improvement Plan:</p>
                                                                        <p className="text-sm text-emerald-700 mt-1 italic">{gap.improvementPlan}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {new Date(gap.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </CardContent>
            </Card>


            {/* Metric Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {selectedMetric?.replace('-', ' ')} Breakdown
                        </DialogTitle>
                        <DialogDescription>
                            Detailed performance metrics across all branches for {selectedMetric}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 text-left font-medium">Branch</th>
                                    <th className="p-3 text-right font-medium">Value</th>
                                    {(selectedMetric === 'revenue' || selectedMetric === 'collections') && (
                                        <th className="p-3 text-right font-medium">Share</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.branchComparison || []).map((branch: any) => {
                                    let value = 0;
                                    let total = 0;
                                    let displayValue = "";

                                    if (selectedMetric === 'leads') {
                                        value = branch.leads;
                                        displayValue = value.toString();
                                        total = data?.overall?.totalLeads || 1;
                                    } else if (selectedMetric === 'admissions') {
                                        value = branch.conversions;
                                        displayValue = value.toString();
                                        total = data?.overall?.totalAdmissions || 1;
                                    } else if (selectedMetric === 'revenue') {
                                        value = branch.revenue;
                                        displayValue = formatCurrency(value);
                                        total = data?.overall?.totalRevenue || 1;
                                    } else if (selectedMetric === 'collections') {
                                        value = branch.collected;
                                        displayValue = formatCurrency(value);
                                        total = data?.overall?.totalCollected || 1;
                                    }

                                    return (
                                        <tr key={branch.branch} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="p-3 font-medium">{branch.branch}</td>
                                            <td className="p-3 text-right">{displayValue}</td>
                                            {(selectedMetric === 'revenue' || selectedMetric === 'collections') && (
                                                <td className="p-3 text-right text-muted-foreground italic">
                                                    {((value / total) * 100).toFixed(1)}%
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Gap Detail Modal */}
            <Dialog open={!!gapDetailModal?.open} onOpenChange={() => setGapDetailModal(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 capitalize">
                            {gapDetailModal?.filter === 'total' && <ShieldAlert className="h-5 w-5 text-rose-500" />}
                            {gapDetailModal?.filter === 'improving' && <RefreshCw className="h-5 w-5 text-amber-500" />}
                            {gapDetailModal?.filter === 'resolved' && <Target className="h-5 w-5 text-emerald-500" />}
                            {gapFilterLabel()} — {gapDetailModal?.category?.charAt(0).toUpperCase()}{gapDetailModal?.category?.slice(1)}
                        </DialogTitle>
                        <DialogDescription>
                            {gapDetailModal?.filter === 'total' && 'All identified performance gaps for this category.'}
                            {gapDetailModal?.filter === 'improving' && 'Gaps currently under active improvement plans.'}
                            {gapDetailModal?.filter === 'resolved' && 'Gaps that have been successfully resolved.'}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-2 mt-4">
                        {getFilteredGaps().length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground border-2 border-dashed rounded-xl">
                                <ShieldAlert className="h-10 w-10 mb-2 opacity-20" />
                                <p>No entries in this filter.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {getFilteredGaps().map((gap: any) => (
                                    <div key={gap.id} className="flex flex-col gap-3 p-4 rounded-xl border bg-card hover:shadow-sm transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground/80 border">
                                                    {gap.targetUser?.firstName?.[0]}{gap.targetUser?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{gap.targetUser?.firstName} {gap.targetUser?.lastName}</p>
                                                    <p className="text-[10px] text-muted-foreground">Logged by {gap.createdBy?.firstName} · {gap.branch?.name}</p>
                                                </div>
                                            </div>
                                            <Badge className={
                                                gap.status === 'IDENTIFIED' ? 'bg-rose-500' :
                                                    gap.status === 'IMPROVING' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }>
                                                {gap.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-start gap-2 bg-rose-50/60 p-3 rounded-lg border border-rose-100">
                                            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-rose-900">Weakness / Skill Gap</p>
                                                <p className="text-sm text-rose-700 mt-0.5">{gap.weakness}</p>
                                            </div>
                                        </div>
                                        {gap.improvementPlan ? (
                                            <div className="flex items-start gap-2 bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                                                <RefreshCw className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-semibold text-emerald-900">Improvement Plan</p>
                                                    <p className="text-sm text-emerald-700 mt-0.5 italic">{gap.improvementPlan}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-muted-foreground italic px-1">No improvement plan logged yet.</p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground text-right">{new Date(gap.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CeoPerformance;
