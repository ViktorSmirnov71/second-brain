# CLAUDE.md — Second Brain Project Guide

**Version:** 2.0
**Last Updated:** 2026-02-10
**Project:** Second Brain — AI-powered personal knowledge management system

---

## Project Overview

Second Brain is a voice-first, AI-powered personal knowledge management platform that helps users capture, organize, and retrieve information through natural conversation. It combines CRM functionality, note-taking, task management, meeting organization, and roadmap planning into a unified intelligent assistant.

**Core Philosophy:** Voice-first interaction with Apple-inspired minimalist design. The AI assistant automatically routes and organizes information without requiring manual categorization from users.

**Key Features:**
- Natural language voice and text interaction with Claude AI
- Intelligent CRM for managing people and relationships
- Hierarchical note-taking with AI-assisted organization
- Meeting notes with automatic structuring
- Task management with natural language processing
- Project roadmaps with Gantt visualization
- Real-time voice transcription and synthesis via Deepgram

---

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom glassmorphism design tokens
- **UI Components:** Radix UI primitives via shadcn/ui
- **Icons:** Lucide React
- **State Management:** TanStack React Query (server state), useState/useRef (local state)
- **Routing:** React Router v6 with protected routes
- **Rich Text:** contentEditable with custom formatting toolbar
- **Drag & Drop:** @dnd-kit
- **Charts:** Recharts (for Gantt charts)
- **Markdown:** react-markdown

### Backend & Services
- **BaaS:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI:** Anthropic Claude API (via Supabase Edge Functions)
- **Voice STT:** Deepgram WebSocket streaming API (nova-2 model)
- **Voice TTS:** Deepgram REST API (Aura voices)
- **Automation:** n8n (connected as MCP server)

### Key Libraries
- `react-resizable-panels` — sidebar layout management
- `@dnd-kit` — drag and drop for Kanban and task reordering
- `cmdk` — command menu (Cmd+K)
- `sonner` — toast notifications
- `date-fns` — date manipulation

---

## Design System — Apple Minimalism + Glassmorphism

### Theme
**Dark-only theme** with deep black base and subtle gradients.

**Background:**
- Base: `hsl(0 0% 3%)` (near black)
- Accent: Subtle radial gradient (blue-purple at ~5% opacity, centered top-right)

### Glassmorphism Tokens

Apply these Tailwind utility classes consistently:

| Token | Classes | Usage |
|-------|---------|-------|
| `glass-panel` | `bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06]` | Sidebar, cards, modals |
| `glass-surface` | `bg-white/[0.03] backdrop-blur-xl border border-white/[0.04]` | Input fields, secondary surfaces |
| `glass-popover` | `bg-white/[0.08] backdrop-blur-3xl border border-white/[0.08] shadow-2xl` | Dropdowns, tooltips, command menu |
| `glass-active` | `bg-white/[0.08]` | Hover and active states |
| `glass-divider` | `border-white/[0.06]` | All borders and dividers |

### Typography

- **Font Stack:** `-apple-system, BlinkMacSystemFont, 'Inter', sans-serif`
- **Body Text:** 14px, `text-white/70`, letter-spacing `-0.01em`
- **Headings:** `text-white/90`, font-weight 600
- **Muted Text:** `text-white/40`
- **Page Titles:** 28px, font-weight 300 (Apple keynote style)

### Color Palette

| Role | HSL | Usage |
|------|-----|-------|
| Primary | `hsl(217 100% 60%)` | Blue — links, buttons, active states |
| Success | `hsl(160 84% 39%)` | Green — confirmations, voice connected |
| Destructive | `hsl(0 72% 51%)` | Red — delete, end call, errors |
| Warning | `hsl(45 93% 47%)` | Amber — upcoming dates, cautions |

### Spacing & Layout

- **Radius:** `0.875rem` (14px) — Apple's preferred large radius
- **Shadows:** Minimal. Use `shadow-none` on most elements. Only popovers/modals get `shadow-2xl`
- **Padding:** Generous spacing — minimum `p-6` on panels, `p-4` on cards
- **Icons:** Lucide, 20px default, `stroke-width: 1.5`, `text-white/50` default

