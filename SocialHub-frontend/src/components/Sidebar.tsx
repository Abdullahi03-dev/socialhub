import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  User, 
  // Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Profile", href: "/profile", icon: User },
  // { name: "Settings", href: "/settings", icon: Settings },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div
      className={cn(
        "fixed left-0 top-20 z-40 h-[calc(100vh-5rem)] glass-panel border-r border-white/5 transition-all duration-300",
        "md:fixed md:top-20 md:h-[calc(100vh-5rem)]",
        // Mobile = small, Desktop = full
        "w-16 md:w-64"
      )}
    >
      {/* Navigation */}
      <nav className="px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-smooth",
                isActive
                  ? "bg-primary/20 text-primary border border-primary/30 shadow-glow"
                  : "text-muted-foreground hover:text-white hover:bg-white/5",
                // Center icons on mobile
                "justify-center md:justify-start"
              )}
            >
              <item.icon className={cn("h-5 w-5", "md:mr-3")} />
              {/* Show text only on desktop */}
              <span className="hidden md:inline">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
