import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import UserCard from "@/components/UserCard";
import { Users as UsersIcon, ShieldCheck } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  posts: number;
}

const Users = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const token = localStorage.getItem("token");

  // Decode email from JWT token
  const getEmailFromToken = (): string | null => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.email ?? null;
    } catch {
      return null;
    }
  };

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const email = getEmailFromToken();
    if (!email) return;

    const fetchIsAdmin = async () => {
      try {
        const res = await axios.get(`${API_URL}/checkAdmin/${email}`, {
          headers: authHeaders,
        });
        setIsAdmin(res.data.is_admin);
      } catch (err) {
        console.error(err);
      }
    };
    fetchIsAdmin();
  }, [token]);

  const loadUsers = async () => {
    try {
      const res = await axios.get<User[]>(`${API_URL}/users/`, {
        headers: authHeaders,
      });
      setUsers(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const userStats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-heading font-semibold text-white">Loading users...</p>
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

            {/* Page Header */}
            <div className="glass-panel p-6 rounded-3xl mb-8">
              <h1 className="font-heading text-3xl font-bold text-white mb-1">Users</h1>
              <p className="text-sm text-muted-foreground">Manage and view all platform members</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-white">{userStats.total}</p>
                </div>
                <UsersIcon className="h-9 w-9 text-primary opacity-80" />
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-3xl font-bold text-white">{userStats.admins}</p>
                </div>
                <ShieldCheck className="h-9 w-9 text-primary opacity-80" />
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onDelete={handleDeleteUser}
                  isAdmin={isAdmin}
                  showDeleteButton={user.role !== "admin"}
                />
              ))}
            </div>

            {users.length === 0 && (
              <div className="text-center py-20 glass-panel rounded-3xl border-dashed border-2 border-white/10">
                <UsersIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No users found.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Users;
