import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

const leads = [
  { id: "L001", name: "Ravi Kumar", phone: "9876543210", source: "Website", branch: "Main Branch", status: "New", date: "2026-02-05" },
  { id: "L002", name: "Anita Desai", phone: "9876543211", source: "Walk-in", branch: "North Branch", status: "Contacted", date: "2026-02-04" },
  { id: "L003", name: "Suresh Nair", phone: "9876543212", source: "Referral", branch: "Main Branch", status: "Interested", date: "2026-02-03" },
  { id: "L004", name: "Meena Joshi", phone: "9876543213", source: "Social Media", branch: "South Branch", status: "Follow-up", date: "2026-02-02" },
  { id: "L005", name: "Karthik R.", phone: "9876543214", source: "Website", branch: "Main Branch", status: "Converted", date: "2026-01-28" },
  { id: "L006", name: "Pooja Sharma", phone: "9876543215", source: "Walk-in", branch: "North Branch", status: "Lost", date: "2026-01-25" },
  { id: "L007", name: "Deepak Yadav", phone: "9876543216", source: "Referral", branch: "South Branch", status: "New", date: "2026-02-06" },
  { id: "L008", name: "Lakshmi V.", phone: "9876543217", source: "Social Media", branch: "Main Branch", status: "Contacted", date: "2026-02-01" },
];

const statusVariant = (s: string) => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
    New: "info", Contacted: "neutral", Interested: "warning", "Follow-up": "warning", Converted: "success", Lost: "danger",
  };
  return map[s] || "neutral";
};

const columns = [
  { key: "id", label: "Lead ID" },
  { key: "name", label: "Name", render: (r: any) => <span className="font-medium">{r.name}</span> },
  { key: "phone", label: "Phone" },
  { key: "source", label: "Source" },
  { key: "branch", label: "Branch" },
  { key: "status", label: "Status", render: (r: any) => <StatusBadge status={r.status} variant={statusVariant(r.status)} /> },
  { key: "date", label: "Date" },
  { key: "actions", label: "", render: () => <Button variant="ghost" size="sm">View</Button> },
];

const Leads = () => (
  <div className="animate-fade-in">
    <PageHeader
      title="Leads & Enquiries"
      description="Manage all incoming leads and follow-ups"
      actions={<Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New Lead</Button>}
    />
    <div className="filter-bar mb-4">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select><SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger><SelectContent><SelectItem value="all">All Sources</SelectItem><SelectItem value="website">Website</SelectItem><SelectItem value="walkin">Walk-in</SelectItem><SelectItem value="referral">Referral</SelectItem><SelectItem value="social">Social Media</SelectItem></SelectContent></Select>
      <Select><SelectTrigger className="w-36"><SelectValue placeholder="Branch" /></SelectTrigger><SelectContent><SelectItem value="all">All Branches</SelectItem><SelectItem value="main">Main Branch</SelectItem><SelectItem value="north">North Branch</SelectItem><SelectItem value="south">South Branch</SelectItem></SelectContent></Select>
      <Select><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="contacted">Contacted</SelectItem><SelectItem value="interested">Interested</SelectItem><SelectItem value="converted">Converted</SelectItem><SelectItem value="lost">Lost</SelectItem></SelectContent></Select>
    </div>
    <DataTable columns={columns} data={leads} searchPlaceholder="Search leads..." />
  </div>
);

export default Leads;
