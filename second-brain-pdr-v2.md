# SECOND BRAIN — Product Design Requirements

**Version:** 2.0  
**Date:** 2026-02-10  
**Target:** Claude Code implementation  
**Voice Provider:** Deepgram (replacing ElevenLabs)  
**Design Language:** Apple-inspired minimalism + glassmorphism

---

## 1. PLATFORM ARCHITECTURE

### 1.1 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| UI | Radix UI primitives via shadcn/ui, Lucide icons |
| State | TanStack React Query (server), useState/useRef (local) |
| Routing | React Router v6, protected routes |
| Backend | Supabase (Auth, Postgres, Edge Functions, Realtime) |
| AI Chat | Anthropic Claude via Supabase Edge Functions |
| Voice | Deepgram (STT via WebSocket streaming, TTS via REST API) |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Markdown | react-markdown |
| Automation | n8n (connected as MCP server) |

### 1.2 Design System — Apple Minimalism + Glassmorphism

The entire UI follows Apple's Human Interface Guidelines philosophy: clarity, deference, depth. Every surface should feel like frosted glass floating over a subtle gradient background.

**Theme:** Dark-only  
**Background:** Multi-layered — a deep black base (`hsl(0 0% 3%)`) with a subtle radial gradient accent (very faint blue-purple at ~5% opacity, centered top-right)

**Glassmorphism Tokens:**

| Token | Value | Usage |
|---|---|---|
| `glass-panel` | `bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06]` | Sidebar, cards, modals |
| `glass-surface` | `bg-white/[0.03] backdrop-blur-xl border border-white/[0.04]` | Input fields, secondary surfaces |
| `glass-popover` | `bg-white/[0.08] backdrop-blur-3xl border border-white/[0.08] shadow-2xl` | Dropdowns, tooltips, command menu |
| `glass-active` | `bg-white/[0.08]` | Hover and active states |
| `glass-divider` | `border-white/[0.06]` | All borders and dividers |

**Typography:**

| Element | Style |
|---|---|
| Font | SF Pro Display (system font stack: `-apple-system, BlinkMacSystemFont, 'Inter', sans-serif`) |
| Body | 14px, `text-white/70`, letter-spacing `-0.01em` |
| Headings | `text-white/90`, font-weight 600 |
| Muted | `text-white/40` |
| Page titles | 28px, font-weight 300 (thin, Apple keynote style) |

**Color Palette:**

| Role | Value | Usage |
|---|---|---|
| Primary | `hsl(217 100% 60%)` | Blue — links, primary buttons, active states |
| Success | `hsl(160 84% 39%)` | Green — confirmations, voice connected |
| Destructive | `hsl(0 72% 51%)` | Red — delete, end call, errors |
| Warning | `hsl(45 93% 47%)` | Amber — upcoming dates, cautions |

**Radius:** `0.875rem` (14px) — Apple's preferred large radius  
**Shadows:** Minimal. Use `shadow-none` on most elements. Only popovers and modals get `shadow-2xl` with black/20 spread.  
**Animations:** Subtle, physics-based. `transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]`. No bounce, no overshoot. Apple-style spring: quick settle.  
**Scrollbar:** Hidden by default (`scrollbar-none`), content edge-fades indicate scrollability.  
**Icons:** Lucide, 20px default, `stroke-width: 1.5`, `text-white/50` default.

**Key Apple Principles to Follow:**

1. **Negative space is a feature.** Generous padding (p-6 minimum on panels, p-4 on cards). Never crowd elements.
2. **One action per screen.** The voice interface is the hero. Everything else supports it.
3. **Progressive disclosure.** Show the minimum. Reveal on interaction.
4. **Direct manipulation.** Drag, swipe, tap — avoid menus where gestures work.
5. **Reduce visual noise.** No unnecessary borders, shadows, or color. Let content breathe.

### 1.3 Layout Architecture

The app uses `react-resizable-panels` for the desktop sidebar + main content split. The sidebar is collapsible (min 64px icons-only, default 240px, max 320px). State persisted in localStorage.

