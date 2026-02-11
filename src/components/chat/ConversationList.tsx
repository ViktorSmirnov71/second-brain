import { Plus, MessageSquare, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Button
          onClick={onNew}
          variant="secondary"
          className="w-full justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2 pb-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-white/40" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-white/40">No conversations yet</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <DropdownMenu key={conv.id}>
              <div className="group relative">
                <button
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-2.5 flex items-start gap-3",
                    "transition-all duration-300 ease-apple",
                    activeId === conv.id
                      ? "glass-active"
                      : "hover:bg-white/[0.04]"
                  )}
                >
                  <MessageSquare
                    className="h-4 w-4 text-white/30 mt-0.5 flex-shrink-0"
                    strokeWidth={1.5}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/80 truncate">
                      {conv.title || "New Conversation"}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {formatDistanceToNow(new Date(conv.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </button>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "text-white/40 hover:text-white/70 hover:glass-active"
                    )}
                    aria-label="Conversation options"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <circle cx="8" cy="3" r="1.5" />
                      <circle cx="8" cy="8" r="1.5" />
                      <circle cx="8" cy="13" r="1.5" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent align="end" side="right">
                <DropdownMenuItem onClick={() => onRename(conv.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(conv.id)}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))
        )}
      </div>
    </div>
  );
}
