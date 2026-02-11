import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, MessageSquare, CheckCheck } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';



const Notifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Parallel fetch
      const [resNotifs, resWhatsapp] = await Promise.all([
        notificationsApi.getNotifications(),
        notificationsApi.getWhatsappLogs()
      ]);

      setNotifications(resNotifs.data?.notifications || []);
      setWhatsappLogs(resWhatsapp.data?.logs || []);

    } catch (error) {
      console.error("Failed to fetch data", error);
      // toast({ variant: "destructive", title: "Error", description: "Failed to load notifications" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await notificationsApi.markAsRead('all');
      fetchNotifications(); // Refresh list
      toast({ title: "Success", description: "All notifications marked as read" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to mark as read" });
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications & WhatsApp"
        description="View notifications and messaging activity"
        actions={
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <Tabs defaultValue="notifications">
        <TabsList><TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger><TabsTrigger value="whatsapp" className="gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp Logs</TabsTrigger></TabsList>

        <TabsContent value="notifications" className="mt-4">
          <div className="space-y-2">
            {loading && <div className="text-center p-4">Loading notifications...</div>}
            {!loading && notifications.length === 0 && <div className="text-center p-4 text-muted-foreground">No notifications found</div>}

            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-4 rounded-lg border border-border p-4 transition-colors ${!n.isRead ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.isRead ? "bg-primary" : "bg-transparent"}`} />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground">{n.title}</h4>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            {loading ? <div className="p-4 text-center">Loading logs...</div> : !whatsappLogs.length ? <div className="p-4 text-center text-muted-foreground">No WhatsApp logs found</div> : (
              <table className="data-table">
                <thead><tr><th>Recipient</th><th>Template</th><th>Status</th><th>Sent At</th></tr></thead>
                <tbody>
                  {whatsappLogs.map((w: any, i: number) => {
                    const recipient = w.lead ? `${w.lead.firstName} ${w.lead.lastName} (Lead)` : w.admission ? `${w.admission.firstName} ${w.admission.lastName} (Student)` : w.to;
                    return (
                      <tr key={i}>
                        <td className="font-medium">{recipient}</td>
                        <td>{w.messageType || 'Template'}</td>
                        <td><StatusBadge status={w.status} variant={w.status === "sent" || w.status === "delivered" || w.status === "read" ? "success" : "danger"} /></td>
                        <td>{w.sentAt ? new Date(w.sentAt).toLocaleString() : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
