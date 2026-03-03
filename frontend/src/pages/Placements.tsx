
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { placementApi, companyApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Placements = () => {
  const [placements, setPlacements] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placementPage, setPlacementPage] = useState(1);
  const [placementSearch, setPlacementSearch] = useState("");
  const [placementMeta, setPlacementMeta] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("placements");
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "placements") {
        const placementsRes = await placementApi.getPlacements({ page: placementPage, search: placementSearch, limit: 10 });
        const fetchedPlacements = placementsRes.data?.placements || placementsRes.data || [];
        setPlacements(fetchedPlacements);
        setPlacementMeta(placementsRes.data?.meta);
      } else if (activeTab === "companies") {
        const companiesRes = await companyApi.getCompanies({ limit: 100 });
        setCompanies(companiesRes.data?.companies || companiesRes.data || []);
      } else if (activeTab === "alumni") {
        const alumniRes = await placementApi.getPlacements({ status: 'PLACED', limit: 100 });
        setAlumni(alumniRes.data?.placements || alumniRes.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch placement data", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch placement data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [placementPage, placementSearch, activeTab, toast]);

  const pCols = [
    { key: "studentName", label: "Student", render: (r: any) => <span className="font-medium">{r.student?.user?.firstName} {r.student?.user?.lastName}</span> },
    { key: "courseName", label: "Course", render: (r: any) => r.student?.course?.name },
    { key: "companyName", label: "Company", render: (r: any) => r.company?.name || '-' },
    { key: "position", label: "Role" }, // 'position' in DB, 'Role' in UI
    { key: "package", label: "Package", render: (r: any) => r.package ? `₹${r.package} LPA` : '-' },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} variant={r.status === "PLACED" ? "success" : r.status === "ELIGIBLE" ? "info" : "neutral"} /> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Placements & Alumni" description="Track placement progress and alumni network">
        {/* Future: Add 'Add Placement' button here */}
      </PageHeader>
      <Tabs defaultValue="placements" onValueChange={setActiveTab}>
        <TabsList><TabsTrigger value="placements">Placements</TabsTrigger><TabsTrigger value="companies">Companies</TabsTrigger><TabsTrigger value="alumni">Alumni</TabsTrigger></TabsList>

        <TabsContent value="placements" className="mt-4">
          <DataTable
            columns={pCols}
            data={placements}
            searchPlaceholder="Search placements..."
            serverSide
            totalItems={placementMeta?.totalItems || 0}
            currentPage={placementPage}
            onPageChange={setPlacementPage}
            onSearchChange={setPlacementSearch}
            isLoading={loading}
          />
        </TabsContent>

        <TabsContent value="companies" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? <div>Loading companies...</div> : companies.length === 0 ? <div className="text-muted-foreground p-4">No companies found</div> : companies.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                <p className="text-xs text-muted-foreground">{c.industry || 'Industry N/A'}</p>
                <div className="mt-3 flex justify-between text-sm">
                  {/* Note: 'Openings' is not in DB schema yet, just showing Placed count from relation if available */}
                  <span className="text-muted-foreground">Placed: {c._count?.placements || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alumni" className="mt-4">
          <DataTable
            columns={pCols}
            data={alumni}
            searchPlaceholder="Search alumni..."
            isLoading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Placements;
