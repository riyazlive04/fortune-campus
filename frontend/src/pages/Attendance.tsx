
import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { attendanceApi, branchesApi, batchesApi, studentsApi, trainersApi, storage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2, History as HistoryIcon, Calendar, User, CalendarDays,
  CheckCircle2, XCircle, ClipboardList, Users, Send, Search
} from "lucide-react";
import { format } from "date-fns";
import StudentHistoryModal from "@/components/StudentHistoryModal";

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
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState<any | null>(null);
  const [summaryCourseFilter, setSummaryCourseFilter] = useState("all");
  const [summaryStudentFilter, setSummaryStudentFilter] = useState("");

  // ── Global Student Dropdown State ───────────────────────────
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loadingAllStudents, setLoadingAllStudents] = useState(false);
  const [studentDropdownSearch, setStudentDropdownSearch] = useState("");

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

  // ── Substitute Trainer state ──────────────────────────────
  const [isSubstituteMode, setIsSubstituteMode] = useState(false);
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>("");
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  // ── Fetch trainers when substitute mode is enabled ──────────
  useEffect(() => {
    if (!isSubstituteMode) {
      setSelectedSubstituteId("");
      return;
    }
    setLoadingTrainers(true);
    trainersApi.getTrainers({ isActive: true, limit: 1000, allowGlobal: true })
      .then(r => setAvailableTrainers(r.data?.trainers || r.data || []))
      .catch(() => setAvailableTrainers([]))
      .finally(() => setLoadingTrainers(false));
  }, [isSubstituteMode]);

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

        // Auto-select original trainer as default substitute if mode is on
        if (isSubstituteMode && batch.trainerId) {
          setSelectedSubstituteId(batch.trainerId);
        }
      })
      .catch(() => setBatchStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [selectedBatchId, isSubstituteMode]);

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

  // ── Fetch all students for dropdown ──────────────────────────
  useEffect(() => {
    setLoadingAllStudents(true);
    const params: any = { limit: 500 };
    if (!isCEO && currentUser?.branchId) params.branchId = currentUser?.branchId;
    studentsApi.getStudents(params)
      .then(r => setAllStudents(r.data?.students || r.data || []))
      .catch(() => setAllStudents([]))
      .finally(() => setLoadingAllStudents(false));
  }, [isCEO, currentUser?.branchId]);

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

    if (isSubstituteMode && !selectedSubstituteId) {
      toast({ variant: "destructive", title: "Substitute Required", description: "Please select a substitute trainer" });
      return;
    }

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
      const selectedBatch = batches.find(b => b.id === selectedBatchId);
      await attendanceApi.markBatchAttendance({
        courseId,
        date: dateStr,
        trainerId: isSubstituteMode ? selectedSubstituteId : (selectedBatch?.trainerId || undefined),
        isSubstitute: isSubstituteMode,
        originalTrainerId: !isSubstituteMode ? undefined : selectedBatch?.trainerId,
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

        {/* Global Student History Dropdown */}
        <Popover open={isStudentDropdownOpen} onOpenChange={setIsStudentDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="secondary" className="gap-2 font-bold shadow-sm border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700">
              <HistoryIcon className="h-4 w-4" />
              Student History
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b border-border">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Select a Student
              </h4>
              {/* Quick filter inside dropdown */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter students…"
                  value={studentDropdownSearch}
                  onChange={(e) => setStudentDropdownSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {loadingAllStudents ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Loading students…</span>
                </div>
              ) : (() => {
                const filtered = allStudents.filter(s => {
                  const name = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
                  const enroll = (s.enrollmentNumber || '').toLowerCase();
                  const q = studentDropdownSearch.toLowerCase();
                  return name.includes(q) || enroll.includes(q);
                });
                return filtered.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    {allStudents.length === 0 ? 'No students found' : 'No match for your filter'}
                  </div>
                ) : (
                  filtered.map(s => {
                    const name = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'Unknown';
                    const enroll = s.enrollmentNumber || s.user?.email || '';
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedHistoryStudent(s);
                          setIsStudentDropdownOpen(false);
                          setStudentDropdownSearch('');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
                      >
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                          {enroll && <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold truncate">{enroll}</p>}
                        </div>
                      </button>
                    );
                  })
                );
              })()}
            </div>
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
      {(isTrainer || currentUser?.role === "CHANNEL_PARTNER" || isCEO) && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-border bg-muted/30 gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Take Attendance</h3>
            </div>

            <div className="flex items-center gap-4">
              {/* Substitute Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200">
                <span className="text-[10px] font-black uppercase text-yellow-700 tracking-tighter">Substitute?</span>
                <input
                  type="checkbox"
                  checked={isSubstituteMode}
                  onChange={(e) => setIsSubstituteMode(e.target.checked)}
                  className="h-4 w-4 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                />
              </div>

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

          {/* Substitute Trainer Selector (Conditional) */}
          {isSubstituteMode && (
            <div className="px-6 py-3 bg-yellow-50/50 border-b border-yellow-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <User className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-tight">Select Substitute Trainer:</span>
              </div>
              <div className="flex-1 max-w-sm">
                <Select onValueChange={setSelectedSubstituteId} value={selectedSubstituteId}>
                  <SelectTrigger className="h-8 text-xs bg-white border-yellow-200">
                    <SelectValue placeholder={loadingTrainers ? "Loading trainers..." : "Choose trainer..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTrainers.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.user?.firstName} {t.user?.lastName} <span className="text-[10px] text-muted-foreground ml-1">({t.branch?.name})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
                      {/* Actions column */}
                      <div className="flex items-center gap-3">
                        {/* Toggle button */}
                        <button
                          onClick={() => toggle(student.id)}
                          className={`flex items-center w-[90px] justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isPresent
                            ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-sm"
                            : "bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-sm"
                            }`}
                        >
                          {isPresent ? <><CheckCircle2 className="h-3.5 w-3.5" /> Present</> : <><XCircle className="h-3.5 w-3.5" /> Absent</>}
                        </button>

                        {/* History Button */}
                        <button
                          onClick={() => setSelectedHistoryStudent(student)}
                          className="flex items-center justify-center p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm"
                          title="View Attendance History"
                        >
                          <HistoryIcon className="h-4 w-4" />
                        </button>
                      </div>
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
                displayedBatches.map((b: any) => {
                  const filterValue = b.code && b.code !== "N/A" ? `${b.course?.name || ""} - ${b.code}` : b.course?.name;
                  return (
                    <tr
                      key={b.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => {
                        if (filterValue) {
                          setSummaryCourseFilter(filterValue);
                          // Scroll down to the summary table smoothly
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }
                      }}
                      title={`Click to view attendance summary for ${filterValue}`}
                    >
                      <td>{b.startTime || "—"} – {b.endTime || "—"}</td>
                      <td className="font-bold text-primary">{b.course?.name || "N/A"}</td>
                      <td>{b.trainer?.user ? `${b.trainer.user.firstName} ${b.trainer.user.lastName}` : "Unassigned"}</td>
                      <td>{b.code || "N/A"}</td>
                      <td>{b.branch?.name || "N/A"}</td>
                      <td><StatusBadge status={b.isActive ? "Active" : "Inactive"} variant={b.isActive ? "success" : "neutral"} /></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Attendance Summary ── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Attendance Summary</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                value={summaryStudentFilter}
                onChange={(e) => setSummaryStudentFilter(e.target.value)}
                className="w-56 pl-9 h-9 border-border bg-background"
              />
            </div>
            <Select onValueChange={setSummaryCourseFilter} value={summaryCourseFilter}>
              <SelectTrigger className="w-48 h-9 border-border bg-background">
                <SelectValue placeholder="Filter by Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses / Batches</SelectItem>
                {/* Dynamically extract unique course+batch combinations from attendance data */}
                {Array.from(new Set((Array.isArray(attendanceData) ? attendanceData : []).map(a => a.batch && a.batch !== 'Unassigned' ? `${a.course} - ${a.batch}` : a.course).filter(Boolean))).map(course => (
                  <SelectItem key={course} value={course as string}>{course as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Course</th><th>Branch</th><th>Present</th><th>Absent</th><th>Percentage</th></tr></thead>
            <tbody>
              {loadingSummary ? (
                <tr><td colSpan={6} className="text-center py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />Loading attendance data…</td></tr>
              ) : (!Array.isArray(attendanceData) || attendanceData.length === 0) ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground"><ClipboardList className="h-8 w-8 mx-auto mb-3 opacity-20" />No attendance records found</td></tr>
              ) : (() => {
                const filteredData = attendanceData.filter(a => {
                  const matchStudent = !summaryStudentFilter || (a.student && a.student.toLowerCase().includes(summaryStudentFilter.toLowerCase()));
                  const aFilterKey = a.batch && a.batch !== 'Unassigned' ? `${a.course} - ${a.batch}` : a.course;
                  const matchCourse = summaryCourseFilter === "all" || aFilterKey === summaryCourseFilter || a.course === summaryCourseFilter;
                  return matchStudent && matchCourse;
                });

                if (filteredData.length === 0) {
                  return <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No records match your filters</td></tr>;
                }

                return filteredData.map((a, i) => (
                  <tr key={`${a.student}-${a.course}-${i}`} className="hover:bg-muted/30 transition-colors">
                    <td className="font-medium whitespace-nowrap">
                      <button
                        onClick={() => setSelectedHistoryStudent({ id: a.id, name: a.student })}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-all font-bold group text-left"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span>{a.student}</span>
                      </button>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span>{a.course}</span>
                        {a.batch && a.batch !== 'Unassigned' && (
                          <span className="text-[10px] bg-muted w-fit px-1.5 py-0.5 rounded text-muted-foreground font-semibold uppercase mt-1">
                            {a.batch}
                          </span>
                        )}
                      </div>
                    </td>
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
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render the generic StudentHistoryModal passing the whole student object */}
      <StudentHistoryModal
        isOpen={!!selectedHistoryStudent}
        onClose={() => setSelectedHistoryStudent(null)}
        student={selectedHistoryStudent}
        courseFilter={summaryCourseFilter}
      />
    </div>
  );
};

export default Attendance;
