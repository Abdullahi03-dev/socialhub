import { useEffect, useState, useRef, useCallback } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, TrendingUp, Activity, Image as ImageIcon, Globe, Users, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface FormDataType {
  content: string;
  tags: string;
  image: File | null;
}

const PAGE_SIZE = 10;

const Dashboard = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [feedTab, setFeedTab] = useState<"all" | "following">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newPost, setNewPost] = useState<FormDataType>({ content: "", tags: "", image: null });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [hashTagsAnalytics, setHashTagsAnalytics] = useState<string[]>([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const getEndpoint = () => feedTab === "all" ? "/getallposts" : "/feed";

  const fetchPosts = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoadingMore(true);
      const res = await axiosAuth.get(getEndpoint(), {
        params: { page: pageNum, limit: PAGE_SIZE },
      });
      const newPosts = res.data;
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(newPosts.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
      if (pageNum === 1) toast.error("Session expired. Please login again.", { style: { background: '#18181b', color: '#fff' } });
    } finally {
      setLoadingMore(false);
    }
  }, [feedTab]);

  const fetchSidebar = async () => {
    try {
      const [hashRes, usersRes] = await Promise.all([
        axiosAuth.get("/top-hashtags/"),
        axiosAuth.get("/top-users/"),
      ]);
      const flattags = hashRes.data.map((tag: any) => tag.split(",")).flat().map((tag: any) => tag.trim());
      setHashTagsAnalytics(flattags);
      setActiveUsers(usersRes.data);
    } catch (err) { console.error(err); }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPosts(1, true), fetchSidebar()]);
      setPage(1);
      setLoading(false);
    };
    init();
  }, [feedTab]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, fetchPosts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewPost({ ...newPost, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPost({ ...newPost, image: e.target.files?.[0] || null });
  };

  const handleSubmit = async () => {
    if (!token) return toast.error("Please login again.");
    if (!newPost.content.trim() || !newPost.tags.trim() || !newPost.image) {
      return toast.error("Please fill in content, tags, and select an image.");
    }
    const data = new FormData();
    data.append("content", newPost.content);
    data.append("tags", newPost.tags);
    if (newPost.image) data.append("image", newPost.image);
    try {
      setSubmitting(true);
      await axiosAuth.post("/upload", data, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Post uploaded successfully!", { style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
      setTimeout(() => navigate(0), 1500);
    } catch (error) {
      console.error(error);
      toast.error("Upload failed", { style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter(
    (post: any) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.hashtags?.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-heading font-semibold text-white">Loading your world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header isAuthenticated={true} />
      <div className="flex pt-20">
        <Sidebar />
        <main className="flex-1 w-full relative z-10 px-4 md:px-8 py-8 md:ml-64 transition-all duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-8">

              {/* Feed Section */}
              <div className="lg:col-span-3 w-full flex flex-col gap-8">

                {/* Header & Create */}
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between glass-panel p-6 rounded-3xl">
                  <div>
                    <h1 className="font-heading text-3xl font-bold text-white mb-1">Your Feed</h1>
                    <p className="text-sm text-muted-foreground">Discover what's happening right now.</p>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-hero flex items-center shadow-glow">
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg glass-panel border-white/10 text-white !bg-background/80 backdrop-blur-xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                          <Activity className="w-5 h-5 text-primary" />
                          Create a Post
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-5 mt-4">
                        <Textarea
                          placeholder="What's on your mind?"
                          name="content"
                          value={newPost.content}
                          onChange={handleChange}
                          className="min-h-[120px] resize-none input-field bg-white/5 border-white/10 focus:border-primary text-white text-base placeholder:text-muted-foreground/60"
                        />
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Attach Media
                          </label>
                          <div className="relative">
                            <input accept="image/*" type="file" onChange={handleFileChange} name="image" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="input-field bg-white/5 border-white/10 border-dashed border-2 py-4 text-center text-muted-foreground hover:bg-white/10 transition-colors">
                              {newPost.image ? newPost.image.name : "Click or drag to upload an image"}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-white/80">Hashtags</label>
                          <Input
                            placeholder="e.g. #design, #tech (comma separated)"
                            name="tags"
                            value={newPost.tags}
                            onChange={handleChange}
                            className="input-field bg-white/5 border-white/10 focus:border-primary text-white"
                          />
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                          <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="text-muted-foreground hover:text-white">Cancel</Button>
                          <Button onClick={handleSubmit} className="btn-hero" disabled={submitting}>
                            {submitting ? "Posting..." : "Share Post"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Feed Tabs */}
                <div className="flex gap-2 glass-panel p-1.5 rounded-2xl w-fit">
                  <button
                    onClick={() => setFeedTab("all")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      feedTab === "all" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    All Posts
                  </button>
                  <button
                    onClick={() => setFeedTab("following")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      feedTab === "following" ? "bg-primary text-white shadow-glow" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Following
                  </button>
                </div>

                {/* Search */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search posts, users, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 py-6 rounded-2xl input-field bg-white/5 border-white/10 focus:border-primary/50 text-white placeholder:text-muted-foreground/50 shadow-sm"
                  />
                </div>

                {/* Posts Feed */}
                <div className="w-full flex flex-col gap-6">
                  {feedTab === "following" && posts.length === 0 ? (
                    <div className="text-center py-20 glass-panel rounded-3xl border-dashed border-2 border-white/10">
                      <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">Follow some users to see their posts here.</p>
                    </div>
                  ) : filteredPosts.length > 0 ? (
                    filteredPosts.map((post: any) => (
                      <div key={post.id} className="animate-fade-in">
                        <PostCard post={post} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 glass-panel rounded-3xl border-dashed border-2 border-white/10">
                      <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-lg text-muted-foreground">No posts found matching your search.</p>
                    </div>
                  )}

                  {/* Infinite scroll sentinel */}
                  <div ref={sentinelRef} className="py-2 flex justify-center">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading more...
                      </div>
                    )}
                    {!hasMore && posts.length > 0 && (
                      <p className="text-xs text-muted-foreground/50">You've reached the end</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <aside className="space-y-6 w-full max-w-full lg:sticky lg:top-28 self-start">
                <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="flex items-center text-lg font-heading font-bold text-white mb-4">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    Trending Topics
                  </h3>
                  <div className="flex flex-col gap-3">
                    {hashTagsAnalytics.length > 0 ? (
                      hashTagsAnalytics.map((tag, index) => (
                        <div key={index} className="group cursor-pointer flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                          <span className="font-medium text-sm text-primary-light group-hover:text-primary transition-colors">#{tag}</span>
                          <span className="text-xs text-muted-foreground">Trending</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No trending hashtags yet.</p>
                    )}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl">
                  <h3 className="text-lg font-heading font-bold text-white mb-4">Active Members</h3>
                  <div className="flex flex-col gap-3">
                    {activeUsers.length > 0 ? (
                      activeUsers.map((user: any) => (
                        <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-primary-solid flex items-center justify-center text-xs font-bold text-white">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white/90">{user.name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No active users to display.</p>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
