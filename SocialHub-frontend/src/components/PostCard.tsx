import { useState, useEffect } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface CommentUser {
  id: number;
  name: string;
  role: string;
  image?: string;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: CommentUser;
}

interface PostUser {
  id?: number;
  name: string;
  role: string;
  image?: string;
}

interface Post {
  id: string;
  content: string;
  image?: string;
  created_at: string;
  likes: number;
  hashtags?: string;
  user: PostUser;
  comments?: Comment[];
  comment_count?: number;
}

interface PostCardProps {
  post: Post;
}

const API_URL = import.meta.env.VITE_API_URL;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostCard({ post }: PostCardProps) {
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const token = localStorage.getItem("token");

  // Decode current user id from token
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

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/getLiked/${post.id}/liked`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setLiked(res.data.liked))
      .catch(console.error);
  }, [post.id, token]);

  const handleLike = async () => {
    if (!token) return toast.error("Please login to like posts.");
    try {
      const res = await axios.post(
        `${API_URL}/posts/${post.id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLiked(res.data.message === "Liked");
      setLikeCount(res.data.likes);
    } catch {
      toast.error("Something went wrong.");
    }
  };

  const loadComments = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/posts/${post.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data);
    } catch {
      console.error("Failed to load comments");
    }
  };

  const toggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((v) => !v);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (!token) return toast.error("Please login to comment.");
    setSubmittingComment(true);
    try {
      const res = await axios.post(
        `${API_URL}/posts/${post.id}/comments`,
        { content: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
    } catch {
      toast.error("Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
    try {
      await axios.delete(`${API_URL}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error("Failed to delete comment.");
    }
  };

  const getImageUrl = (image?: string) => {
    if (!image) return undefined;
    if (image.startsWith("http")) return image;
    return `${API_URL}/${image.replace(/^\/+/, "")}`;
  };

  return (
    <>
      {/* Lightbox */}
      {lightboxOpen && post.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={getImageUrl(post.image)}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        </div>
      )}

      <div className="glass-panel border-white/5 hover-lift w-full rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-white/5">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getImageUrl(post.user?.image)} alt={post.user?.name} />
            {post.user?.name && (
              <AvatarFallback className="bg-primary-solid font-bold text-white">
                {post.user.name.charAt(0).toUpperCase()}
                {post.user.name.charAt(1)?.toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-white">{post.user.name}</h4>
            <div className="flex items-center gap-2">
              <Badge
                variant={post.user.role === "admin" ? "default" : "secondary"}
                className={`text-xs ${post.user.role === "admin" ? "bg-primary-solid text-white" : ""}`}
              >
                {post.user.role}
              </Badge>
              <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm sm:text-base text-white/90 leading-relaxed break-words">
            {post.content}
          </p>

          {post.image && (
            <div
              className="w-full cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={getImageUrl(post.image)}
                alt="Post"
                className="rounded-xl w-full max-h-96 object-cover hover:opacity-90 transition-opacity"
              />
            </div>
          )}

          {post.hashtags && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.split(",").map((tag, i) => (
                <span
                  key={i}
                  className="text-xs text-primary-light bg-primary/10 px-2 py-0.5 rounded-full"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-4 flex items-center gap-3 border-t border-white/5 pt-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-red-400" : ""}`} />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={toggleComments}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length}</span>
            {showComments ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
            {/* Comment Input */}
            <div className="flex gap-3">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[60px] resize-none bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 text-sm rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim() || submittingComment}
                className="btn-hero self-end px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={getImageUrl(comment.user?.image)} />
                      <AvatarFallback className="bg-primary-solid text-white text-xs font-bold">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-white/5 rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          {comment.user.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(comment.created_at)}
                          </span>
                          {(comment.user.id === currentUserId) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-white/80 mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
