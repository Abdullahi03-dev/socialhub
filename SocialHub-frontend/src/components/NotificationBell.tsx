import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NotifActor {
  id: number;
  name: string;
  image?: string;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor: NotifActor;
  post_id?: number;
}

const API_URL = import.meta.env.VITE_API_URL;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getImageUrl(image?: string) {
  if (!image) return undefined;
  if (image.startsWith("http")) return image;
  return `${API_URL}/${image.replace(/^\/+/, "")}`;
}

const typeIcon: Record<string, string> = {
  like: "❤️",
  comment: "💬",
  follow: "👤",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");

  const fetchUnread = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnread(res.data.unread_count);
    } catch {
      /* silent */
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch {
      /* silent */
    }
  };

  const markAllRead = async () => {
    if (!token) return;
    try {
      await axios.post(
        `${API_URL}/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
      markAllRead();
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 glass-panel border border-white/10 rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="font-heading font-semibold text-white text-sm">Notifications</h3>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary hover:text-primary-light transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                    !notif.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getImageUrl(notif.actor?.image)} />
                      <AvatarFallback className="bg-primary-solid text-white text-xs font-bold">
                        {notif.actor?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 text-xs">
                      {typeIcon[notif.type] ?? "🔔"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 leading-snug">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
