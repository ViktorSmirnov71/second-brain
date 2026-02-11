import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  MessageSquare,
} from "lucide-react";

interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  action: () => void;
}

interface SlashMenuProps {
  position: { top: number; left: number } | null;
  onClose: () => void;
  onCommand: (command: string) => void;
}

const COMMANDS: Omit<SlashCommand, "action">[] = [
  { id: "page", name: "Page", description: "Create a sub-page", icon: FileText },
  { id: "h1", name: "Heading 1", description: "Large heading", icon: Heading1 },
  { id: "h2", name: "Heading 2", description: "Medium heading", icon: Heading2 },
  { id: "h3", name: "Heading 3", description: "Small heading", icon: Heading3 },
  { id: "bullet", name: "Bullet List", description: "Simple bullet list", icon: List },
  { id: "numbered", name: "Numbered List", description: "Ordered list", icon: ListOrdered },
  { id: "todo", name: "To-do", description: "Checkbox item", icon: CheckSquare },
  { id: "quote", name: "Quote", description: "Block quote", icon: Quote },
  { id: "divider", name: "Divider", description: "Horizontal line", icon: Minus },
  { id: "callout", name: "Callout", description: "Highlighted callout box", icon: MessageSquare },
];

export function SlashMenu({ position, onClose, onCommand }: SlashMenuProps) {
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = COMMANDS.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.id.toLowerCase().includes(filter.toLowerCase())
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onCommand(filtered[selectedIndex].id);
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Backspace" && filter === "") {
        onClose();
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
        setFilter((prev) => prev + e.key);
        setSelectedIndex(0);
      }
    },
    [filter, filtered, selectedIndex, onClose, onCommand]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  useEffect(() => {
    setFilter("");
    setSelectedIndex(0);
  }, [position]);

  if (!position) return null;

  return (
    <div
      className="absolute z-50 glass-popover rounded-lg py-1 w-64 shadow-2xl max-h-72 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-sm text-white/40">No results</div>
      ) : (
        filtered.map((cmd, index) => {
          const Icon = cmd.icon;
          return (
            <button
              key={cmd.id}
              className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? "bg-white/[0.08] text-white/90"
                  : "text-white/70 hover:bg-white/[0.04]"
              }`}
              onClick={() => {
                onCommand(cmd.id);
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Icon className="h-4 w-4 text-white/50 shrink-0" strokeWidth={1.5} />
              <div className="min-w-0">
                <div className="text-sm">{cmd.name}</div>
                <div className="text-xs text-white/40 truncate">{cmd.description}</div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
