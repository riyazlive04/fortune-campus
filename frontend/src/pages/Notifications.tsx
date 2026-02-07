import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, MessageSquare } from "lucide-react";

const notifications = [
  { id: 1, title: "New lead from website", message: "Ravi Kumar submitted an enquiry for Full Stack Dev course", time: "2 hours ago", read: false },
  { id: 2, title: "Attendance alert", message: "Rohit S. has attendance below 70% in Full Stack Dev", time: "5 hours ago", read: false },
  { id: 3, title: "Fee payment received", message: "Neha Gupta paid ₹15,000 for Data Science course", time: "1 day ago", read: true },
  { id: 4, title: "Portfolio completed", message: "Karthik R. completed all portfolio items", time: "1 day ago", read: true },
  { id: 5, title: "Placement confirmed", message: "Simran P. placed at DataMin as Data Analyst", time: "2 days ago", read: true },
];

const whatsappLogs = [
  { to: "Ravi Kumar", template: "Lead Follow-up", status: "Delivered", time: "2026-02-07 10:30 AM" },
  { to: "Neha Gupta", template: "Fee Reminder", status: "Read", time: "2026-02-06 03:15 PM" },
  { to: "Arjun M.", template: "Attendance Alert", status: "Delivered", time: "2026-02-06 09:00 AM" },
  { to: "Divya K.", template: "Portfolio Reminder", status: "Failed", time: "2026-02-05 11:45 AM" },
  { to: "Rohit S.", template: "Attendance Alert", status: "Delivered", time: "2026-02-05 09:00 AM" },
];

const Notifications = () => (
  <div className="animate-fade-in">
    <PageHeader title="Notifications & WhatsApp" description="View notifications and messaging activity" />

    <Tabs defaultValue="notifications">
      <TabsList><TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" /> Notifications</TabsTrigger><TabsTrigger value="whatsapp" className="gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp Logs</TabsTrigger></TabsList>

      <TabsContent value="notifications" className="mt-4">
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-4 rounded-lg border border-border p-4 transition-colors ${!n.read ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">{n.title}</h4>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="whatsapp" className="mt-4">
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Recipient</th><th>Template</th><th>Status</th><th>Sent At</th></tr></thead>
            <tbody>
              {whatsappLogs.map((w, i) => (
                <tr key={i}>
                  <td className="font-medium">{w.to}</td><td>{w.template}</td>
                  <td><StatusBadge status={w.status} variant={w.status === "Read" ? "success" : w.status === "Delivered" ? "info" : "danger"} /></td>
                  <td>{w.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export default Notifications;