**Desktop:**
```
┌──────────────┬─────────────────────────────────────────┐
│  AppSidebar  │  Main Content (Outlet)                  │
│  (glass)     │                                         │
│              │                                         │
│  - Brain ◎   │                                         │
│  - Nav items │                                         │
│              │                                         │
│  ─ ─ ─ ─ ─  │                                         │
│  - Settings  │                                         │
│  - Sign Out  │                                         │
│  - Collapse  │                                         │
└──────────────┴─────────────────────────────────────────┘
```

**Mobile:**
```
┌─────────────────────────────────────────┐
│  Main Content (full width)              │
│                                         │
├─────────────────────────────────────────┤
│  [Chat] [People] [To Do] [Cal] [Gear]  │
└─────────────────────────────────────────┘
```

Mobile bottom nav: `backdrop-blur-2xl bg-black/60 border-t border-white/[0.06]`, safe-area padding.

### 1.4 Scroll Containment (CRITICAL)

Every scrollable area must follow these rules to prevent scroll leaking to the browser window:

**Flex height chain:** Every flex ancestor between the viewport and the scroll container needs `min-h-0`:

```
h-screen flex flex-col
  └── flex-1 min-h-0 flex
        └── flex-1 min-h-0 flex flex-col
              └── flex-1 min-h-0 overflow-y-auto  ← scrolls here
```

**Horizontal scroll protection (Gantt chart):**
- CSS: `overscroll-behavior-x: none` on `<body>` globally
- CSS: `overscroll-behavior-x: contain` on the scroll container
- JS: `wheel` event listener with `{ passive: false }`, call `preventDefault()` at left/right edges

**Use native `overflow-y-auto` instead of Radix ScrollArea** for all primary scroll containers. Radix ScrollArea breaks when the height chain isn't perfect.

---

## 2. AUTHENTICATION (`/auth`)

### 2.1 Layout

Centered card with subtle gradient background. Floating brain icon (animated gentle pulse), thin title "Second Brain", subtitle "Your AI-powered second brain". Glass-panel card with Login/Sign Up tabs.

### 2.2 Behavior

| Scenario | Behavior |
|---|---|
| Already authenticated | `<Navigate to="/" replace />` |
| Loading auth state | Centered Loader2 spinner |
| Sign Up | Min 6-char password, toast: "Check your email to confirm" |
| Invalid credentials | Toast: "Invalid email or password" |
| Email not confirmed | Toast: "Please check your email to confirm your account" |
| Already registered | Toast: "An account with this email already exists" |

---

## 3. GLOBAL NAVIGATION

### 3.1 Desktop Sidebar

Glass-panel surface. Items in order:

1. **Chat** (`/`, MessageSquare) — default landing page
2. **People** (`/people`, Users)
3. **Meetings** (`/meetings`, Calendar)
4. **Notes** (`/notes`, FileText)
5. **To Do** (`/todos`, CheckSquare)
6. **Philosophies** (`/philosophies`, BookOpen)
7. **Roadmaps** (`/roadmaps`, Map)

Footer: Settings, Sign Out, Collapse toggle.

Active: `glass-active text-white/90`  
Inactive: `text-white/40 hover:text-white/70 hover:glass-active`  
Collapsed: Icons only, centered, with tooltip on hover.

### 3.2 Mobile Bottom Nav

Five items: Chat, People, To Do, Calendar, Settings.  
Active: `text-white` with 2px dot indicator below.

### 3.3 Command Menu (`Cmd+K`)

Glass-popover dialog using `cmdk`. Groups: Quick Actions, Navigation, People (search), Notes (search). Fuzzy search across all items.

### 3.4 Global Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` | Command Menu |
| `Cmd+N` | Quick Note Modal |
| `Cmd+/` | Keyboard Shortcuts Modal |

---

## 4. CHAT / AI COMMAND CENTER (`/`)

This is the **primary interface**. Voice-first design means the voice controls are prominent and the text input is secondary.

### 4.1 Layout

