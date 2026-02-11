import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { notificationsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationsApi.getNotifications({ limit: 5 });
            if (response.success) {
                const notifs = response.data.notifications || [];
                setNotifications(notifs);
                setUnreadCount(notifs.filter((n: any) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAsRead("all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-primary hover:underline"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`group flex gap-3 p-3 hover:bg-muted/50 transition-colors ${!notification.isRead ? "bg-primary/5" : ""
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium line-clamp-1">
                                                {notification.title}
                                            </p>
                                            {!notification.isRead && (
                                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded"
                                            title="Mark as read"
                                        >
                                            <Check className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="border-t p-2">
                        <a
                            href="/notifications"
                            className="block text-center text-xs text-primary hover:underline py-1"
                        >
                            View all notifications
                        </a>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationDropdown;
