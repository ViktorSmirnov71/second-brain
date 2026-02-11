export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  voice_id: string | null;
  proactive_suggestions: boolean;
  auto_categorization: string;
  default_section_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  company_id: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  met_at: string | null;
  notes: string | null;
  avatar_url: string | null;
  relationship: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface NoteOnPerson {
  id: string;
  person_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Section {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  view_type: "hierarchy" | "list" | "kanban" | "gallery";
  sort_order: number;
  is_default: boolean;
  kanban_columns: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface NoteMetadata {
  icon?: string;
  coverUrl?: string;
  isTask?: boolean;
  dueDate?: string;
}

export interface Note {
  id: string;
  user_id: string;
  section_id: string | null;
  parent_id: string | null;
  title: string;
  content: string | null;
  type: "project" | "group" | "page" | "idea" | "philosophy" | "thing";
  status: string | null;
  metadata: NoteMetadata;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  status: "active" | "complete";
  date: string | null;
  list_type: "current" | "scheduled" | "unscheduled";
  linked_project_id: string | null;
  linked_person_id: string | null;
  notes: string | null;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  raw_notes: string | null;
  organized_notes: string | null;
  meeting_date: string | null;
  linked_project_id: string | null;
  created_at: string;
  updated_at: string;
  attendees: string[];
}

export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  linked_project_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapTask {
  id: string;
  roadmap_id: string;
  title: string;
  start_date: string;
  end_date: string;
  duration: number;
  dependencies: string[];
  assignee_id: string | null;
  is_milestone: boolean;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls: unknown[] | null;
  created_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