**Desktop:**
```
┌───────────────┬──────────────────────────────────────┐
│ Conversations │  Chat Header (title + voice button)  │
│ (w-64, glass) │──────────────────────────────────────│
│               │  [Voice Status — always visible]     │
│ - New Chat    │──────────────────────────────────────│
│ - Conv 1      │  Messages (scrollable)               │
│ - Conv 2      │    - Welcome / AI messages           │
│               │    - User messages                   │
│               │    - Streaming indicator              │
│               │    - Action result cards              │
│               │    - Live transcript                  │
│               │──────────────────────────────────────│
│               │  ChatInput (fixed bottom)            │
└───────────────┴──────────────────────────────────────┘
```

**Mobile:** Conversation list in slide-from-left Sheet. Hamburger in header.

### 4.2 Conversation List

- "New Chat" button at top
- Sorted by most recent
- Title auto-generated from first message
- Right-click/long-press: Rename, Delete

### 4.3 Chat Header

**Voice Call button** is the hero action — large, prominent:
- Idle: Outline button with Mic icon + "Start Voice"
- Connecting: Spinner + "Connecting..."
- Connected: Destructive button with MicOff icon + "End"

Secondary actions: Quick Note (StickyNote), Add Person (UserPlus). Mobile: collapsed into 3-dot menu.

### 4.4 Voice Status Bar

Always visible below header when Deepgram is connected:

- Listening (idle): Green dot + "Listening..."
- User speaking: Blue pulsing waveform + "Hearing you..."
- AI speaking: Purple pulsing dot + "Speaking..."
- Processing: Subtle shimmer + "Thinking..."

`glass-surface` background with `border-b glass-divider`.

### 4.5 Welcome Message (Empty State)

Single assistant message:

```
Hi! I'm your Second Brain assistant. I can help you:

- **Remember people** — "I just met Sarah from Google, she's great at ML"
- **Add notes about people** — "Make a note that John is good at React"
- **Create tasks & reminders** — "Remind me to follow up with Lisa next week"
- **Capture ideas** — "I have an idea for a new app..."
- **Refine philosophies** — "Let's refine my thoughts on failure"
- **Search your knowledge** — Ask me anything about your stored data

I'll automatically route and organize everything. How can I help?
```

### 4.6 No Conversation State

Centered: Floating Mic icon in `glass-panel` circle with gentle float animation, "No conversation selected", "Start New Chat" button.

### 4.7 Chat Messages

**User messages:** Right-aligned, `bg-primary text-white`, `rounded-2xl rounded-br-md`. Supports @mention and #tag parsing as inline badges.

**Assistant messages:** Left-aligned, `glass-panel`, `rounded-2xl rounded-bl-md`. Content via ReactMarkdown with custom prose styling.

**System messages:** Centered pill, `glass-surface`, icon + text + timestamp.

**Voice messages:** Mic icon + waveform visualization above text.

**Streaming:** Typing dots when empty, blinking cursor when streaming.

**Execution Result Cards:** Below message. Icon by type (person=green Users, note=blue FileText, task=amber ListTodo, roadmap=purple MapPin). Action label + entity title. Clickable → navigates.

**Clarification Cards:** Question text + row of outline buttons with options. Clicking sends as follow-up.

**Draft Preview Cards:** Title + type badge, content preview (max 128px overflow), target section. Three buttons: Save (green), Edit (blue), Discard (red).

### 4.8 Chat Input

- Textarea, auto-resize (min 48px, max 150px)
- Placeholder: `"Type a message... @ to mention, # for tags"`
- `glass-surface` styling, `rounded-2xl`
- Enter submits, Shift+Enter newline
- @mention dropdown: triggers on `@`, shows filtered people
- #tag dropdown: triggers on `#`, shows filtered tags
- Mic button: toggles Deepgram STT recording
  - Listening: red pulsing dot + "Listening..." + stop button
- Send button: circular, `bg-white text-black`, Loader2 when disabled

### 4.9 AI Chat Engine (`useAIChat` hook)