### Animations

- **Timing:** `transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]`
- **Philosophy:** Subtle, physics-based. No bounce, no overshoot. Quick settle like Apple's spring animations
- **Scrollbars:** Hidden by default (`scrollbar-none`), use edge-fades to indicate scrollability

### Design Principles

1. **Negative space is a feature** — Generous padding, never crowd elements
2. **One action per screen** — Voice interface is the hero, everything else supports it
3. **Progressive disclosure** — Show minimum, reveal on interaction
4. **Direct manipulation** — Prefer drag/swipe/tap over menus
5. **Reduce visual noise** — No unnecessary borders, shadows, or color

---

## Architecture & Key Decisions

### Authentication
- Supabase Auth with email/password
- Protected routes wrapper (`ProtectedRoutes`) redirects unauthenticated users to `/auth`
- Row Level Security (RLS) enforces per-user data isolation

### Voice Architecture (Deepgram)

**Two-service approach:**

1. **Speech-to-Text (STT):** WebSocket streaming
   - Model: `nova-2`
   - Features: interim results, smart formatting, endpointing, utterance detection
   - API key kept server-side (Edge Function returns pre-authenticated WebSocket URL)
   - Partial transcripts shown as italic bubbles
   - Final transcripts sent to AI chat engine

2. **Text-to-Speech (TTS):** REST API
   - Default voice: `aura-asteria-en` (warm female)
   - Called from Edge Function after AI response
   - Audio played via Web Audio API

**Connection Flow:**
1. User clicks "Start Voice" → request mic permission
2. Client calls Edge Function → receives scoped WebSocket URL
3. Client streams audio chunks → receives transcripts
4. On final transcript → send to AI chat
5. On AI response → call TTS Edge Function → play audio
6. User clicks "End" → close WebSocket, stop mic

### AI Chat Engine

**System Prompt Design:**
- Defines personality: helpful, proactive, concise
- Routing rules for content types (philosophy → Philosophies section, idea → Ideas, etc.)
- 11 tool definitions for CRUD operations
- Context includes: people (up to 50), note titles, roadmap summaries

**Client-Side Execution:**
- Edge Function streams SSE (text deltas + tool_calls)
- Client parses stream, displays text
- After stream completes, client executes tool calls (create_person, add_note, etc.)
- Results shown as execution cards below AI message

**Available Tools:**
- `create_person`, `update_person`, `add_note_on_person`, `delete_person`
- `create_note`, `update_note`, `delete_note`
- `create_task`, `create_roadmap`
- `ask_clarification`, `draft_content`

### Data Model Highlights

**Core Tables:**
- `profiles` — user settings, preferences
- `people` — CRM contacts with tags
- `notes_on_person` — timestamped observations
- `sections` — organize notes (hierarchy/kanban/list views)
- `notes` — hierarchical content with metadata
- `todos` — tasks with scheduling
- `roadmaps` + `roadmap_tasks` — project timelines
- `meetings` — with raw and organized notes
- `conversations` + `chat_messages` — AI chat history

**Key Relationships:**
- Notes can have parent/child relationships (hierarchical)
- Tasks can link to projects (notes) and people
- Meetings link to projects and attendees (people)
- Roadmap tasks link to assignees (people) and have dependencies

### State Management

- **Server State:** TanStack React Query for caching, invalidation, optimistic updates
- **Local State:** useState for UI state, useRef for mutable values
- **Persistence:** localStorage for sidebar sizes, collapsed states, view preferences

### Scroll Containment (CRITICAL)

**Problem:** Flex containers don't constrain child height by default.

**Solution:** Every scrollable area requires proper flex height chain:

```tsx
// Each flex ancestor needs min-h-0
<div className="h-screen flex flex-col">
  <div className="flex-1 min-h-0 flex">
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* scrolls here */}
      </div>
    </div>
  </div>
</div>
```

**Horizontal scroll protection (Gantt chart):**
- CSS: `overscroll-behavior-x: none` on `<body>` globally
- CSS: `overscroll-behavior-x: contain` on scroll container
- JS: `wheel` event listener with `{ passive: false }`, `preventDefault()` at edges

