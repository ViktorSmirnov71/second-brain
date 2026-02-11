import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Users,
  CheckSquare,
  CalendarDays,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const mobileNavItems: MobileNavItem[] = [
  { label: "Chat", path: "/", icon: MessageSquare },
  { label: "People", path: "/people", icon: Users },
  { label: "To Do", path: "/todos", icon: CheckSquare },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 backdrop-blur-2xl bg-black/60 border-t border-white/[0.06]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] transition-colors duration-300",
                  isActive ? "text-white" : "text-white/40"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-1 h-1 w-1 rounded-full bg-white" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
