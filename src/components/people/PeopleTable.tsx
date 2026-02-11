import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Person } from "@/types";
import { getInitials, getAvatarColor, formatRelativeDate } from "./utils";

interface PeopleTableProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

export function PeopleTable({ people, onSelectPerson }: PeopleTableProps) {
  return (
    <div className="glass-panel rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b glass-divider">
            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider hidden xl:table-cell">
              Tags
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">
              Added
            </th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr
              key={person.id}
              onClick={() => onSelectPerson(person)}
              className="border-b glass-divider last:border-b-0 transition-all duration-300 ease-apple hover:glass-active cursor-pointer"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {person.avatar_url && (
                      <AvatarImage src={person.avatar_url} alt={person.name} />
                    )}
                    <AvatarFallback className={`text-xs ${getAvatarColor(person.name)}`}>
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white/90 truncate">
                    {person.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-white/70 truncate max-w-[200px]">
                {person.company ?? <span className="text-white/20">--</span>}
              </td>
              <td className="px-4 py-3 text-sm text-white/70 truncate max-w-[200px] hidden lg:table-cell">
                {person.email ?? <span className="text-white/20">--</span>}
              </td>
              <td className="px-4 py-3 hidden xl:table-cell">
                <div className="flex flex-wrap gap-1">
                  {person.tags?.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {person.tags && person.tags.length > 2 && (
                    <span className="text-[10px] text-white/40">
                      +{person.tags.length - 2}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right text-xs text-white/40 hidden md:table-cell whitespace-nowrap">
                {formatRelativeDate(person.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
