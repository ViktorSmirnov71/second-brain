import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Users,
  CalendarDays,
  FileText,
  CheckSquare,
  BookOpen,
  Map,
  Settings,
  Plus,
  UserPlus,
  StickyNote,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";

interface CommandAction {
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const runAction = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const quickActions: CommandAction[] = [
    {
      label: "New Chat",
      icon: Plus,
      shortcut: "N",
      action: () => navigate("/"),
    },
    {
      label: "Add Person",
      icon: UserPlus,
      action: () => navigate("/people"),
    },
    {
      label: "Quick Note",
      icon: StickyNote,
      shortcut: "Shift+N",
      action: () => navigate("/notes"),
    },
  ];

  const navigationItems: CommandAction[] = [
    { label: "Chat", icon: MessageSquare, action: () => navigate("/") },
    { label: "People", icon: Users, action: () => navigate("/people") },
    {
      label: "Meetings",
      icon: CalendarDays,
      action: () => navigate("/meetings"),
    },
    { label: "Notes", icon: FileText, action: () => navigate("/notes") },
    { label: "To Do", icon: CheckSquare, action: () => navigate("/todos") },
    {
      label: "Philosophies",
      icon: BookOpen,
      action: () => navigate("/philosophies"),
    },
    { label: "Roadmaps", icon: Map, action: () => navigate("/roadmaps") },
    {
      label: "Calendar",
      icon: CalendarDays,
      action: () => navigate("/calendar"),
    },
    { label: "Settings", icon: Settings, action: () => navigate("/settings") },
  ];

  const searchItems: CommandAction[] = [
    {
      label: "Search people...",
      icon: Search,
      action: () => navigate("/people"),
    },
    {
      label: "Search notes...",
      icon: Search,
      action: () => navigate("/notes"),
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.label}
                onSelect={() => runAction(item.action)}
              >
                <Icon className="mr-2 h-4 w-4 text-white/50" strokeWidth={1.5} />
                <span>{item.label}</span>
                {item.shortcut && (
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.label}
                onSelect={() => runAction(item.action)}
              >
                <Icon className="mr-2 h-4 w-4 text-white/50" strokeWidth={1.5} />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Search">
          {searchItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.label}
                onSelect={() => runAction(item.action)}
              >
                <Icon className="mr-2 h-4 w-4 text-white/50" strokeWidth={1.5} />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