**Use native `overflow-y-auto`** instead of Radix ScrollArea for primary scroll containers.

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** — no implicit any, strict null checks
- **Type everything** — interfaces for data models, props, API responses
- **Prefer interfaces over types** for object shapes
- **Use utility types:** `Partial<T>`, `Pick<T>`, `Omit<T>`, `Required<T>`

```typescript
// Good
interface Person {
  id: string;
  name: string;
  company: string | null;
  tags: string[];
}

// Avoid
type Person = {
  id: string;
  name: string;
  company?: string;
  tags: string[];
}
```

### React Components

- **Functional components only** — no class components
- **Named exports** for components (not default exports)
- **Props interface naming:** `ComponentNameProps`
- **Hooks at top** of component body
- **Early returns** for loading/error/empty states

```typescript
interface ChatMessageProps {
  message: Message;
  isStreaming: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const { user } = useAuth();

  if (!message) return null;

  // Component logic
}
```

### Custom Hooks

- **Prefix with `use`**
- **Single responsibility** — one hook, one concern
- **Return object with named properties** (not arrays)

```typescript
// Good
export function useAIChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
  };
}

// Avoid returning arrays like [messages, sendMessage]
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components (glass-styled)
│   └── chat/           # Chat-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities, helpers, constants
├── pages/              # Route components
├── types/              # TypeScript interfaces and types
└── integrations/       # External service clients
    └── supabase/       # Supabase client and queries
```

### Naming Conventions

