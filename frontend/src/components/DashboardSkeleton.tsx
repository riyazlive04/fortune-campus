const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-muted rounded ${className}`}></div>
);

const DashboardSkeleton = () => {
    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-6">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-6">
                        <Skeleton className="h-4 w-24 mb-4" />
                        <Skeleton className="h-10 w-16 mb-2" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6">
                    <Skeleton className="h-4 w-32 mb-4" />
                    <Skeleton className="h-[240px] w-full" />
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                    <Skeleton className="h-4 w-40 mb-4" />
                    <Skeleton className="h-[240px] w-full" />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border p-4">
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="p-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 mb-3">
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-4 flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
