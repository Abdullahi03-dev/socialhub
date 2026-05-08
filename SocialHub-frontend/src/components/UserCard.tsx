import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Calendar, FileText, UserPlus, UserMinus } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  created_at: string;
  posts: number;
}

interface UserCardProps {
  user: UserData;
  onDelete?: (userId: string) => void;
  showDeleteButton?: boolean;
  variant?: "card" | "table";
  isAdmin: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

const UserCard = ({
  user,
  onDelete,
  showDeleteButton = false,
  variant = "card",
  isAdmin,
}: UserCardProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const token = localStorage.getItem("token");

  const getCurrentUserId = (): number | null => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id ?? null;
    } catch {
      return null;
    }
  };
  const currentUserId = getCurrentUserId();
  const isSelf = currentUserId === Number(user.id);

  useEffect(() => {
    if (!token || isSelf) return;
    axios
      .get(`${API_URL}/users/${user.id}/follow-status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setIsFollowing(res.data.is_following);
        setFollowersCount(res.data.followers_count);
      })
      .catch(console.error);
  }, [user.id, token]);

  const handleFollow = async () => {
    if (!token) return toast.error("Please login first.");
    try {
      const res = await axios.post(
        `${API_URL}/users/${user.id}/follow`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsFollowing(res.data.is_following);
      setFollowersCount((prev) => (res.data.is_following ? prev + 1 : prev - 1));
      toast.success(res.data.message, { style: { background: "#18181b", color: "#fff" } });
    } catch {
      toast.error("Failed to update follow status.");
    }
  };

  const handleDelete = () => {
    if (onDelete) onDelete(user.id);
  };

  const getImageUrl = (image?: string) => {
    if (!image) return undefined;
    if (image.startsWith("http")) return image;
    return `${API_URL}/${image.replace(/^\/+/, "")}`;
  };

  if (variant === "table") {
    return (
      <tr className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
        <td className="py-4 px-6">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary-solid text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="py-4 px-6">
          <Badge
            variant={user.role === "admin" ? "default" : "secondary"}
            className={user.role === "admin" ? "bg-primary-solid text-white" : ""}
          >
            {user.role}
          </Badge>
        </td>
        <td className="py-4 px-6 text-sm text-muted-foreground">{user.created_at}</td>
        <td className="py-4 px-6 text-sm text-muted-foreground">{user.posts}</td>
        <td className="py-4 px-6">
          {showDeleteButton && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="border-white/10 bg-white/5 hover:bg-destructive hover:text-white hover:border-destructive transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 hover-lift flex flex-col gap-4">
      {/* Avatar + Name + Role */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
          <AvatarImage src={getImageUrl(user.avatar)} alt={user.name} />
          <AvatarFallback className="bg-primary-solid text-white font-bold text-xl">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-base font-semibold text-white truncate">{user.name}</h3>
          <Badge
            variant={user.role === "admin" ? "default" : "secondary"}
            className={`mt-1 ${user.role === "admin" ? "bg-primary-solid text-white" : ""}`}
          >
            {user.role}
          </Badge>
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-2 text-sm text-muted-foreground border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 truncate">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span>Joined {user.created_at.split("T")[0]}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span>
            <span className="font-semibold text-white">{user.posts}</span> Posts ·{" "}
            <span className="font-semibold text-white">{followersCount}</span> Followers
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        {!isSelf && (
          <Button
            onClick={handleFollow}
            variant="outline"
            className={`flex-1 border-white/10 transition-all ${
              isFollowing
                ? "bg-primary/10 text-primary hover:bg-destructive/10 hover:text-red-400 hover:border-red-400/30"
                : "bg-white/5 text-white hover:bg-primary/20 hover:border-primary/40"
            }`}
          >
            {isFollowing ? (
              <><UserMinus className="h-4 w-4 mr-2" />Unfollow</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" />Follow</>
            )}
          </Button>
        )}
        {showDeleteButton && isAdmin && (
          <Button
            variant="outline"
            onClick={handleDelete}
            className="border-white/10 bg-white/5 hover:bg-destructive hover:text-white hover:border-destructive transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserCard;
