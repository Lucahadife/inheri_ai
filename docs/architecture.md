# Architecture

## Frontend
- Next.js App Router with server components for data fetching.
- Client components for interactive forms and tables.
- Shared UI elements in `ui/`.

## Backend
- Supabase Postgres with row-level security.
- Supabase Storage bucket `asset-docs` for private documents.
- Server actions and API routes for writes and AI endpoints.

## Data access
- `data/` contains Supabase clients and DB helpers.
- All data access is centralized and permission-aware.

## Logic
- `logic/` contains rule-based allocation functions.
- Allocation prioritizes equal market value distribution before emotional optimization.

## AI
- `ai/provider.ts` wraps the OpenAI client with a swappable interface.
- Prompts live in `ai/prompts/`.
- Zod schemas in `ai/schemas/` validate outputs.
