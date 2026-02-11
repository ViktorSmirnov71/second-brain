import { useState } from "react";
import {
  Grid3X3,
  Columns3,
  List,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Section } from "@/types";

const viewIcons: Record<Section["view_type"], typeof Grid3X3> = {
  hierarchy: Grid3X3,
  kanban: Columns3,
  list: List,
  gallery: LayoutGrid,
};

interface SectionItemProps {
  section: Section;
  isActive: boolean;
  noteCount: number;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function SectionItem({
  section,
  isActive,
  noteCount,
  onSelect,
  onRename,
  onDelete,
}: SectionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);

  const ViewIcon = viewIcons[section.view_type];

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== section.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        isActive ? "bg-white/[0.08] text-white/90" : "text-white/70 hover:bg-white/[0.04]"
      )}
      onClick={() => !isEditing && onSelect()}
    >
      <ViewIcon className="h-4 w-4 shrink-0 text-white/50" strokeWidth={1.5} />

      {isEditing ? (
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setIsEditing(false);
          }}
          className="h-6 py-0 px-1 text-sm"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm truncate">{section.name}</span>
      )}

      <span className="text-xs text-white/40 shrink-0">{noteCount}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/[0.08]">
            <MoreHorizontal className="h-3.5 w-3.5 text-white/50" strokeWidth={1.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setEditName(section.name);
              setIsEditing(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
