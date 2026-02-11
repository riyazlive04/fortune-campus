import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { trainersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TrainerModal from "@/components/TrainerModal";
import PageHeader from "@/components/PageHeader";

const Trainers = () => {
    const [trainers, setTrainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
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
                                                <td className="px-4 py-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditTrainer(trainer.id)}
                                                    >
                                                        View
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
        </div>
    );
};

export default Trainers;
