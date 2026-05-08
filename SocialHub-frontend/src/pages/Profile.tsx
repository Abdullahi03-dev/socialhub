import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, MapPin, Calendar, Mail, Camera, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface User {
  name: string;
  role: string;
  email?: string;
  bio?: string;
  location?: string;
  created_at?: string;
  posts?: number;
  image?: string;
  id?: number;
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: any[];
  user: User;
}

const Profile = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", bio: "", location: "" });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const savedEmail = localStorage.getItem("token");

  useEffect(() => {
    if (!savedEmail) {
      alert("Error: no token found in localStorage");
      return;
    }

    const fetchUserAndPosts = async () => {
      try {
        const userRes = await axios.get(`${API_URL}/auth/fetchbyemail`, {
          headers: { Authorization: `Bearer ${savedEmail}` },
          withCredentials: true,
        });
        setUser(userRes.data);
        setFormData({
          name: userRes.data.name || "",
          bio: userRes.data.bio || "",
          location: userRes.data.location || "",
        });

        const postsRes = await axios.get(`${API_URL}/getallpostsForUser`, {
          headers: { Authorization: `Bearer ${savedEmail}` },
          withCredentials: true,
        });
        setPosts(postsRes.data);
      } catch (err) {
        console.error("Error fetching profile or posts:", err);
        toast.error("Failed to fetch profile or posts");
      } finally {
        setDataLoaded(true);
      }
    };

    fetchUserAndPosts();
  }, [savedEmail]);

  const handleIconClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Please select a valid image (PNG, JPG, JPEG)");
      return;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append("file", selectedFile);

    try {
      await axios.put(`${API_URL}/edit/editImage/upload-image`, uploadForm, {
        headers: {
          Authorization: `Bearer ${savedEmail}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Image uploaded successfully");
      setTimeout(() => navigate(0), 200);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (userId?: number) => {
    if (!userId) return;
    if (!formData.name || !formData.bio || !formData.location) {
      toast.error("All fields must be filled before saving");
      return;
    }
    setIsSaving(true);
    try {
      const response = await axios.put(
        `${API_URL}/edit/editUser/${userId}`,
        { name: formData.name, bio: formData.bio, location: formData.location },
        { withCredentials: true }
      );
      toast.success(response.data.message);
      setTimeout(() => navigate(0), 100);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Error updating user");
    } finally {
      setIsSaving(false);
    }
  };

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-heading font-semibold text-white">Loading profile...</p>
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
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Profile Card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">

                {/* Avatar + Edit Button */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-primary/20">
                      <AvatarImage
                        src={user?.image ? `${API_URL}/${user.image}` : undefined}
                        alt={user?.name}
                      />
                      {user?.name && (
                        <AvatarFallback className="bg-primary-solid font-bold text-3xl sm:text-4xl text-white">
                          {user.name.charAt(0).toUpperCase()}
                          {user.name.charAt(1).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <button
                      onClick={handleIconClick}
                      className="absolute bottom-1 right-1 bg-primary rounded-full p-1.5 shadow-glow hover:bg-primary-dark transition-colors"
                    >
                      <Camera className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white w-full sm:w-auto">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg glass-panel border-white/10 text-white !bg-background/80 backdrop-blur-xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-heading text-white">Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <label className="text-sm font-medium text-white/80">Name</label>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={user?.name}
                            className="input-field bg-white/5 border-white/10 focus:border-primary text-white mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white/80">Bio</label>
                          <Textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="min-h-[100px] resize-none input-field bg-white/5 border-white/10 focus:border-primary text-white mt-1"
                            placeholder={user?.bio}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white/80">Location</label>
                          <Input
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder={user?.location}
                            className="input-field bg-white/5 border-white/10 focus:border-primary text-white mt-1"
                          />
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                          <Button
                            variant="ghost"
                            onClick={() => setIsEditDialogOpen(false)}
                            className="text-muted-foreground hover:text-white"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSubmit(user?.id)}
                            className="btn-hero flex items-center"
                            disabled={isSaving}
                          >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-4 text-center sm:text-left">
                  <div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                      {user?.name}
                    </h1>
                    <p className="text-muted-foreground text-base">@{user?.name?.toLowerCase().replace(/\s+/g, "")}</p>
                  </div>

                  {user?.bio && (
                    <p className="text-white/80 text-sm sm:text-base leading-relaxed">{user.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground justify-center sm:justify-start">
                    {user?.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {user.location}
                      </span>
                    )}
                    {user?.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-primary" />
                        {user.email}
                      </span>
                    )}
                    {user?.created_at && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" />
                        Joined {user.created_at.split("T")[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                    <Badge
                      variant={user?.role === "admin" ? "default" : "secondary"}
                      className={user?.role === "admin" ? "bg-primary-solid text-white" : ""}
                    >
                      {user?.role}
                    </Badge>
                    <span className="glass-panel px-3 py-1 rounded-full text-sm text-white/80 border-white/10">
                      <span className="font-bold text-white">{user?.posts ?? 0}</span> Posts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="posts" className="space-y-6">
              <TabsList className="glass-panel border-white/10 bg-white/5 w-full max-w-xs">
                <TabsTrigger value="posts" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground">
                  Posts
                </TabsTrigger>
                <TabsTrigger value="liked" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground">
                  Liked
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="space-y-6">
                {posts.length > 0 ? (
                  posts.map((post: any) => (
                    <div key={post.id} className="animate-fade-in">
                      <PostCard post={post} />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 glass-panel rounded-3xl border-dashed border-2 border-white/10">
                    <p className="text-lg text-muted-foreground">No posts yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="liked">
                <div className="text-center py-20 glass-panel rounded-3xl border-dashed border-2 border-white/10">
                  <p className="text-lg text-muted-foreground">Posts you've liked will appear here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
