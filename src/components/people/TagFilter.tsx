import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

export function TagFilter({
  allTags,
  selectedTags,
  onToggleTag,
  onClearAll,
}: TagFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Tag className="h-4 w-4 text-white/50" strokeWidth={1.5} />
          <span className="text-white/70">Tags</span>
          {selectedTags.length > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
              {selectedTags.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-white/70">Filter by tag</p>
            {selectedTags.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {allTags.length === 0 ? (
            <p className="text-xs text-white/40">No tags yet</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-none">
              {allTags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/70 transition-colors hover:glass-active cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => onToggleTag(tag)}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-transparent accent-primary"
                  />
                  <span className="h-2 w-2 rounded-full bg-primary/60" />
                  <span className="truncate">{tag}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
