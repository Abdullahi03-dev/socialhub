import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Activity } from "lucide-react";
import toast from "react-hot-toast";
import NotificationBell from "@/components/NotificationBell";

interface HeaderProps {
  isAuthenticated?: boolean;
}

const Header = ({ isAuthenticated = false }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      toast.success("Logged out successfully");
      setTimeout(() => {
        navigate(0);
      }, 1000);
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const isLandingPage = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/5 glass-panel">
      <div className="container mx-auto px-6 flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-glow transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading text-2xl font-bold tracking-tight text-white">
            Social<span className="text-primary-light">Hub</span>
          </span>
        </Link>

        <nav className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-white transition-colors">
                  Dashboard
                </Button>
              </Link>
              <NotificationBell />
              <Button
                variant="outline"
                onClick={logout}
                className="border-white/10 bg-white/5 hover:bg-destructive hover:text-white hover:border-destructive transition-all px-3 sm:px-4"
              >
                <LogOut className="h-4 w-4 sm:mr-2"/>
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              {!isLandingPage && (
                <Link to="/">
                  <Button variant="ghost" className="text-muted-foreground hover:text-white transition-colors">
                    Home
                  </Button>
                </Link>
              )}
              <Link to="/auth?mode=signin">
                <Button variant="ghost" className="text-muted-foreground hover:text-white transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button className="btn-hero shadow-glow">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;