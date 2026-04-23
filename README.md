# FairSplit AI

FairSplit AI is a collaborative inheritance planning tool that helps families fairly divide assets by combining market value estimates and emotional preferences. The system is rule-based and explainable, with optional AI assistance for valuation context, document summaries, and conflict resolution.

## Product goals
- Create estates and manage members 
- Add assets with documents stored
- Collect heir preferences and decedent preference boosts.
- Build scenarios (carts) with totals and comparisons.
- Generate explainable allocations with fairness metrics.
- Provide AI helpers via explicit, schema-validated endpoints.

## Tech stack
- Next.js App Router + TypeScript + Tailwind CSS
- Supabase: Auth, Postgres, Storage
- OpenAI (default provider) with swappable AI wrapper

## Repo structure
- `app/` Next.js routes and pages
- `ui/` reusable UI components
- `logic/` allocation/scenario/valuation rules
- `ai/` provider, prompts, schemas, workflows
- `data/` Supabase helpers, schema, seed
- `docs/` product + architecture docs
- `scripts/` seed and demo scripts

## Local setup
1) Install dependencies
```
npm install
```

2) Create `.env.local` from `.env.example`
```
cp .env.example .env.local
```

3) Run the dev server
```
npm run dev
```

## Supabase setup (manual)
1) Create a Supabase project.
2) Run SQL from `data/db/schema.sql` in the Supabase SQL editor.
3) Create a private Storage bucket named `asset-docs`.
4) Copy Project URL + anon key into `.env.local`.
5) Add the service role key as `SUPABASE_SERVICE_ROLE_KEY`.

## AI setup (manual)
1) Add `OPENAI_API_KEY` to `.env.local`.
2) Default model: `gpt-4o-mini`.

## Documentation
See `docs/overview.md` to start. Other docs:
- `docs/architecture.md`
- `docs/ai.md`
- `docs/fairness.md`
- `docs/demo.md`

## Scripts
Seed and demo scripts live in `scripts/`. See `docs/demo.md`.

Demo seed:
```
node --env-file .env.local scripts/seed-demo.mjs
```

## Notes
- No secrets are committed. Use `.env.local` for all credentials.
- AI endpoints are explicit and schema-validated.