On send:
1. Build context: people (up to 50 with recent notes), sections with note titles, roadmaps with task titles
2. Send to `chat` edge function via SSE streaming
3. Edge function uses Claude with system prompt + tool definitions
4. Client parses SSE deltas for text + tool_calls
5. After stream completes, execute tool calls client-side

**AI Tools (11 total, defined in edge function):**

| Tool | Purpose |
|---|---|
| `create_person` | Create new CRM contact |
| `update_person` | Update person profile fields |
| `add_note_on_person` | Add timestamped observation about a person |
| `delete_person` | Delete a person |
| `create_note` | Create note/idea/philosophy in appropriate section |
| `update_note` | Update existing note |
| `delete_note` | Delete a note |
| `create_task` | Create a task (standalone or in roadmap) |
| `create_roadmap` | Create a new roadmap |
| `ask_clarification` | Show disambiguation cards |
| `draft_content` | Show editable draft preview |

**Section Routing:**
- type "philosophy" → Philosophies section
- type "idea" → Ideas section
- type "thing" → Things to Try section
- default (page) → Active Projects section

### 4.10 Voice Agent — Deepgram Integration (`useDeepgramAgent` hook)

Replaces ElevenLabs entirely. Two Deepgram services:

**Speech-to-Text (STT):** Deepgram WebSocket streaming API
- Model: `nova-2` (or latest general model)
- Features: `interim_results=true`, `smart_format=true`, `endpointing=300`, `utterance_end_ms=1000`
- Connect via `wss://api.deepgram.com/v1/listen`
- API key stored in Supabase Edge Function (never exposed to client)
- Client sends raw audio chunks from `MediaRecorder` (WebM/Opus) or `AudioWorklet` (PCM)
- Receives JSON frames: `is_final: false` → partial transcript, `is_final: true` → final transcript
- Partial transcripts shown as italic right-aligned bubble with pulsing Mic
- Final transcripts sent as regular user message to AI

**Text-to-Speech (TTS):** Deepgram REST API
- Endpoint: `POST https://api.deepgram.com/v1/speak`
- Model: `aura-asteria-en` (default female) or `aura-orion-en` (male)
- Called from Supabase Edge Function after AI response
- Returns audio buffer, played via Web Audio API on client
- Voice selector in Settings: dropdown of Deepgram Aura voices

**Connection Flow:**
1. User clicks "Start Voice" → client requests mic permission
2. Client calls Supabase Edge Function to get a scoped Deepgram WebSocket URL (keeps API key server-side)
3. Edge Function returns a short-lived pre-authenticated WebSocket URL
4. Client opens WebSocket, starts streaming mic audio
5. On `is_final` transcript → send to AI chat engine
6. On AI response complete → call TTS edge function → play audio
7. User clicks "End" → close WebSocket, stop mic

**Voice-First UI When Active:**
- Header voice button turns destructive ("End")
- Status bar shows real-time state
- Chat input is NOT disabled (user can still type while voice is active)
- Live partial transcripts appear in real-time
- Both user and assistant voice messages get Mic icon + waveform
- System messages: "Voice started" / "Voice ended" as centered pills

### 4.11 Quick Note Modal (`Cmd+N`)

Glass-popover modal. Single textarea. Save with toast confirmation.

### 4.12 Add Person Modal

Fields: Name (required), Company, Email, LinkedIn, Phone, Met At, Tags (multi-select). Glass-panel styling. Saves via `usePeople` hook, adds confirmation message to active conversation.

---

## 5. PEOPLE CRM (`/people`)

### 5.1 Layout

```
┌──────────────────────────────────────────┐
│ Header: "People" + [Add Person]          │
│──────────────────────────────────────────│
│ Toolbar: [Search] [Tags filter] [View]   │
│──────────────────────────────────────────│
│ Content: Table (desktop) / Grid (mobile) │
│──────────────────────────────────────────│
│ Mobile: FAB (UserPlus icon)              │
└──────────────────────────────────────────┘
```

### 5.2 Features

