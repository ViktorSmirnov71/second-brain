import { useEffect, useState, useCallback } from "react";
import { Bold, Italic, Underline, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface FloatingToolbarProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

interface Position {
  top: number;
  left: number;
}

export function FloatingToolbar({ containerRef }: FloatingToolbarProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
      setVisible(false);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setVisible(false);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setPosition({
      top: rect.top - containerRect.top - 44,
      left: rect.left - containerRect.left + rect.width / 2 - 100,
    });
    setVisible(true);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", updatePosition);
    return () => document.removeEventListener("selectionchange", updatePosition);
  }, [updatePosition]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    containerRef.current?.focus();
  };

  const formatHeading = (tag: string) => {
    document.execCommand("formatBlock", false, tag);
    containerRef.current?.focus();
  };

  if (!visible) return null;

  return (
    <div
      className="absolute z-50 glass-popover rounded-lg px-1 py-1 flex items-center gap-0.5 shadow-2xl"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <ToolbarButton onClick={() => execCommand("bold")} label="Bold">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => execCommand("italic")} label="Italic">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => execCommand("underline")} label="Underline">
        <Underline className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="w-px h-5 bg-white/[0.06] mx-0.5" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1.5 rounded-md text-white/70 hover:text-white/90 hover:bg-white/[0.08] transition-all"
            title="Text size"
          >
            <Type className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-32">
          <DropdownMenuItem onClick={() => formatHeading("p")}>Normal</DropdownMenuItem>
          <DropdownMenuItem onClick={() => formatHeading("h1")}>Heading 1</DropdownMenuItem>
          <DropdownMenuItem onClick={() => formatHeading("h2")}>Heading 2</DropdownMenuItem>
          <DropdownMenuItem onClick={() => formatHeading("h3")}>Heading 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "p-1.5 rounded-md text-white/70 hover:text-white/90 hover:bg-white/[0.08] transition-all"
      )}
    >
      {children}
    </button>
  );
}