- **Components:** PascalCase (`ChatMessage`, `TodoItem`)
- **Hooks:** camelCase with `use` prefix (`useAIChat`, `useDeepgramAgent`)
- **Utils:** camelCase (`formatDate`, `parseMarkdown`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_MESSAGE_LENGTH`)
- **Files:** kebab-case for multi-word (`chat-message.tsx`, `use-ai-chat.ts`)

### Styling

- **Tailwind utility classes** — avoid custom CSS unless necessary
- **Glass tokens** — use predefined tokens (`glass-panel`, `glass-surface`, etc.)
- **Responsive design** — mobile-first, use `md:` prefix for desktop
- **No inline styles** — use className only

```tsx
// Good
<div className="glass-panel p-6 rounded-[14px] space-y-4">
  <h2 className="text-lg font-semibold text-white/90">Title</h2>
</div>

// Avoid
<div style={{ background: 'rgba(255,255,255,0.04)' }}>
```

### Error Handling

- **Try/catch for async operations**
- **Toast notifications** for user-facing errors
- **Console errors** for development debugging
- **Graceful degradation** — don't break UI on error

```typescript
try {
  await createPerson(data);
  toast.success('Person created successfully');
} catch (error) {
  console.error('Failed to create person:', error);
  toast.error('Failed to create person. Please try again.');
}
```

### Performance

- **Debounce user input** — 300ms for capture, 500ms for save
- **React Query caching** — appropriate staleTime and cacheTime
- **Lazy loading** — code split routes with `React.lazy()`
- **Memoization** — use `useMemo` and `useCallback` for expensive operations
- **Virtualization** — consider for long lists (>100 items)

---

## Important Conventions

### Voice UI States

The voice interface has four distinct states that must be clearly indicated:

1. **Idle/Listening:** Green dot + "Listening..."
2. **User Speaking:** Blue pulsing waveform + "Hearing you..."
3. **AI Speaking:** Purple pulsing dot + "Speaking..."
4. **Processing:** Subtle shimmer + "Thinking..."

Always show status bar when voice is active.

### Auto-Save Pattern

Notes and meetings use debounced auto-save:

```typescript
// Capture changes after 300ms of inactivity
const debouncedCapture = useDebouncedCallback((value) => {
  setCapturedValue(value);
}, 300);

// Save to server after 500ms of captured value stability
useEffect(() => {
  const timer = setTimeout(() => {
    saveToServer(capturedValue);
  }, 500);
  return () => clearTimeout(timer);
}, [capturedValue]);
```

### Empty States

Every content area needs an empty state:

```tsx
<div className="flex flex-col items-center justify-center py-12 space-y-4">
  <Icon className="h-12 w-12 text-white/20" />
  <div className="text-center space-y-1">
    <p className="text-white/90 font-medium">No items yet</p>
    <p className="text-white/40 text-sm">Get started by creating your first item</p>
  </div>
  <Button>Create Item</Button>
</div>
```

### Loading States

Use appropriate loading indicators:

- **Page loading:** Centered `<Loader2>` spinner
- **Button loading:** Inline `<Loader2>` with disabled state
- **Content loading:** Skeleton matching expected shape
- **Streaming text:** Typing dots → blinking cursor

### Mobile Responsiveness

- **Breakpoint:** 768px (`md:` prefix)
- **Sidebars:** Convert to Sheet drawers on mobile
- **Tables:** Switch to card/grid layout
- **Navigation:** Bottom nav instead of sidebar
- **Actions:** Use FABs (Floating Action Buttons) for primary actions
- **Input font-size:** Minimum 16px to prevent iOS zoom

### Keyboard Shortcuts

Always support keyboard navigation:

- **Global shortcuts:** `Cmd+K` (command menu), `Cmd+N` (quick note)
- **Modal shortcuts:** `Escape` to close, `Enter` to submit
- **List navigation:** Arrow keys, `Enter` to select
- **Slash commands:** `/` triggers SlashMenu in editor

### Data Validation

- **Email:** RFC 5322 compliant regex
- **Passwords:** Minimum 6 characters
- **Required fields:** Show clear error states
- **Date ranges:** Start date must be before end date
- **Tags:** Strip whitespace, convert to lowercase

### API Error Handling

Edge Function error codes:

- `429` — Rate limit exceeded
- `402` — Credit/quota exhausted
- `500` — Generic server error
- `400` — Invalid request (show specific message from response)

### Accessibility

- **Semantic HTML:** Use proper elements (`<button>`, `<nav>`, `<main>`)
- **ARIA labels:** For icon-only buttons
- **Focus management:** Visible focus rings, logical tab order
- **Color contrast:** Ensure WCAG AA compliance (text-white/70 on dark background)
- **Screen reader text:** Use `sr-only` class for hidden labels

---

## Section-Specific Guidelines

### Notes System

- **Default sections:** Active Projects, Ideas, Things to Try, Philosophies
- **View types:** hierarchy, kanban, list, gallery
- **Type routing:**
  - "philosophy" → Philosophies section
  - "idea" → Ideas section
  - "thing" → Things to Try section
  - "project" or "page" → Active Projects section
- **Metadata:** Store icon emoji, cover URL, isTask, dueDate in JSON `metadata` column

### Task Management

- **List types:** current, scheduled, unscheduled
- **Groupings:** Today, Tomorrow, This Week, Next Week, Later, Unscheduled
- **Natural language:** TodoChat sends to `todo-chat` Edge Function
- **Optimistic adds:** If message doesn't look like question, immediately add as task

### Roadmaps

- **Task staggering:** First task starts today, each subsequent starts after previous ends
- **Default duration:** 5-7 days per task
- **Dependencies:** Array of task IDs, render in Gantt as connecting lines
- **Milestones:** Boolean flag, render as diamond in Gantt
- **Scroll protection:** MUST implement horizontal scroll containment (see §1.4)

### People CRM

- **Tags:** Stored in junction table, colored badges
- **Notes on person:** Separate table with timestamps
- **Company linking:** Optional foreign key to `companies` table
- **Meeting history:** Query meetings by attendee junction table

---

## Edge Functions Reference

All AI interactions go through Supabase Edge Functions to keep API keys server-side.

### `chat`
**Purpose:** Main AI orchestration
**Input:** `{ conversationId, message, context }`
**Output:** SSE stream with text deltas and tool_calls
**Model:** Claude via Anthropic API

### `todo-chat`
**Purpose:** Natural language task management
**Input:** `{ message, currentTodos }`
**Output:** `{ action, data, response }`

### `organize-meeting-notes`
**Purpose:** Structure raw meeting notes
**Input:** `{ rawNotes, meetingId }`
**Output:** `{ organizedNotes (HTML), attendeeLinks[] }`

### `search-meetings`
**Purpose:** Semantic meeting search
**Input:** `{ query }`
**Output:** `{ results: [{ meetingId, relevanceScore, excerpt }] }`

### `generate-roadmap-tasks`
**Purpose:** AI-generate project timeline
**Input:** `{ title, description, preferences }`
**Output:** `{ tasks: [{ title, duration, dependencies }] }`

### `deepgram-stt-token`
**Purpose:** Generate scoped Deepgram access
**Input:** `{}`
**Output:** `{ websocketUrl }` (pre-authenticated)

### `deepgram-tts`
**Purpose:** Text-to-speech synthesis
**Input:** `{ text, voiceId }`
**Output:** Audio buffer (binary)

---

## Common Pitfalls & Solutions

### Scroll Not Working
**Problem:** Flex container doesn't constrain height
**Solution:** Add `min-h-0` to all flex ancestors, use native `overflow-y-auto`

### Voice Connection Fails
**Problem:** API key exposed in client
**Solution:** Always proxy through Edge Function, never send key to client

### Chat Input Blocked During Voice
**Problem:** Users can't correct voice errors
**Solution:** Keep chat input enabled during voice session (dual input mode)

### Auto-Save Race Conditions
**Problem:** Multiple saves in flight
**Solution:** Use double debounce (300ms capture + 500ms save)

### Mobile Sidebar Doesn't Close
**Problem:** Sheet state not synchronized
**Solution:** Pass explicit `open` and `onOpenChange` props to Sheet

### Gantt Chart Scrolls Whole Page
**Problem:** Horizontal scroll leaks to body
**Solution:** Implement scroll protection (see §1.4)

### Tags Not Saving
**Problem:** Junction table not updated
**Solution:** Use batch upsert with delete-then-insert pattern

### RLS Blocks Data Access
**Problem:** Row Level Security policy missing
**Solution:** Ensure all tables have `user_id = auth.uid()` policy for SELECT/INSERT/UPDATE/DELETE

---

## Testing & Quality Assurance

### Manual Testing Checklist

- [ ] Voice connects and transcribes correctly
- [ ] AI responds to natural language commands
- [ ] Auto-save works without data loss
- [ ] Mobile responsive on iOS and Android
- [ ] Keyboard shortcuts work
- [ ] Empty states render properly
- [ ] Error toasts appear on failure
- [ ] Scroll containment prevents page scroll
- [ ] RLS prevents unauthorized access
- [ ] Glass effects render with proper transparency

### Browser Support

- **Chrome/Edge:** Latest 2 versions
- **Safari:** Latest 2 versions (test iOS Safari specifically)
- **Firefox:** Latest 2 versions
- **Mobile:** iOS 15+, Android 11+

### Performance Targets

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Voice latency:** < 300ms from speech end to transcript
- **AI response start:** < 1s (streaming)
- **Auto-save debounce:** 300ms + 500ms

---

## Deployment & Environment

### Environment Variables

Required for Supabase Edge Functions:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
ANTHROPIC_API_KEY=xxx
DEEPGRAM_API_KEY=xxx
```

### Supabase Setup

1. Enable Auth with email provider
2. Create all tables with RLS policies
3. Deploy Edge Functions to production
4. Enable Realtime for `chat_messages` table

### Build & Deploy

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy Edge Functions
supabase functions deploy chat
supabase functions deploy deepgram-stt-token
supabase functions deploy deepgram-tts
# ... repeat for all functions
```

---

## Resources & References

- **PDR Document:** `second-brain-pdr-v2.md` (complete specification)
- **Design System:** Apple Human Interface Guidelines
- **Voice API:** Deepgram documentation
- **AI Model:** Anthropic Claude API documentation
- **Backend:** Supabase documentation
- **UI Components:** shadcn/ui + Radix UI

---

## Questions & Support

For AI teammates:
- Always read the PDR document for detailed specifications
- Reference this guide for coding conventions and patterns
- When in doubt, follow Apple's design principles: clarity, deference, depth
- Keep voice interaction as the primary interface, everything else is secondary

**Remember:** This is a voice-first application. The AI assistant should feel conversational, helpful, and proactive. Every feature should support natural language interaction.
