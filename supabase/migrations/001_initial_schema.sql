-- ============================================================================
-- Second Brain — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Created: 2026-02-11
--
-- This migration creates all tables, indexes, RLS policies, triggers,
-- and realtime subscriptions for the Second Brain application.
-- Tables are created in dependency order to satisfy foreign key constraints.
-- ============================================================================


-- ============================================================================
-- SECTION 1: Utility Functions
-- ============================================================================

-- Function: auto-update updated_at column on row modification
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: auto-create a profile row when a new user signs up via auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- SECTION 2: Tables (in dependency order)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 2.1  profiles — extends auth.users with app-specific settings
-- --------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  voice_id      TEXT DEFAULT 'aura-asteria-en',
  proactive_suggestions BOOLEAN DEFAULT TRUE,
  auto_categorization   TEXT DEFAULT 'balanced',
  default_section_id    UUID,  -- FK added later after sections table exists
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.profiles IS 'User profile extending auth.users with app preferences';

-- --------------------------------------------------------------------------
-- 2.2  companies — organizations that people belong to
-- --------------------------------------------------------------------------
CREATE TABLE public.companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  website     TEXT,
  industry    TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.companies IS 'Companies / organizations in the CRM';

-- --------------------------------------------------------------------------
-- 2.3  people — CRM contacts
-- --------------------------------------------------------------------------
CREATE TABLE public.people (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  company       TEXT,
  company_id    UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  email         TEXT,
  phone         TEXT,
  linkedin      TEXT,
  met_at        TEXT,
  notes         TEXT,
  avatar_url    TEXT,
  relationship  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.people IS 'CRM contacts / people';

-- --------------------------------------------------------------------------
-- 2.4  tags — reusable labels for people (and potentially other entities)
-- --------------------------------------------------------------------------
CREATE TABLE public.tags (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  color     TEXT
);

COMMENT ON TABLE public.tags IS 'User-defined tags for categorizing contacts';

-- --------------------------------------------------------------------------
-- 2.5  person_tags — junction: people <-> tags
-- --------------------------------------------------------------------------
CREATE TABLE public.person_tags (
  person_id UUID NOT NULL REFERENCES public.people (id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES public.tags (id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, tag_id)
);

COMMENT ON TABLE public.person_tags IS 'Junction table linking people to tags';

-- --------------------------------------------------------------------------
-- 2.6  notes_on_person — timestamped observations about a person
-- --------------------------------------------------------------------------
CREATE TABLE public.notes_on_person (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID NOT NULL REFERENCES public.people (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.notes_on_person IS 'Timestamped notes/observations about a person';

-- --------------------------------------------------------------------------
-- 2.7  sections — organize notes into groups with view preferences
-- --------------------------------------------------------------------------
CREATE TABLE public.sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  view_type       TEXT DEFAULT 'hierarchy' CHECK (view_type IN ('hierarchy', 'list', 'kanban', 'gallery')),
  sort_order      INTEGER DEFAULT 0,
  is_default      BOOLEAN DEFAULT FALSE,
  kanban_columns  JSONB DEFAULT '["New","Exploring","On Hold","Done"]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.sections IS 'Organizational sections for notes (Active Projects, Ideas, etc.)';

-- Now add the deferred FK from profiles to sections
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_section_id_fkey
  FOREIGN KEY (default_section_id) REFERENCES public.sections (id) ON DELETE SET NULL;

-- --------------------------------------------------------------------------
-- 2.8  notes — hierarchical content items (pages, projects, ideas, etc.)
-- --------------------------------------------------------------------------
CREATE TABLE public.notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  section_id  UUID REFERENCES public.sections (id) ON DELETE SET NULL,
  parent_id   UUID REFERENCES public.notes (id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'Untitled',
  content     TEXT DEFAULT '',
  type        TEXT DEFAULT 'page' CHECK (type IN ('project', 'group', 'page', 'idea', 'philosophy', 'thing')),
  status      TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.notes IS 'Hierarchical notes, pages, and projects';
COMMENT ON COLUMN public.notes.metadata IS 'Stores icon emoji, coverUrl, isTask, dueDate as JSON';

-- --------------------------------------------------------------------------
-- 2.9  todos — tasks with scheduling and linking
-- --------------------------------------------------------------------------
CREATE TABLE public.todos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'complete')),
  date              DATE,
  list_type         TEXT DEFAULT 'current' CHECK (list_type IN ('current', 'scheduled', 'unscheduled')),
  linked_project_id UUID REFERENCES public.notes (id) ON DELETE SET NULL,
  linked_person_id  UUID REFERENCES public.people (id) ON DELETE SET NULL,
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}',
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.todos IS 'Tasks with scheduling, linking to projects and people';

-- --------------------------------------------------------------------------
-- 2.10 meetings — meeting records with raw and organized notes
-- --------------------------------------------------------------------------
CREATE TABLE public.meetings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  raw_notes         TEXT,
  organized_notes   TEXT,
  meeting_date      TIMESTAMPTZ,
  linked_project_id UUID REFERENCES public.notes (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.meetings IS 'Meeting records with raw transcription and organized notes';

-- --------------------------------------------------------------------------
-- 2.11 meeting_attendees — junction: meetings <-> people
-- --------------------------------------------------------------------------
CREATE TABLE public.meeting_attendees (
  meeting_id UUID NOT NULL REFERENCES public.meetings (id) ON DELETE CASCADE,
  person_id  UUID NOT NULL REFERENCES public.people (id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, person_id)
);

COMMENT ON TABLE public.meeting_attendees IS 'Junction table linking meetings to attendee people';

-- --------------------------------------------------------------------------
-- 2.12 roadmaps — project timelines / Gantt charts
-- --------------------------------------------------------------------------
CREATE TABLE public.roadmaps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  linked_project_id UUID REFERENCES public.notes (id) ON DELETE SET NULL,
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.roadmaps IS 'Project roadmaps for Gantt chart visualization';

-- --------------------------------------------------------------------------
-- 2.13 roadmap_tasks — individual tasks within a roadmap
-- --------------------------------------------------------------------------
CREATE TABLE public.roadmap_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id    UUID NOT NULL REFERENCES public.roadmaps (id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  start_date    DATE,
  end_date      DATE,
  duration      INTEGER,
  dependencies  UUID[] DEFAULT '{}',
  assignee_id   UUID REFERENCES public.people (id) ON DELETE SET NULL,
  is_milestone  BOOLEAN DEFAULT FALSE,
  is_completed  BOOLEAN DEFAULT FALSE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.roadmap_tasks IS 'Tasks within a roadmap, rendered as bars/milestones in Gantt chart';
COMMENT ON COLUMN public.roadmap_tasks.dependencies IS 'Array of roadmap_task UUIDs this task depends on';

-- --------------------------------------------------------------------------
-- 2.14 conversations — AI chat sessions
-- --------------------------------------------------------------------------
CREATE TABLE public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title       TEXT DEFAULT 'New Chat',
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.conversations IS 'AI chat conversation sessions';

-- --------------------------------------------------------------------------
-- 2.15 chat_messages — individual messages within a conversation
-- --------------------------------------------------------------------------
CREATE TABLE public.chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  tool_calls      JSONB,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.chat_messages IS 'Messages within AI chat conversations (realtime enabled)';

-- --------------------------------------------------------------------------
-- 2.16 project_clients — junction: notes (projects) <-> people (clients)
-- --------------------------------------------------------------------------
CREATE TABLE public.project_clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.notes (id) ON DELETE CASCADE,
  person_id   UUID NOT NULL REFERENCES public.people (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role        TEXT,
  status      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.project_clients IS 'Links projects (notes) to client contacts (people)';

-- --------------------------------------------------------------------------
-- 2.17 project_companies — junction: notes (projects) <-> companies
-- --------------------------------------------------------------------------
CREATE TABLE public.project_companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.notes (id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  relationship  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.project_companies IS 'Links projects (notes) to companies';


-- ============================================================================
-- SECTION 3: Indexes
-- ============================================================================

-- user_id indexes for all tables with user_id (fast per-user queries + RLS)
CREATE INDEX idx_companies_user_id       ON public.companies (user_id);
CREATE INDEX idx_people_user_id          ON public.people (user_id);
CREATE INDEX idx_tags_user_id            ON public.tags (user_id);
CREATE INDEX idx_notes_on_person_user_id ON public.notes_on_person (user_id);
CREATE INDEX idx_sections_user_id        ON public.sections (user_id);
CREATE INDEX idx_notes_user_id           ON public.notes (user_id);
CREATE INDEX idx_todos_user_id           ON public.todos (user_id);
CREATE INDEX idx_meetings_user_id        ON public.meetings (user_id);
CREATE INDEX idx_roadmaps_user_id        ON public.roadmaps (user_id);
CREATE INDEX idx_conversations_user_id   ON public.conversations (user_id);
CREATE INDEX idx_project_clients_user_id ON public.project_clients (user_id);
CREATE INDEX idx_project_companies_user_id ON public.project_companies (user_id);

-- Foreign key indexes for common joins and lookups
CREATE INDEX idx_notes_section_id          ON public.notes (section_id);
CREATE INDEX idx_notes_parent_id           ON public.notes (parent_id);
CREATE INDEX idx_notes_on_person_person_id ON public.notes_on_person (person_id);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages (conversation_id);
CREATE INDEX idx_roadmap_tasks_roadmap_id  ON public.roadmap_tasks (roadmap_id);
CREATE INDEX idx_todos_linked_project_id   ON public.todos (linked_project_id);
CREATE INDEX idx_todos_linked_person_id    ON public.todos (linked_person_id);
CREATE INDEX idx_people_company_id         ON public.people (company_id);
CREATE INDEX idx_meetings_linked_project_id ON public.meetings (linked_project_id);
CREATE INDEX idx_roadmaps_linked_project_id ON public.roadmaps (linked_project_id);
CREATE INDEX idx_roadmap_tasks_assignee_id  ON public.roadmap_tasks (assignee_id);
CREATE INDEX idx_project_clients_project_id ON public.project_clients (project_id);
CREATE INDEX idx_project_clients_person_id  ON public.project_clients (person_id);
CREATE INDEX idx_project_companies_project_id ON public.project_companies (project_id);
CREATE INDEX idx_project_companies_company_id ON public.project_companies (company_id);

-- Composite index for chat messages ordered by time within a conversation
CREATE INDEX idx_chat_messages_conv_created ON public.chat_messages (conversation_id, created_at);

-- Index for todo scheduling queries
CREATE INDEX idx_todos_date_status ON public.todos (user_id, status, date);


-- ============================================================================
-- SECTION 4: Row Level Security (RLS) Policies
-- ============================================================================

-- --------------------------------------------------------------------------
-- 4.1  profiles
-- --------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.2  companies
-- --------------------------------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies"
  ON public.companies FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own companies"
  ON public.companies FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own companies"
  ON public.companies FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own companies"
  ON public.companies FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.3  people
-- --------------------------------------------------------------------------
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own people"
  ON public.people FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own people"
  ON public.people FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own people"
  ON public.people FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own people"
  ON public.people FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.4  tags
-- --------------------------------------------------------------------------
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags"
  ON public.tags FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tags"
  ON public.tags FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tags"
  ON public.tags FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tags"
  ON public.tags FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.5  person_tags (junction — verify ownership through parent tables)
-- --------------------------------------------------------------------------
ALTER TABLE public.person_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own person_tags"
  ON public.person_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = person_tags.person_id
        AND people.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own person_tags"
  ON public.person_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = person_tags.person_id
        AND people.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tags
      WHERE tags.id = person_tags.tag_id
        AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own person_tags"
  ON public.person_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = person_tags.person_id
        AND people.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 4.6  notes_on_person
-- --------------------------------------------------------------------------
ALTER TABLE public.notes_on_person ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes_on_person"
  ON public.notes_on_person FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notes_on_person"
  ON public.notes_on_person FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes_on_person"
  ON public.notes_on_person FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notes_on_person"
  ON public.notes_on_person FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.7  sections
-- --------------------------------------------------------------------------
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sections"
  ON public.sections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sections"
  ON public.sections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sections"
  ON public.sections FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own sections"
  ON public.sections FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.8  notes
-- --------------------------------------------------------------------------
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON public.notes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notes"
  ON public.notes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.9  todos
-- --------------------------------------------------------------------------
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own todos"
  ON public.todos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own todos"
  ON public.todos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own todos"
  ON public.todos FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own todos"
  ON public.todos FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.10 meetings
-- --------------------------------------------------------------------------
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON public.meetings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meetings"
  ON public.meetings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own meetings"
  ON public.meetings FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.11 meeting_attendees (junction — verify ownership through meetings)
-- --------------------------------------------------------------------------
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meeting_attendees"
  ON public.meeting_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_attendees.meeting_id
        AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meeting_attendees"
  ON public.meeting_attendees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_attendees.meeting_id
        AND meetings.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.people
      WHERE people.id = meeting_attendees.person_id
        AND people.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meeting_attendees"
  ON public.meeting_attendees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings
      WHERE meetings.id = meeting_attendees.meeting_id
        AND meetings.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 4.12 roadmaps
-- --------------------------------------------------------------------------
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roadmaps"
  ON public.roadmaps FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own roadmaps"
  ON public.roadmaps FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own roadmaps"
  ON public.roadmaps FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own roadmaps"
  ON public.roadmaps FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.13 roadmap_tasks (verify ownership through roadmaps)
-- --------------------------------------------------------------------------
ALTER TABLE public.roadmap_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roadmap_tasks"
  ON public.roadmap_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = roadmap_tasks.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own roadmap_tasks"
  ON public.roadmap_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = roadmap_tasks.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own roadmap_tasks"
  ON public.roadmap_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = roadmap_tasks.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = roadmap_tasks.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own roadmap_tasks"
  ON public.roadmap_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.roadmaps
      WHERE roadmaps.id = roadmap_tasks.roadmap_id
        AND roadmaps.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 4.14 conversations
-- --------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.15 chat_messages (verify ownership through conversations)
-- --------------------------------------------------------------------------
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat_messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = chat_messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat_messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = chat_messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own chat_messages"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = chat_messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = chat_messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chat_messages"
  ON public.chat_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = chat_messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 4.16 project_clients
-- --------------------------------------------------------------------------
ALTER TABLE public.project_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_clients"
  ON public.project_clients FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own project_clients"
  ON public.project_clients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own project_clients"
  ON public.project_clients FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own project_clients"
  ON public.project_clients FOR DELETE
  USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.17 project_companies
-- --------------------------------------------------------------------------
ALTER TABLE public.project_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_companies"
  ON public.project_companies FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own project_companies"
  ON public.project_companies FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own project_companies"
  ON public.project_companies FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own project_companies"
  ON public.project_companies FOR DELETE
  USING (user_id = auth.uid());


-- ============================================================================
-- SECTION 5: Triggers
-- ============================================================================

-- --------------------------------------------------------------------------
-- 5.1  Auto-create profile on new user signup
-- --------------------------------------------------------------------------
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------------
-- 5.2  Auto-update updated_at timestamps
-- --------------------------------------------------------------------------
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_roadmaps_updated_at
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- SECTION 6: Realtime
-- ============================================================================

-- Enable realtime for chat_messages so the UI can subscribe to new messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;


-- ============================================================================
-- SECTION 7: Grants (ensure anon and authenticated roles can access)
-- ============================================================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table-level permissions to authenticated role (RLS enforces row-level)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant sequence usage for any auto-generated values
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anon role only needs access to profiles for the signup trigger
GRANT SELECT ON public.profiles TO anon;
