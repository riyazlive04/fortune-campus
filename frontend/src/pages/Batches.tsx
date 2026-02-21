import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, Users, Clock, BookOpen, X, Loader2, ChevronRight, UserPlus, UserMinus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ClockPicker from "@/components/ClockPicker";
import { batchesApi, studentsApi, branchesApi, storage, API_BASE_URL } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Batches = () => {
    const [batches, setBatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editBatch, setEditBatch] = useState<any>(null);
    const [detailBatch, setDetailBatch] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailTab, setDetailTab] = useState<"info" | "students" | "assign">("info");
    const [courses, setCourses] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", code: "", courseId: "", branchId: "", startTime: "", endTime: "" });

    // Branch filter for student assignment
    const [branchFilter, setBranchFilter] = useState("");

    // Student assignment state
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [studentSearch, setStudentSearch] = useState("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);

    // Students for the create modal (filtered by selected branch)
    const [modalStudents, setModalStudents] = useState<any[]>([]);
    const [modalStudentSearch, setModalStudentSearch] = useState("");
    const [modalSelectedIds, setModalSelectedIds] = useState<string[]>([]);
    const [modalStudentsLoading, setModalStudentsLoading] = useState(false);

    const { toast } = useToast();
    const user = storage.getUser();
    const isCEO = user?.role === "CEO" || user?.role === "ADMIN";

    const fetchBatches = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (search) params.search = search;
            const res = await batchesApi.getBatches(params);
            const data = res.data?.batches || res.data || [];
            setBatches(Array.isArray(data) ? data : []);
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message || "Failed to fetch batches" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, [search]);

    useEffect(() => {
        const loadSupportData = async () => {
            try {
                const token = storage.getToken();
                const [coursesRes, branchesRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/courses`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    branchesApi.getBranches(),
                ]);
                const coursesJson = await coursesRes.json();
                const coursesData = coursesJson.data?.courses || coursesJson.data?.data || coursesJson.data || [];
                setCourses(Array.isArray(coursesData) ? coursesData : []);
                const branchesData = branchesRes.data?.branches || branchesRes.data || [];
                setBranches(Array.isArray(branchesData) ? branchesData : []);
            } catch { }
        };
        loadSupportData();
    }, []);

    // Load students for the create modal when branch is selected
    useEffect(() => {
        if (!showModal || editBatch || !form.branchId) {
            setModalStudents([]);
            setModalSelectedIds([]);
            return;
        }
        const loadModalStudents = async () => {
            setModalStudentsLoading(true);
            try {
                const res = await studentsApi.getStudents({ branchId: form.branchId, limit: 1000 });
                const data = res.data?.students || res.data || [];
                setModalStudents(Array.isArray(data) ? data : []);
            } catch {
                setModalStudents([]);
            } finally {
                setModalStudentsLoading(false);
            }
        };
        loadModalStudents();
    }, [form.branchId, showModal, editBatch]);

    // Auto-generate batch name when course, month or start time changes
    useEffect(() => {
        if (!editBatch && form.courseId && form.code) {
            const course = courses.find((c: any) => c.id === form.courseId);
            if (course) {
                const shortMonth = form.code.substring(0, 3);
                let name = `${course.code}_${shortMonth}`;
                if (form.startTime) {
                    name += `_${form.startTime.split(' ')[0]}`;
                }
                setForm(prev => ({ ...prev, name }));
            }
        }
    }, [form.courseId, form.code, form.startTime, courses, editBatch]);

    const openCreate = () => {
        setEditBatch(null);
        setForm({ name: "", code: "", courseId: "", branchId: "", startTime: "", endTime: "" });
        setModalStudents([]);
        setModalSelectedIds([]);
        setModalStudentSearch("");
        setShowModal(true);
    };

    const openEdit = (batch: any) => {
        setEditBatch(batch);
        setForm({
            name: batch.name || "",
            code: batch.code || "",
            courseId: batch.courseId || batch.course?.id || "",
            branchId: batch.branchId || batch.branch?.id || "",
            startTime: batch.startTime || "",
            endTime: batch.endTime || "",
        });
        setShowModal(true);
    };

    const openDetail = async (batch: any) => {
        setDetailBatch(batch);
        setDetailTab("info");
        setDetailLoading(true);
        setSelectedStudentIds([]);
        setStudentSearch("");
        try {
            const res = await batchesApi.getBatchById(batch.id);
            setDetailBatch(res.data?.batch || res.data || batch);
        } catch { }
        setDetailLoading(false);
    };

    const loadAllStudents = async () => {
        try {
            const res = await studentsApi.getStudents({ limit: 200 });
            const data = res.data?.students || res.data || [];
            setAllStudents(Array.isArray(data) ? data : []);
        } catch { }
    };

    const handleTabChange = (tab: "info" | "students" | "assign") => {
        setDetailTab(tab);
        if (tab === "assign") {
            setBranchFilter(""); // Reset filter when opening assign tab
            if (allStudents.length === 0) {
                loadAllStudents();
            }
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.code || !form.courseId) {
            toast({ variant: "destructive", title: "Validation", description: "Name, Code, and Course are required" });
            return;
        }
        if (isCEO && !editBatch && !form.branchId) {
            toast({ variant: "destructive", title: "Validation", description: "Please select a branch" });
            return;
        }
        setSaving(true);
        try {
            if (editBatch) {
                await batchesApi.updateBatch(editBatch.id, form);
                toast({ title: "Success", description: "Batch updated successfully" });
            } else {
                const res = await batchesApi.createBatch(form);
                const newBatchId = res.data?.batch?.id || res.data?.id;
                // Auto-assign selected students if any
                if (newBatchId && modalSelectedIds.length > 0) {
                    try {
                        await batchesApi.assignStudents(newBatchId, modalSelectedIds);
                    } catch { /* non-fatal */ }
                }
                toast({ title: "Success", description: `Batch created${modalSelectedIds.length > 0 ? ` with ${modalSelectedIds.length} student(s)` : ""}` });
            }
            setShowModal(false);
            fetchBatches();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this batch?")) return;
        try {
            await batchesApi.deleteBatch(id);
            toast({ title: "Deleted", description: "Batch deleted successfully" });
            fetchBatches();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        }
    };

    const toggleStudentSelection = (id: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleAssignStudents = async () => {
        if (!detailBatch || selectedStudentIds.length === 0) return;
        setAssigning(true);
        try {
            await batchesApi.assignStudents(detailBatch.id, selectedStudentIds);
            toast({ title: "Success", description: `${selectedStudentIds.length} student(s) assigned to batch` });
            setSelectedStudentIds([]);
            // Refresh detail
            const res = await batchesApi.getBatchById(detailBatch.id);
            setDetailBatch(res.data?.batch || res.data || detailBatch);
            setDetailTab("students");
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!detailBatch) return;
        setRemoving(studentId);
        try {
            await batchesApi.removeStudent(detailBatch.id, studentId);
            toast({ title: "Removed", description: "Student removed from batch" });
            const res = await batchesApi.getBatchById(detailBatch.id);
            setDetailBatch(res.data?.batch || res.data || detailBatch);
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setRemoving(null);
        }
    };

    // Students not already in this batch
    const enrolledIds = new Set((detailBatch?.students || []).map((s: any) => s.id));
    const availableStudents = allStudents.filter(s => {
        if (enrolledIds.has(s.id)) return false;
        if (branchFilter && s.branchId !== branchFilter) return false;
        if (!studentSearch) return true;
        const name = `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase();
        return name.includes(studentSearch.toLowerCase());
    });

    return (
        <div className="animate-fade-in">
            <PageHeader title="Batches" description="Manage course batches and student assignments" />

            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                {isCEO && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Batch
                    </button>
                )}
            </div>

            {/* Batch Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : batches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-semibold">No batches found</p>
                    <p className="text-sm mt-1">Create a new batch to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {batches.map((batch) => (
                        <div
                            key={batch.id}
                            className="group relative rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => openDetail(batch)}
                        >
                            <div className="absolute top-4 right-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${batch.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                    {batch.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-[15px] leading-tight">{batch.name}</h3>
                                    <p className="text-[11px] text-muted-foreground font-mono">{batch.code}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5 text-[12px] text-muted-foreground">
                                {batch.course && (
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{batch.course.name}</span>
                                    </div>
                                )}
                                {batch.trainer && (
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{batch.trainer.user?.firstName} {batch.trainer.user?.lastName}</span>
                                    </div>
                                )}
                                {(batch.startTime || batch.endTime) && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span>{batch.startTime || "—"} – {batch.endTime || "—"}</span>
                                    </div>
                                )}
                                {batch.branch && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px]">📍</span>
                                        <span>{batch.branch.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{batch._count?.students ?? 0} Students</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isCEO && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEdit(batch); }}
                                                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(batch.id); }}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-lg font-black text-foreground">{editBatch ? "Edit Batch" : "New Batch"}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1 block">Batch Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Morning Batch A"
                                    disabled={!editBatch}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1 block">Batch Month *</label>
                                <select
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    disabled={!!editBatch}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                                >
                                    <option value="">Select a month</option>
                                    {[
                                        "January", "February", "March", "April", "May", "June",
                                        "July", "August", "September", "October", "November", "December"
                                    ].map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1 block">Course *</label>
                                <select
                                    value={form.courseId}
                                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">Select a course</option>
                                    {courses.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            {isCEO && (
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1 block">Branch *</label>
                                    <select
                                        value={form.branchId}
                                        onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        <option value="">Select a branch</option>
                                        {branches.map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <ClockPicker
                                    label="Start Time"
                                    value={form.startTime}
                                    onChange={(v) => setForm({ ...form, startTime: v })}
                                />
                                <ClockPicker
                                    label="End Time"
                                    value={form.endTime}
                                    onChange={(v) => setForm({ ...form, endTime: v })}
                                />
                            </div>
                            {/* Student selection — only for new batch after branch is chosen */}
                            {!editBatch && (
                                <div>
                                    <label className="text-[11px] font-bold uppercase text-muted-foreground mb-1 block">
                                        Add Students {modalSelectedIds.length > 0 && <span className="text-primary">({modalSelectedIds.length} selected)</span>}
                                    </label>
                                    {!form.branchId ? (
                                        <p className="text-xs text-muted-foreground italic py-2">Select a branch above to see available students</p>
                                    ) : modalStudentsLoading ? (
                                        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading students...
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative mb-2">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    placeholder="Search students..."
                                                    value={modalStudentSearch}
                                                    onChange={(e) => setModalStudentSearch(e.target.value)}
                                                    className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                />
                                            </div>
                                            <div className="max-h-44 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                                                {modalStudents.filter(s => {
                                                    if (!modalStudentSearch) return true;
                                                    const name = `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase();
                                                    return name.includes(modalStudentSearch.toLowerCase());
                                                }).length === 0 ? (
                                                    <p className="text-xs text-muted-foreground text-center py-4">No students found in this branch</p>
                                                ) : (
                                                    modalStudents
                                                        .filter(s => {
                                                            if (!modalStudentSearch) return true;
                                                            const name = `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase();
                                                            return name.includes(modalStudentSearch.toLowerCase());
                                                        })
                                                        .map((s: any) => (
                                                            <label
                                                                key={s.id}
                                                                className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={modalSelectedIds.includes(s.id)}
                                                                    onChange={() => setModalSelectedIds(prev =>
                                                                        prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                                                    )}
                                                                    className="rounded"
                                                                />
                                                                <div>
                                                                    <p className="text-sm font-medium">{s.user?.firstName} {s.user?.lastName}</p>
                                                                    <p className="text-[11px] text-muted-foreground">{s.enrollmentNumber || s.user?.email}</p>
                                                                </div>
                                                            </label>
                                                        ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 rounded-xl border border-border py-2 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editBatch ? "Save Changes" : "Create Batch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Detail Modal */}
            {detailBatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-xl font-black text-foreground">{detailBatch.name}</h2>
                                <p className="text-[12px] text-muted-foreground font-mono mt-0.5">{detailBatch.code}</p>
                            </div>
                            <button onClick={() => setDetailBatch(null)} className="p-2 rounded-full hover:bg-muted transition-colors">
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-border px-6">
                            {[
                                { key: "info", label: "Batch Info" },
                                { key: "students", label: `Enrolled (${detailBatch.students?.length ?? 0})` },
                                { key: "assign", label: "Assign Students" },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabChange(tab.key as any)}
                                    className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${detailTab === tab.key
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="overflow-auto flex-1 p-6">
                            {detailLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : detailTab === "info" ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-muted/30 p-4">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Course</p>
                                        <p className="font-semibold text-foreground text-sm">{detailBatch.course?.name || "—"}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 p-4">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Trainer</p>
                                        <p className="font-semibold text-foreground text-sm">
                                            {detailBatch.trainer ? `${detailBatch.trainer.user?.firstName} ${detailBatch.trainer.user?.lastName}` : "Not assigned"}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 p-4">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Schedule</p>
                                        <p className="font-semibold text-foreground text-sm">{detailBatch.startTime || "—"} – {detailBatch.endTime || "—"}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 p-4">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Branch</p>
                                        <p className="font-semibold text-foreground text-sm">{detailBatch.branch?.name || "—"}</p>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 p-4">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Status</p>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${detailBatch.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                            {detailBatch.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <div className="rounded-xl bg-muted/30 p-4">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Total Students</p>
                                        <p className="font-semibold text-foreground text-sm">{detailBatch.students?.length ?? 0}</p>
                                    </div>
                                </div>
                            ) : detailTab === "students" ? (
                                <>
                                    {!detailBatch.students || detailBatch.students.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                            <Users className="h-10 w-10 mb-3 opacity-30" />
                                            <p className="font-semibold">No students enrolled</p>
                                            <button
                                                onClick={() => handleTabChange("assign")}
                                                className="mt-3 text-sm text-primary font-semibold hover:underline"
                                            >
                                                Assign students →
                                            </button>
                                        </div>
                                    ) : (
                                        <table className="w-full text-[13px]">
                                            <thead>
                                                <tr className="border-b border-border text-left">
                                                    <th className="pb-2 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Name</th>
                                                    <th className="pb-2 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Email</th>
                                                    <th className="pb-2 pr-4 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Course</th>
                                                    {isCEO && <th className="pb-2 font-bold text-muted-foreground uppercase text-[11px] tracking-wider">Action</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailBatch.students.map((s: any) => (
                                                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                        <td className="py-2.5 pr-4 font-semibold text-foreground">
                                                            {s.user?.firstName} {s.user?.lastName}
                                                        </td>
                                                        <td className="py-2.5 pr-4 text-muted-foreground">{s.user?.email || "—"}</td>
                                                        <td className="py-2.5 pr-4 text-muted-foreground">{s.course?.name || "—"}</td>
                                                        {isCEO && (
                                                            <td className="py-2.5">
                                                                <button
                                                                    onClick={() => handleRemoveStudent(s.id)}
                                                                    disabled={removing === s.id}
                                                                    className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    {removing === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            ) : (
                                /* Assign Students Tab */
                                <>
                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search students by name..."
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            />
                                        </div>
                                        <select
                                            value={branchFilter}
                                            onChange={(e) => setBranchFilter(e.target.value)}
                                            className="w-full sm:w-48 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <option value="">All Branches</option>
                                            {branches.map((branch: any) => (
                                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAssignStudents}
                                            disabled={selectedStudentIds.length === 0 || assigning}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-40 whitespace-nowrap"
                                        >
                                            {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                            Assign {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ""}
                                        </button>
                                    </div>

                                    {allStudents.length === 0 ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : availableStudents.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground text-sm">
                                            {studentSearch ? "No students match your search" : "All students are already enrolled in this batch"}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {availableStudents.map((s: any) => {
                                                const isSelected = selectedStudentIds.includes(s.id);
                                                return (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => toggleStudentSelection(s.id)}
                                                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${isSelected
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                                                            }`}
                                                    >
                                                        <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                                                            {isSelected && (
                                                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-foreground text-[13px]">
                                                                {s.user?.firstName} {s.user?.lastName}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground truncate">
                                                                {s.user?.email} {s.course?.name ? `• ${s.course.name}` : ""}
                                                            </p>
                                                        </div>
                                                        {s.branch && (
                                                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                                                {s.branch.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Batches;