- Search: filters by name, company, email, met_at
- Tag filter: multi-select checkboxes with colored dots
- View toggle: Table / Grid (auto-grid on mobile)
- Table columns: Name, Company, Email, Tags, Added date. Rows clickable.
- Grid: 1–4 cols responsive. PersonCard shows avatar/initials, name, company, tags.

### 5.3 Person Detail Panel

Sheet/Drawer. Contains:
- Editable fields: name, company, email, LinkedIn, phone, met_at
- Tag management
- Notes section (timestamped, from `notes_on_person` table)
- Meeting history (PersonMeetingsSection)
- Delete with confirmation

### 5.4 Empty States

- No people: Users icon + "No people yet" + "Add your first contact" + button
- No search results: Search icon + "No matches found" + "Try adjusting filters"

### 5.5 Data Model

```
Person: id, user_id, name, company, company_id, email, phone, 
        linkedin, met_at, notes, avatar_url, relationship, 
        created_at, updated_at
+ tags[] (junction table)
+ last_note_date (computed)
```

---

## 6. MEETINGS (`/meetings`)

### 6.1 Layout

**List view (default):** Header with count + New Meeting button, search bar, scrollable meeting list grouped by date.

**Editor view (meeting selected):** Back button, "Organize with AI" button, PageHeader with icon + title, date, linked project, attendees (MentionBadges), RichTextEditor for notes.

### 6.2 Features

| Feature | Details |
|---|---|
| New Meeting modal | Title, date picker, raw notes textarea |
| Meeting search | Calls `search-meetings` edge function for semantic search |
| Organize with AI | Sends raw notes to `organize-meeting-notes` edge function, returns structured HTML |
| Project linker | Dropdown of notes with type "project" |
| Delete | AlertDialog confirmation |

### 6.3 Data Model

```
Meeting: id, user_id, title, raw_notes, organized_notes, 
         meeting_date, linked_project_id, created_at, updated_at
+ attendees[] (junction table → Person)
```

---

## 7. NOTES (`/notes`)

### 7.1 Layout

**Desktop:**
```
┌───────────────┬──────────────────────────────────────┐
│ NotesSidebar  │ Header: [toggle] [section] [view]    │
│ (Resizable)   │──────────────────────────────────────│
│ - Sections    │ Content:                             │
│ - Notes tree  │   Hierarchy / Kanban / List / Gallery │
│ - Add Section │   OR NoteEditor (when selected)      │
└───────────────┴──────────────────────────────────────┘
  [Add with AI FAB — bottom-right, green Sparkles icon]
```

**Mobile:** Sidebar in Sheet, hamburger toggle.

### 7.2 Default Sections (created on first use)

| Section | View Type | Notes |
|---|---|---|
| Active Projects | hierarchy | Default section |
| Ideas | kanban | Columns: New, Exploring, On Hold, Done |
| Things to Try | list | |
| Philosophies | list | |

### 7.3 Section Views

**Hierarchy:** Tree with parent/child notes. Each node shows title, type badge, children count. Can add child pages.

**Kanban:** Drag-and-drop columns. Cards show title + preview. Column management (add/rename/delete). Uses `@dnd-kit`.

**List:** Flat list with title, type, updated date.

**Gallery:** Grid of cards with larger content previews. Toggle via ViewToggle.

### 7.4 Note Editor

The core content editing experience.

**Header:** Back arrow, "Updated [date]" timestamp, dropdown menu (add sub-page, favorites, tags, delete).

**PageHeader:** Clickable emoji icon (EmojiPicker), optional cover image, large editable title.

**RichTextEditor:** `contentEditable`-based, `document.execCommand` formatting, debounced auto-save (300ms capture → 500ms save).

**Floating Toolbar** (on text selection):
- Bold (`Cmd+B`), Italic (`Cmd+I`), Underline (`Cmd+U`)
- Text size: Normal, H1, H2, H3

**Slash Commands** (`/` at start of line triggers SlashMenu):

