import { useState, useEffect } from "react";
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
import {
    Users,
    Target,
    Award,
    TrendingUp,
    Filter,
    Download
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { leadsApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f43f5e"];

const TelecallerAnalytics = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const user = storage.getUser();
    const isCEO = user?.role === "CEO";
    const isTelecaller = user?.role === "TELECALLER";

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = isCEO
                ? await leadsApi.getCEOAnalytics()
                : isTelecaller
                    ? await leadsApi.getTelecallerStats()
                    : await leadsApi.getCPAnalytics();
            if (res.success) {
                setData(res.data);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch analytics",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="flex h-96 items-center justify-center">Loading analytics...</div>;
    }

    const getChartColor = (status: string) => {
        switch (status) {
            case "NEW": return "#3b82f6"; // blue-500
            case "CONTACTED": return "#64748b"; // slate-500
            case "INTERESTED": return "#a855f7"; // purple-500
            case "NEGOTIATING": return "#f97316"; // orange-500
            case "DEMO_SCHEDULED": return "#14b8a6"; // teal-500
            case "CONVERTED": return "#22c55e"; // green-500
            default: return "#6b7280"; // gray-500
        }
    };

    // Transform data for charts
    const chartData: any[] = isCEO
        ? (Array.isArray(data) ? data.map(b => ({
            name: b.name,
            leads: b._count?.leads || 0,
            converted: b._count?.convertedLeads || 0,
            value: b._count?.convertedLeads || 0
        })) : [])
        : isTelecaller
            ? (data && (data as any).stats ? (data as any).stats.map((s: any) => ({
                name: s.status,
                leads: s._count || 0,
                value: s._count || 0
            })) : [])
            : (Array.isArray(data) ? data.map(tc => ({
                name: `${tc.firstName || ''} ${tc.lastName || ''}`.trim() || 'Unknown',
                leads: tc._count?.leadsAssigned || 0,
                conversions: tc._count?.conversions || 0,
                value: tc._count?.conversions || 0
            })) : []);

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title={isCEO ? "CEO Lead Analytics" : isTelecaller ? "My Performance" : "Branch Telecaller Performance"}
                description={isCEO ? "Branch-wise lead distribution and conversion ROI" : isTelecaller ? "Track your lead conversion and activity stats" : "Monitor your branch telecallers' activity and performance"}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="h-4 w-4" /> Filter
                        </Button>
                        <Button size="sm" className="gap-2">
                            <Download className="h-4 w-4" /> Export
                        </Button>
                    </div>
                }
            />

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {chartData.reduce((acc, curr) => acc + (curr.leads || 0), 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Across all {isCEO ? 'branches' : 'telecallers'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {((chartData.reduce((acc, curr) => acc + curr.value, 0) /
                                chartData.reduce((acc, curr) => acc + (curr.leads || 1), 0)) * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Lead to student conversion rate</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Comparison Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Distribution by {isCEO ? "Branch" : isTelecaller ? "Status" : "Telecaller"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    {isTelecaller ? (
                                        <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getChartColor(entry.name)} />
                                            ))}
                                        </Bar>
                                    ) : (
                                        <>
                                            <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="value" name={isCEO ? "Converted" : "Conversions"} fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </>
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Share of leads Pie Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Lead Share</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="leads"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={isTelecaller ? getChartColor(entry.name) : COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Detailed Performance Metric</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{isTelecaller ? "Status" : "Name"}</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">{isTelecaller ? "Count" : "Total Leads"}</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">{isCEO ? "Admissions" : isTelecaller ? "Share" : "Conversions"}</th>
                                    {!isTelecaller && <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Conv. Rate</th>}
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {chartData.map((item, idx) => (
                                    <tr key={idx} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{item.name}</td>
                                        <td className="p-4 align-middle text-right">{isTelecaller ? item.leads : item.leads}</td>
                                        <td className="p-4 align-middle text-right">{isTelecaller ? `${((item.leads / chartData.reduce((acc, curr) => acc + curr.leads, 0)) * 100).toFixed(1)}%` : item.value}</td>
                                        {!isTelecaller && (
                                            <td className="p-4 align-middle text-right font-bold text-success">
                                                {((item.value / (item.leads || 1)) * 100).toFixed(1)}%
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TelecallerAnalytics;
