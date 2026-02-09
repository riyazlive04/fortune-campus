import { useState, useEffect } from "react";
import { Plus, Filter, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { leadsApi, branchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import LeadModal from "@/components/LeadModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    branchId: "all",
    source: "all"
  });
  const { toast } = useToast();

  const fetchBranches = async () => {
    try {
      const data = await branchesApi.getBranches();
      if (data.success) {
        setBranches(data.data.branches || data.data);
      }
    } catch (error) {
      console.error("Failed to fetch branches", error);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);

      // Prepare API params
      const params: any = {};
      if (filters.status !== "all") params.status = filters.status;
      if (filters.branchId !== "all") params.branchId = filters.branchId;
      // Note: Backend might not support source filter yet, 
      // but we add it for future-proofing or handle locally if needed.

      const data = await leadsApi.getLeads(params);
      // Map API data to table format
      const mappedLeads = data.data.leads.map((l: any) => ({
        id: l.id,
        leadId: (l.id && l.id.length >= 8) ? l.id.substring(0, 8).toUpperCase() : "N/A",
        name: `${l.firstName} ${l.lastName}`,
        phone: l.phone,
        source: l.source,
        branch: l.branch?.name || "N/A",
        status: l.status,
        date: new Date(l.createdAt).toLocaleDateString(),
      }));

      // If source filter is set and not handled by backend, filter locally
      let finalLeads = mappedLeads;
      if (filters.source !== "all") {
        finalLeads = mappedLeads.filter((l: any) => l.source === filters.source);
      }

      setLeads(finalLeads);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch leads",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filters]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenModal = (id?: string) => {
    setSelectedLeadId(id || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLeadId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await leadsApi.deleteLead(deleteId);
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      fetchLeads();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete lead",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const statusVariant = (s: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
      NEW: "info",
      CONTACTED: "neutral",
      QUALIFIED: "success",
      NEGOTIATING: "warning",
      CONVERTED: "success",
      LOST: "danger",
    };
    return map[s] || "neutral";
  };

  const columns = [
    { key: "leadId", label: "Lead ID" },
    { key: "name", label: "Name", render: (r: any) => <span className="font-medium">{r.name}</span> },
    { key: "phone", label: "Phone" },
    { key: "source", label: "Source" },
    { key: "branch", label: "Branch" },
    { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} variant={statusVariant(r.status)} /> },
    { key: "date", label: "Date" },
    {
      key: "actions",
      label: "Actions",
      render: (r: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleOpenModal(r.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteId(r.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leads & Enquiries"
        description="Manage all incoming leads and follow-ups"
        actions={
          <Button size="sm" className="gap-2" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4" /> New Lead
          </Button>
        }
      />
      <div className="filter-bar mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="WEBSITE">Website</SelectItem>
            <SelectItem value="WALK_IN">Walk-in</SelectItem>
            <SelectItem value="REFERRAL">Referral</SelectItem>
            <SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.branchId} onValueChange={(v) => setFilters({ ...filters, branchId: v })}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="QUALIFIED">Qualified</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        columns={columns}
        data={leads}
        searchPlaceholder="Search leads..."
        isLoading={loading}
      />

      <LeadModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSuccess={fetchLeads}
        leadId={selectedLeadId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Leads;