| Command | Result |
|---|---|
| `/page` | Nested sub-page |
| `/h1`, `/h2`, `/h3` | Headings |
| `/bullet` | Bullet list |
| `/numbered` | Numbered list |
| `/todo` | Checkbox item |
| `/quote` | Blockquote |
| `/divider` | Horizontal rule |
| `/callout` | Highlighted info box |

SlashMenu: keyboard nav (arrows), type-to-filter, Enter to select, Escape to close.

**Sub-pages:** Shown below editor with FileText icon + title + chevron. Breadcrumb navigation.

**Project Notes** (type "project"): Additional tabs — Content, Contacts (ProjectClientsView), Meetings (ProjectMeetingsSection).

### 7.5 Add with AI Modal

Floating green Sparkles button → modal to describe what to create → AI generates title, content, type, section → preview before saving.

### 7.6 Data Model

```
Note: id, user_id, section_id, parent_id, title, content (HTML),
      type (project|group|page|idea|philosophy|thing),
      status, metadata (JSON: icon, coverUrl, isTask, dueDate),
      sort_order, created_at, updated_at

Section: id, user_id, name, description, 
         view_type (hierarchy|list|kanban),
         sort_order, is_default, kanban_columns[], 
         created_at, updated_at
```

---

## 8. TO-DO (`/todos`)

### 8.1 Layout

**Desktop:**
```
┌──────────────────┬───────────────────────────┐
│ TodoChat (40%)   │ Task List (60%)           │
│ ResizablePanel   │ - Current Section         │
│                  │ - Upcoming Section        │
│ Chat input for   │ - Past Section            │
│ adding tasks     │                           │
└──────────────────┴───────────────────────────┘
```

**Mobile:** Tab switcher (Tasks | Chat), one visible at a time.

### 8.2 Task Sections

**Current:** Tasks with `list_type: 'current'` and no future date. Quick-add input at top. Drag-to-reorder.

**Upcoming:** Grouped by: Today, Tomorrow, This Week (by day), Next Week, Later, Unscheduled. Collapsible groups.

**Past:** Completed tasks grouped by completion date. Shows completion ratio per day.

### 8.3 TodoChat

Natural language task management. Sends to `todo-chat` edge function with current todos as context. Supports: create, complete, update, delete, query. Optimistic add: if message doesn't look like a question, immediately adds as task. Keeps last 15 messages in memory.

### 8.4 TodoItem

Circle checkbox with completion animation. Title (strikethrough when complete). Date badge. Swipeable on mobile. Context menu on desktop.

### 8.5 Data Model

```
Todo: id, user_id, title, status (active|complete), date,
      list_type (current|scheduled|unscheduled),
      linked_project_id, linked_person_id, notes, tags[],
      sort_order, created_at, updated_at, completed_at
```

---

## 9. PHILOSOPHIES (`/philosophies`)

Simple list page reading from the "Philosophies" section in Notes.

**First-time:** BookOpen icon + "Your Philosophies" + "Document your core beliefs..." + "Create Philosophies Section" button.

**Empty (section exists):** "No philosophies yet" + two buttons: "Add manually" (outline) + "Add with AI" (primary, Sparkles).

---

## 10. ROADMAPS (`/roadmaps`)

### 10.1 Layout

```
┌───────────────┬─────────────────────────────────────┐
│ Sidebar       │ Header: [title] + [Timeline|Gantt|  │
│ - Roadmap list│                    Settings tabs]   │
│ - New Roadmap │─────────────────────────────────────│
│               │ Tab Content                         │
└───────────────┴─────────────────────────────────────┘
```

### 10.2 Tabs

**Timeline:** Vertical scrollable task list. Each task: title, date range, duration, milestone badge, completion checkbox. "Amend with AI" panel. Add Task button. Uses native `overflow-y-auto` with proper flex height chain (see §1.4).

**Gantt:** Horizontal timeline chart. Tasks as bars. Zoom: day/halfMonth/month/quarter. Scroll protection per §1.4 (body `overscroll-behavior-x: none` + wheel handler with `passive: false`). Desktop-only notice on mobile.

