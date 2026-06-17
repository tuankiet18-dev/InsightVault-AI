# Design

## System

InsightVault AI uses a restrained Knowledge IDE product register. Design serves
document work: navigation, evidence, permissions, job state, and billing state
matter more than decorative branding.

## Technology

- React 19 + Vite
- Tailwind CSS v4
- Radix UI primitives
- Lucide icons
- Plus Jakarta Sans with Inter/system fallback
- Framer Motion available for short state transitions

## Color

Existing app direction:

- Base background: slate near-white (`#f8fafc`)
- Text: dark slate/near-black
- Surfaces: white or subtle slate panels
- Primary: blue for main actions and selection
- AI accents: cyan/violet used sparingly for AI-specific affordances
- Semantic states: green success, amber warning, red danger, blue info

Design rule: keep the palette restrained. Use accent color for current
selection, primary action, source highlights, and state, not decoration.

## Typography

Use one family across the app: Plus Jakarta Sans with Inter/system fallback.

Product scale guidance:

- Page title: 24-30px, 700
- Section heading: 16-20px, 650-700
- Body: 14-16px, 400-500
- Dense labels and table metadata: 12-13px, 500-650
- Avoid fluid hero typography inside app surfaces.

## Layout

Primary product layout:

```text
Activity rail -> Explorer panel -> Workbench -> AI inspector
Top bar above workspace content
Status bar below workspace content
```

Rules:

- Keep app surfaces full-height and task-first.
- Collapse explorer/inspector on smaller screens.
- Prefer tabs, split panes, lists, and inline panels over modal-first flows.
- Compare and Reports remain workspace workbench tabs, not separate full-page
  destinations, so Explorer and AI Inspector context are preserved.
- Document tabs use a compact view switcher. `Original` opens first for
  previewable PDF, TXT, and Markdown files; `AI Summary` is the fallback for
  DOCX or unavailable previews.
- Cards are acceptable for repeated dashboard items and modal content, but not
  as nested page-section wrappers.

## Components

Core components should share one visual vocabulary:

- Buttons: icon buttons for tools, text buttons for clear commands.
- Inputs/selects: consistent height, radius, focus ring, disabled state.
- Tables/lists: dense rows with status chips, not decorative cards.
- Status chips: include text and color; never color alone.
- Empty states: tell users what to do next.
- Skeletons: preferred for loading content areas.
- Modals: used for focused create/invite/upload flows; avoid deep modal stacks.

## Product Surfaces

Required surfaces:

- Landing/login
- User dashboard
- Workspace IDE
- Document explorer and viewer
- Upload flow
- Chat/RAG inspector and optional full chat panel
- Compare panel
- Report viewer/list
- Admin dashboard/users/jobs
- Billing summary, plans, top-ups, checkout result states

## Motion

Motion should be fast and functional:

- 150-250ms transitions for panel width, hover, selection, and status changes.
- No page-load choreography.
- Respect `prefers-reduced-motion`.

## Known Design Gaps

- Billing UI is implemented with workspace summary, plan selection, top-ups,
  checkout redirects, and success/cancel result states.
- Chat Ask is connected to backend Chat/RAG APIs. It should default to the
  active workspace, narrow to active document/folder/report context, and keep
  source citations near the answer.
- Report list/detail navigation is implemented as workbench tabs; continue
  polishing affordances for opening generated reports from Compare.
- Duplicate workspace/layout component families should be consolidated.
- Several screens still depend on mock-style components or isolated routes.
- Mobile behavior needs structural adaptation beyond hidden side panels.
