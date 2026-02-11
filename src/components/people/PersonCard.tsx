import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Person } from "@/types";
import { getInitials, getAvatarColor } from "./utils";

interface PersonCardProps {
  person: Person;
  onClick: () => void;
}

export function PersonCard({ person, onClick }: PersonCardProps) {
  return (
    <button
      onClick={onClick}
      className="glass-panel rounded-lg p-4 text-left transition-all duration-300 ease-apple hover:glass-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          {person.avatar_url && <AvatarImage src={person.avatar_url} alt={person.name} />}
          <AvatarFallback className={getAvatarColor(person.name)}>
            {getInitials(person.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/90">
            {person.name}
          </p>
          {person.company && (
            <p className="truncate text-xs text-white/40">{person.company}</p>
          )}
        </div>
      </div>
      {person.tags && person.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {person.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {person.tags.length > 3 && (
            <span className="text-[10px] text-white/40">
              +{person.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