**Settings:** Edit title, description, link project, delete.

### 10.3 Create Roadmap

Title + description + optional project link. AI generates tasks via `generate-roadmap-tasks` edge function. Tasks staggered across weeks (first task starts today, each subsequent starts after previous ends, 5–7 day default duration).

### 10.4 Amend with AI

Text input describing changes → sends current tasks + instruction → returns modified task list → replaces all existing tasks.

### 10.5 Task Edit Modal

Title, start/end date, duration, milestone toggle, completion toggle, dependencies (multi-select), assignee (person from CRM), delete.

### 10.6 Data Model

```
Roadmap: id, user_id, title, linked_project_id, description,
         created_at, updated_at

RoadmapTask: id, roadmap_id, title, start_date, end_date,
             duration, dependencies[], assignee_id,
             is_milestone, is_completed, sort_order, created_at
```

---

## 11. CALENDAR (`/calendar`)

### 11.1 Views

**Agenda (default, mobile):** Chronological upcoming event list.  
**Week (desktop):** 7-column grid with hourly rows. Prev/Next/Today navigation.

### 11.2 Event Detail Modal

Title, description, time range, location, attendees (linked to People CRM), linked notes, context summary.

### 11.3 Current State

Mock data. Footer: "Showing mock events. Connect Google Calendar in Settings to see real events."

---

## 12. SETTINGS (`/settings`)

Single scrollable column, `max-w-2xl`, five glass-panel card sections:

### 12.1 Profile

Avatar (with change button), Full Name input, Email input.

### 12.2 Integrations

- **Google Calendar:** Connected status, sync status, last synced
- **Telegram:** Connected status, bot username

### 12.3 Voice (Deepgram)

- Deepgram API Key input (masked)
- Voice selector dropdown — Deepgram Aura voices:

| Voice ID | Name | Description |
|---|---|---|
| `aura-asteria-en` | Asteria | Female, warm, conversational (default) |
| `aura-luna-en` | Luna | Female, soft, calm |
| `aura-stella-en` | Stella | Female, clear, professional |
| `aura-athena-en` | Athena | Female, authoritative |
| `aura-hera-en` | Hera | Female, expressive |
| `aura-orion-en` | Orion | Male, deep, confident |
| `aura-arcas-en` | Arcas | Male, warm, friendly |
| `aura-perseus-en` | Perseus | Male, clear, neutral |
| `aura-angus-en` | Angus | Male, casual |
| `aura-orpheus-en` | Orpheus | Male, rich, storytelling |

### 12.4 AI Behavior

- Proactive Suggestions toggle
- Auto-Categorization: Minimal / Balanced / Aggressive
- Default section for new notes

### 12.5 Data

- Export Data button
- Delete Account button (destructive)

---

## 13. EDGE FUNCTIONS

### 13.1 `chat`

AI orchestration for main Chat page. Uses Claude via Anthropic API. SSE streaming. 11 tool definitions. System prompt defining personality, capabilities, routing rules.

### 13.2 `todo-chat`

Natural language task management. Returns JSON with action + data.

### 13.3 `organize-meeting-notes`

Raw notes → structured HTML + optional attendee links.

### 13.4 `search-meetings`

Semantic search. Returns `{ meetingId, relevanceScore, excerpt }[]`.

### 13.5 `generate-roadmap-tasks`

AI-generates staggered tasks from title + description + preferences.

### 13.6 `extract-person-info`

Free-text → structured `{ name, company, email, linkedin, phone, met_at, tags }`.

### 13.7 `process-note-content`

User description → `{ title, content, type, section_name }`.

### 13.8 `deepgram-stt-token`

Generates a short-lived scoped Deepgram API key or pre-authenticated WebSocket URL for client-side STT. Keeps the main API key server-side.

### 13.9 `deepgram-tts`

Text + voiceId → audio buffer via Deepgram Aura TTS API.

---

## 14. BEHAVIORAL DETAIL

### 14.1 Notifications

