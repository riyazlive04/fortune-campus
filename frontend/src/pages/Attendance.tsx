
import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { attendanceApi, branchesApi, batchesApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2, History, Calendar, User, CalendarDays,
  CheckCircle2, XCircle, ClipboardList, Users, Send
} from "lucide-react";
import { format } from "date-fns";

const Attendance = () => {
  // ── Core state ──────────────────────────────────────────────
  const [batches, setBatches] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();
  const currentUser = storage.getUser();
  const isCEO = currentUser?.role === "CEO";
  const isTrainer = currentUser?.role === "TRAINER";

  // ── Batch-wise attendance state ──────────────────────────────
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  // Map: studentId → "PRESENT" | "ABSENT"
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Summary / history state ──────────────────────────────────
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Fetch branches ───────────────────────────────────────────
  useEffect(() => {
    branchesApi.getBranches()
      .then(r => setBranches(r.data?.branches || r.data || []))
      .catch(() => { });
  }, []);

  // ── Fetch batches ────────────────────────────────────────────
  useEffect(() => {
    batchesApi.getBatches({ isActive: true, limit: 200 })
      .then(r => setBatches(r.data?.batches || r.data || []))
      .catch(() => { });
  }, []);

  // ── Load students when batch changes ─────────────────────────
  useEffect(() => {
    if (!selectedBatchId) {
      setBatchStudents([]);
      setAttendanceMap({});
      setSubmitted(false);
      return;
    }
    setLoadingStudents(true);
    setSubmitted(false);
    batchesApi.getBatchById(selectedBatchId)
      .then(r => {
        const batch = r.data?.batch || r.data || {};
        const students: any[] = batch.students || [];
        setBatchStudents(students);
        // Default everyone to PRESENT
        const map: Record<string, string> = {};
        students.forEach((s: any) => { map[s.id] = "PRESENT"; });
        setAttendanceMap(map);
      })
      .catch(() => setBatchStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedBatchId]);

  // ── Fetch attendance summary ─────────────────────────────────
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params: any = {};
      if (selectedBranch && selectedBranch !== "all") params.branchId = selectedBranch;
      if (selectedDate) params.date = selectedDate.toISOString();
      const r = await attendanceApi.getStats(params);
      setAttendanceData(r.data?.summary || (Array.isArray(r.data) ? r.data : []));
    } catch { setAttendanceData([]); }
    finally { setLoadingSummary(false); }
  }, [selectedBranch, selectedDate]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // ── Toggle attendance for one student ────────────────────────
  const toggle = (studentId: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "PRESENT" ? "ABSENT" : "PRESENT",
    }));
  };

  // ── Mark all present / absent ────────────────────────────────
  const markAll = (status: "PRESENT" | "ABSENT") => {
    const map: Record<string, string> = {};
    batchStudents.forEach(s => { map[s.id] = status; });
    setAttendanceMap(map);
  };

  // ── Submit attendance ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedBatchId || batchStudents.length === 0) return;

    const courseId = batchStudents[0]?.courseId;
    if (!courseId) {
      toast({ variant: "destructive", title: "Error", description: "Course ID not found for this batch" });
      return;
    }

    setSubmitting(true);
    const dateStr = selectedDate.toISOString();

    const attendanceRecords = batchStudents.map(student => ({
      studentId: student.id,
      status: attendanceMap[student.id] || "PRESENT"
    }));

    try {
      await attendanceApi.markBatchAttendance({
        courseId,
        date: dateStr,
        attendanceRecords
      });

      toast({ title: "Attendance Saved", description: `Marked ${batchStudents.length} students for ${format(selectedDate, "dd MMM yyyy")}` });
      setSubmitted(true);
      fetchSummary();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save attendance" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Student history ──────────────────────────────────────────
  const fetchStudentHistory = async (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setHistory([]);
    setLoadingHistory(true);
    try {
      const r = await attendanceApi.getAttendance({ studentId: student.id });
      setHistory(r.data?.attendance || []);
    } catch { }
    finally { setLoadingHistory(false); }
  };

  // ── Filtered batches for schedule table ──────────────────────
  const displayedBatches = selectedBranch && selectedBranch !== "all"
    ? batches.filter(b => b.branchId === selectedBranch)
    : batches;

  const presentCount = Object.values(attendanceMap).filter(v => v === "PRESENT").length;
  const absentCount = Object.values(attendanceMap).filter(v => v === "ABSENT").length;

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader title="Attendance & Classes" description="Take batch-wise attendance and track student records" />

      {/* ── Top filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Date picker */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-44 justify-start text-left font-normal gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => { if (date) { setSelectedDate(date); setIsCalendarOpen(false); } }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Branch filter — CEO only */}
        {isCEO && (
          <Select onValueChange={setSelectedBranch} value={selectedBranch}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Branch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── BATCH-WISE ATTENDANCE SECTION ── */}
      {isTrainer && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-border bg-muted/30 gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Take Attendance</h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Batch selector */}
              <div className="w-64">
                <Select onValueChange={(v) => { setSelectedBatchId(v); }} value={selectedBatchId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a batch…" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayedBatches.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} <span className="text-muted-foreground text-xs ml-1">({b.code})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Body */}
          {!selectedBatchId ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Users className="h-10 w-10 opacity-20" />
              <p className="text-sm font-semibold">Select a batch to take attendance</p>
            </div>
          ) : loadingStudents ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Loading students…</p>
            </div>
          ) : batchStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Users className="h-10 w-10 opacity-20" />
              <p className="text-sm font-semibold">No students assigned to this batch yet</p>
            </div>
          ) : (
            <>
              {/* Stats + bulk actions */}
              <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-b border-border">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> {presentCount} Present
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-red-500">
                    <XCircle className="h-4 w-4" /> {absentCount} Absent
                  </span>
                  <span className="text-muted-foreground text-xs">/ {batchStudents.length} total</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => markAll("PRESENT")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >All Present</button>
                  <button
                    onClick={() => markAll("ABSENT")}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors border border-red-200"
                  >All Absent</button>
                </div>
              </div>

              {/* Student list */}
              <div className="divide-y divide-border">
                {batchStudents.map((student: any, idx: number) => {
                  const isPresent = attendanceMap[student.id] === "PRESENT";
                  const name = `${student.user?.firstName || ""} ${student.user?.lastName || ""}`.trim() || "Unknown";
                  const enroll = student.enrollmentNumber || student.user?.email || "";
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between px-6 py-3.5 transition-colors ${isPresent ? "hover:bg-emerald-50/30" : "hover:bg-red-50/30 bg-red-50/10"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6 text-right">{idx + 1}</span>
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-black ${isPresent ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{name}</p>
                          <p className="text-[11px] text-muted-foreground">{enroll}</p>
                        </div>
                      </div>
                      {/* Toggle button */}
                      <button
                        onClick={() => toggle(student.id)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${isPresent
                          ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                          : "bg-red-500 text-white border-red-500 hover:bg-red-600"
                          }`}
                      >
                        {isPresent
                          ? <><CheckCircle2 className="h-3.5 w-3.5" /> Present</>
                          : <><XCircle className="h-3.5 w-3.5" /> Absent</>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Submit */}
              <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Date: <span className="font-semibold text-foreground">{format(selectedDate, "EEEE, dd MMM yyyy")}</span>
                </p>
                {submitted ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" /> Attendance Saved!
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {submitting ? "Saving…" : "Submit Attendance"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Schedule table ── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Today's Schedule (Active Batches)</h3>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Time</th><th>Course</th><th>Trainer</th><th>Batch Code</th><th>Branch</th><th>Status</th></tr></thead>
            <tbody>
              {displayedBatches.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No active batches found</td></tr>
              ) : (
                displayedBatches.map((b: any) => (
                  <tr key={b.id}>
                    <td>{b.startTime || "—"} – {b.endTime || "—"}</td>
                    <td>{b.course?.name || "N/A"}</td>
                    <td>{b.trainer?.user ? `${b.trainer.user.firstName} ${b.trainer.user.lastName}` : "Unassigned"}</td>
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

      {/* ── Attendance Summary ── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Attendance Summary</h3>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Course</th><th>Branch</th><th>Present</th><th>Absent</th><th>Percentage</th></tr></thead>
            <tbody>
              {loadingSummary ? (
                <tr><td colSpan={6} className="text-center py-4">Loading attendance data…</td></tr>
              ) : (!Array.isArray(attendanceData) || attendanceData.length === 0) ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No attendance records found</td></tr>
              ) : (
                attendanceData.map((a, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="font-medium whitespace-nowrap">
                      <button
                        onClick={() => fetchStudentHistory(a)}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-all font-bold group text-left"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span>{a.student}</span>
                      </button>
                    </td>
                    <td>{a.course}</td>
                    <td>{a.branch}</td>
                    <td>{a.present}</td>
                    <td>{a.absent}</td>
                    <td>
                      <StatusBadge
                        status={a.percentage}
                        variant={parseInt(a.percentage || "0") >= 85 ? "success" : parseInt(a.percentage || "0") >= 75 ? "warning" : "danger"}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── History Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl font-black text-foreground">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="leading-none">{selectedStudent?.student}</p>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-1.5 opacity-60">
                  <Calendar className="h-3 w-3" /> Attendance History
                </p>
              </div>
            </DialogTitle>
            <DialogDescription className="hidden">Detailed logs for student attendance</DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest animate-pulse">Retrieving Logs…</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">No history records found for this student.</p>
              </div>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-border bg-muted/20 scrollbar-hide">
                <table className="w-full text-[13px]">
                  <thead className="bg-muted/80 backdrop-blur-sm sticky top-0 z-10">
                    <tr className="border-b border-border">
                      <th className="px-6 py-4 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                      <th className="px-6 py-4 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                      <th className="px-6 py-4 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground">Trainer</th>
                      <th className="px-6 py-4 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 bg-card">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">
                          {new Date(h.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={h.status} variant={h.status === 'PRESENT' ? 'success' : 'danger'} />
                        </td>
                        <td className="px-6 py-4 font-semibold text-muted-foreground">
                          {h.trainer?.user ? `${h.trainer.user.firstName} ${h.trainer.user.lastName}` : 'System'}
                        </td>
                        <td className="px-6 py-4 text-[11px] text-muted-foreground/70 leading-relaxed italic">
                          {h.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-black uppercase tracking-widest rounded-lg transition-all"
              >Close Records</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
