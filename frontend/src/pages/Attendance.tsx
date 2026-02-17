
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { attendanceApi, branchesApi, batchesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchesApi.getBranches();
        if (response.success && response.data?.branches) {
          setBranches(response.data.branches);
        } else {
          setBranches(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Failed to fetch branches", error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await batchesApi.getBatches({ isActive: true });
        if (response.success && response.data?.batches) {
          setBatches(response.data.batches);
        } else {
          setBatches(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error("Failed to fetch batches", error);
      }
    };
    fetchBatches();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const response = await attendanceApi.getStats();
        if (response.success && response.data?.summary) {
          setAttendanceData(response.data.summary);
        } else {
          setAttendanceData(Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error("Failed to fetch attendance stats", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch attendance data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Filter batches based on selected branch if needed
  const displayedBatches = selectedBranch && selectedBranch !== "all"
    ? (Array.isArray(batches) ? batches : []).filter(b => b.branchId === selectedBranch)
    : (Array.isArray(batches) ? batches : []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Attendance & Classes" description="Track daily attendance and class schedule" />

      <div className="mb-4 flex gap-3">
        <Select><SelectTrigger className="w-40"><SelectValue placeholder="Select Date" /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="yesterday">Yesterday</SelectItem></SelectContent></Select>
        <Select onValueChange={setSelectedBranch}><SelectTrigger className="w-40"><SelectValue placeholder="Branch" /></SelectTrigger><SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {(Array.isArray(branches) ? branches : []).map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent></Select>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Today's Schedule (Active Batches)</h3>
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Course</th><th>Trainer</th><th>Batch Code</th><th>Branch</th><th>Status</th></tr></thead>
              <tbody>
                {displayedBatches.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No active batches found</td></tr>
                ) : (
                  displayedBatches.map((b: any) => (
                    <tr key={b.id}>
                      <td>{b.startTime || "10:00 AM"} - {b.endTime || "12:00 PM"}</td>
                      <td>{b.course?.name || "N/A"}</td>
                      <td>{b.trainer?.user?.firstName || "Unassigned"}</td>
                      <td>{b.code || "N/A"}</td>
                      <td>{b.branch?.name || "N/A"}</td>
                      <td><StatusBadge status={b.isActive ? "Active" : "Inactive"} variant={b.isActive ? "success" : "neutral"} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Attendance Summary</h3>
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Course</th><th>Present</th><th>Absent</th><th>Percentage</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4">Loading attendance data...</td></tr>
                ) : (!Array.isArray(attendanceData) || attendanceData.length === 0) ? (
                  <tr><td colSpan={5} className="text-center py-4">No attendance records found</td></tr>
                ) : (
                  (Array.isArray(attendanceData) ? attendanceData : []).map((a, i) => (
                    <tr key={i}>
                      <td className="font-medium">{a.student}</td><td>{a.course}</td><td>{a.present}</td><td>{a.absent}</td>
                      <td><StatusBadge status={a.percentage} variant={parseInt(a.percentage || "0") >= 85 ? "success" : parseInt(a.percentage || "0") >= 75 ? "warning" : "danger"} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
