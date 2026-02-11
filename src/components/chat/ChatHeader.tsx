import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  StickyNote,
  UserPlus,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type VoiceConnectionState = "idle" | "connecting" | "connected";

interface ChatHeaderProps {
  title: string | null;
  voiceState: VoiceConnectionState;
  onTitleChange: (title: string) => void;
  onVoiceToggle: () => void;
  onQuickNote?: () => void;
  onAddPerson?: () => void;
}

export function ChatHeader({
  title,
  voiceState,
  onTitleChange,
  onVoiceToggle,
  onQuickNote,
  onAddPerson,
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmitTitle = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setEditValue(title || "");
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSubmitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitTitle();
              if (e.key === "Escape") {
                setEditValue(title || "");
                setIsEditing(false);
              }
            }}
            className="bg-transparent text-white/90 font-medium text-sm outline-none w-full"
          />
        ) : (
          <button
            onClick={() => {
              setEditValue(title || "New Conversation");
              setIsEditing(true);
            }}
            className="text-white/90 font-medium text-sm truncate hover:text-white transition-colors text-left"
          >
            {title || "New Conversation"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Secondary actions — hidden on mobile, in dropdown */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onQuickNote}
            aria-label="Quick note"
          >
            <StickyNote className="h-5 w-5 text-white/50" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddPerson}
            aria-label="Add person"
          >
            <UserPlus className="h-5 w-5 text-white/50" strokeWidth={1.5} />
          </Button>
        </div>

        {/* Mobile dropdown for secondary actions */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreHorizontal
                  className="h-5 w-5 text-white/50"
                  strokeWidth={1.5}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onQuickNote}>
                <StickyNote className="mr-2 h-4 w-4" />
                Quick Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddPerson}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Person
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Voice button */}
        <Button
          variant={voiceState === "connected" ? "destructive" : "outline"}
          size="sm"
          onClick={onVoiceToggle}
          disabled={voiceState === "connecting"}
          className={cn(
            "gap-2 transition-all duration-300 ease-apple",
            voiceState === "idle" && "text-white/70"
          )}
        >
          {voiceState === "connecting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Connecting...</span>
            </>
          ) : voiceState === "connected" ? (
            <>
              <MicOff className="h-4 w-4" />
              <span className="hidden sm:inline">End</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Start Voice</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
