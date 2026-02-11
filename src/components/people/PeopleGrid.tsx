import type { Person } from "@/types";
import { PersonCard } from "./PersonCard";

interface PeopleGridProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

export function PeopleGrid({ people, onSelectPerson }: PeopleGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          onClick={() => onSelectPerson(person)}
        />
      ))}
    </div>
  );
}
