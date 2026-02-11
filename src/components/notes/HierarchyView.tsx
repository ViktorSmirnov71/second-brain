import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types";

interface HierarchyViewProps {
  notes: Note[];
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
}

export function HierarchyView({ notes, onSelectNote, onCreateNote }: HierarchyViewProps) {
  const tree = useMemo(() => buildTree(notes), [notes]);

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <FileText className="h-12 w-12 text-white/20" strokeWidth={1.5} />
        <div className="text-center space-y-1">
          <p className="text-white/90 font-medium">No pages yet</p>
          <p className="text-white/40 text-sm">Get started by creating your first page</p>
        </div>
        <Button onClick={onCreateNote} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add page
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNode
          key={node.note.id}
          node={node}
          depth={0}
          onSelectNote={onSelectNote}
        />
      ))}
      <button
        onClick={onCreateNote}
        className="flex items-center gap-2 px-3 py-2 w-full text-white/40 hover:text-white/70 transition-colors text-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} />
        Add page
      </button>
    </div>
  );
}

interface TreeNodeData {
  note: Note;
  children: TreeNodeData[];
}

function buildTree(notes: Note[]): TreeNodeData[] {
  const noteMap = new Map<string, TreeNodeData>();
  const roots: TreeNodeData[] = [];

  notes.forEach((note) => {
    noteMap.set(note.id, { note, children: [] });
  });

  notes.forEach((note) => {
    const node = noteMap.get(note.id)!;
    if (note.parent_id && noteMap.has(note.parent_id)) {
      noteMap.get(note.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function TreeNode({
  node,
  depth,
  onSelectNote,
}: {
  node: TreeNodeData;
  depth: number;
  onSelectNote: (noteId: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-lg",
          "text-white/70 hover:bg-white/[0.04] transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        )}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        onClick={() => onSelectNote(node.note.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="shrink-0 p-0.5 rounded hover:bg-white/[0.08]"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-white/50" strokeWidth={1.5} />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-white/50" strokeWidth={1.5} />
            )}
          </button>
        ) : (
          <span className="w-4.5 shrink-0" />
        )}

        <span className="text-base shrink-0">{node.note.metadata?.icon || "📄"}</span>
        <span className="flex-1 text-sm text-left truncate">{node.note.title || "Untitled"}</span>

        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
          {node.note.type}
        </Badge>

        {hasChildren && (
          <span className="text-xs text-white/30 shrink-0">{node.children.length}</span>
        )}
      </button>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.note.id}
              node={child}
              depth={depth + 1}
              onSelectNote={onSelectNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
