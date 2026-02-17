import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import { trainersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TrainerModal from "@/components/TrainerModal";
import TrainerAttendanceModal from "@/components/TrainerAttendanceModal";
import PageHeader from "@/components/PageHeader";
import { CheckSquare } from "lucide-react";

const Trainers = () => {
    const [trainers, setTrainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);

    // Attendance Modal State
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [attendanceTrainer, setAttendanceTrainer] = useState<{ id: string, name: string } | null>(null);

    const { toast } = useToast();

    const fetchTrainers = async () => {
        try {
            setLoading(true);
            const res = await trainersApi.getTrainers();
            setTrainers(res.data?.trainers || res.data || []);
        } catch (error: any) {
            console.error("Failed to fetch trainers", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to fetch trainers",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainers();
    }, []);

    const handleAddTrainer = () => {
        setSelectedTrainerId(null);
        setIsModalOpen(true);
    };

    const handleEditTrainer = (id: string) => {
        setSelectedTrainerId(id);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedTrainerId(null);
    };

    const handleSuccess = () => {
        fetchTrainers();
        handleModalClose();
    };

    const handleMarkAttendance = (trainer: any) => {
        setAttendanceTrainer({
            id: trainer.id,
            name: `${trainer.user?.firstName} ${trainer.user?.lastName}`
        });
        setIsAttendanceModalOpen(true);
    };

    const handleAttendanceSuccess = () => {
        setIsAttendanceModalOpen(false);
        setAttendanceTrainer(null);
        fetchTrainers();
    };

    const handleDeleteTrainer = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this trainer? This action cannot be undone.")) {
            try {
                await trainersApi.deleteTrainer(id);
                toast({
                    title: "Success",
                    description: "Trainer deleted successfully",
                });
                fetchTrainers();
            } catch (error: any) {
                console.error("Failed to delete trainer", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.message || "Failed to delete trainer",
                });
            }
        }
    };

    const filteredTrainers = trainers.filter((trainer) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            trainer.user?.firstName?.toLowerCase().includes(searchLower) ||
            trainer.user?.lastName?.toLowerCase().includes(searchLower) ||
            trainer.employeeId?.toLowerCase().includes(searchLower) ||
            trainer.specialization?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Trainers"
                description="View and manage trainer profiles"
            />

            <Tabs defaultValue="profiles" className="w-full">
                <TabsList>
                    <TabsTrigger value="profiles">Profiles</TabsTrigger>
                </TabsList>

                <TabsContent value="profiles" className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search trainer..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={handleAddTrainer}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Trainer
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Employee ID</th>
                                        <th className="px-4 py-3 text-left font-medium">Name</th>
                                        <th className="px-4 py-3 text-left font-medium">Email</th>
                                        <th className="px-4 py-3 text-left font-medium">Specialization</th>
                                        <th className="px-4 py-3 text-left font-medium">Branch</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : filteredTrainers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                                No records found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTrainers.map((trainer) => (
                                            <tr key={trainer.id} className="hover:bg-muted/50">
                                                <td className="px-4 py-3">{trainer.employeeId}</td>
                                                <td className="px-4 py-3">
                                                    {trainer.user?.firstName} {trainer.user?.lastName}
                                                </td>
                                                <td className="px-4 py-3">{trainer.user?.email}</td>
                                                <td className="px-4 py-3">{trainer.specialization || "-"}</td>
                                                <td className="px-4 py-3">{trainer.branch?.name || "-"}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${trainer.isActive
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                            }`}
                                                    >
                                                        {trainer.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditTrainer(trainer.id)}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-green-600 border-green-200 hover:bg-green-50"
                                                        onClick={() => handleMarkAttendance(trainer)}
                                                    >
                                                        <CheckSquare className="h-3.5 w-3.5 mr-1" />
                                                        Mark attendance
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteTrainer(trainer.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <TrainerModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                trainerId={selectedTrainerId}
            />

            <TrainerAttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                onSuccess={handleAttendanceSuccess}
                trainer={attendanceTrainer}
            />
        </div>
    );
};

export default Trainers;
