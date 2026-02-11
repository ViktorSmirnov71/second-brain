import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Users,
  CalendarDays,
  FileText,
  CheckSquare,
  BookOpen,
  Map,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const STORAGE_KEY = "app-sidebar-collapsed";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Chat", path: "/", icon: MessageSquare },
  { label: "People", path: "/people", icon: Users },
  { label: "Meetings", path: "/meetings", icon: CalendarDays },
  { label: "Notes", path: "/notes", icon: FileText },
  { label: "To Do", path: "/todos", icon: CheckSquare },
  { label: "Philosophies", path: "/philosophies", icon: BookOpen },
  { label: "Roadmaps", path: "/roadmaps", icon: Map },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col h-full glass-panel rounded-none border-t-0 border-b-0 border-l-0 transition-all duration-300 ease-apple",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo / brand area */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-white/[0.06] shrink-0",
            collapsed ? "justify-center px-2" : "px-5"
          )}
        >
          {!collapsed && (
            <span className="text-sm font-semibold text-white/90 tracking-tight">
              Second Brain
            </span>
          )}
          {collapsed && (
            <span className="text-sm font-semibold text-white/90">SB</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-none py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const link = (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg text-sm transition-all duration-300 ease-apple",
                    collapsed
                      ? "justify-center h-10 w-10 mx-auto"
                      : "h-10 px-3",
                    isActive
                      ? "glass-active text-white/90"
                      : "text-white/40 hover:text-white/70 hover:glass-active"
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return link;
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.06] py-3 px-2 space-y-1">
          {/* Settings */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-sm transition-all duration-300 ease-apple",
                      isActive
                        ? "glass-active text-white/90"
                        : "text-white/40 hover:text-white/70 hover:glass-active"
                    )
                  }
                >
                  <Settings className="h-5 w-5" strokeWidth={1.5} />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-all duration-300 ease-apple",
                  isActive
                    ? "glass-active text-white/90"
                    : "text-white/40 hover:text-white/70 hover:glass-active"
                )
              }
            >
              <Settings className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span>Settings</span>
            </NavLink>
          )}

          {/* Sign Out */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-sm text-white/40 hover:text-white/70 hover:glass-active transition-all duration-300 ease-apple"
                >
                  <LogOut className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 h-10 px-3 w-full rounded-lg text-sm text-white/40 hover:text-white/70 hover:glass-active transition-all duration-300 ease-apple"
            >
              <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span>Sign Out</span>
            </button>
          )}

          {/* Collapse Toggle */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setCollapsed(false)}
                  className="flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-sm text-white/40 hover:text-white/70 hover:glass-active transition-all duration-300 ease-apple"
                >
                  <PanelLeft className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand Sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => setCollapsed(true)}
              className="flex items-center gap-3 h-10 px-3 w-full rounded-lg text-sm text-white/40 hover:text-white/70 hover:glass-active transition-all duration-300 ease-apple"
            >
              <PanelLeftClose
                className="h-5 w-5 shrink-0"
                strokeWidth={1.5}
              />
              <span>Collapse</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