Sonner toast library. Dark glass styling. Top-right desktop, top-center mobile. Auto-dismiss ~4s. Types: success (green), error (red), info (blue).

### 14.2 Voice Misunderstanding Handling

- Partial transcripts shown in italic with "..." suffix
- Final (potentially wrong) transcript sent as regular message
- AI may use `ask_clarification` tool
- Failed transcription → toast: "Failed to transcribe audio"
- User can always correct by typing

### 14.3 Voice-First Active UI

- Voice button turns destructive
- Status bar shows real-time state with waveform
- Chat input remains enabled (dual input mode)
- Live partials appear as italic bubbles
- Voice messages get Mic icon + waveform visualization
- System messages: "Voice started" / "Voice ended"

### 14.4 Loading States

| Context | Pattern |
|---|---|
| Page loading | Centered Loader2 spinner or Skeleton placeholders |
| Action loading | Inline Loader2 in button, disabled state |
| Content loading | Skeleton matching expected content shape |
| Streaming | Typing dots → blinking cursor |

### 14.5 Empty States

Every content area: Large muted icon (h-8 to h-16) + title + description + CTA button. Gentle float animation on icon.

### 14.6 Mobile Responsiveness

- Breakpoint at 768px (`md:`)
- Sidebars → Sheet drawers
- Header actions → dropdown menus
- Tables → card/grid views
- FABs for primary actions
- Bottom nav with safe-area padding
- Input font-size 16px (prevents iOS zoom)

### 14.7 Auto-Save

Notes and meetings: 300ms capture debounce → 500ms save debounce. No explicit Save button.

### 14.8 Drag and Drop

`@dnd-kit/core` + `@dnd-kit/sortable`. Used in Kanban columns and Todo reorder. GripVertical handle, opacity reduction on drag, blue indicator for drop target.

---

## 15. COMPANIES (Secondary Entity)

```
Company: id, user_id, name, website, industry, notes, created_at, updated_at
ProjectClient: id, project_id, person_id, user_id, role, status, created_at
ProjectCompany: id, project_id, company_id, user_id, relationship, created_at
```

Linked to people via `company_id`. Linked to projects via junction tables. Managed through CompanyDetailPanel, ProjectClientsView, AddProjectClientModal.

---

## 16. CROSS-CUTTING CONCERNS

### 16.1 Auth Guard

All routes except `/auth` wrapped in `ProtectedRoutes`. Redirects to `/auth` if unauthenticated. Spinner while checking.

### 16.2 Data Persistence

All CRUD through Supabase client. React Query for caching/invalidation/optimistic updates. Conversations + messages in `conversations` and `chat_messages` tables. RLS enforces per-user data isolation.

### 16.3 Sidebar Persistence

localStorage keys: `app-sidebar-size`, `app-sidebar-collapsed`, `notes-sidebar-size`, `notes-sidebar-collapsed`, `notes-view-[sectionId]`.

### 16.4 Error Handling

- API errors → toast
- Network errors → generic toast
- Auth errors → specific messages
- Edge function errors: 429 (rate limit), 402 (credits), 500 (generic)

---

## 17. KEY DIFFERENCES FROM LOVABLE VERSION

| Area | Lovable (old) | Claude Code (new) |
|---|---|---|
| Voice provider | ElevenLabs (WebRTC agent) | Deepgram (WebSocket STT + REST TTS) |
| AI model | Gemini 3 Flash Preview | Claude (Anthropic API) |
| Voice connection | Single WebRTC pipe via ElevenLabs agent | Two services: Deepgram STT WebSocket + TTS REST |
| Voice architecture | ElevenLabs handles orchestration | Client orchestrates: STT → AI chat → TTS pipeline |
| API key handling | Client-side agent connection | Server-side only (edge functions proxy Deepgram) |
| Design | Dark theme with glass effects | Apple-minimalist dark + refined glassmorphism |
| Scroll handling | Radix ScrollArea | Native `overflow-y-auto` with flex height chain |
| Automation | — | n8n as MCP server |

---

*End of PDR v2.0*
