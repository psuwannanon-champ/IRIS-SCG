# SCG Capability Suite · prototype

Skills-first, project-based, AI-powered capability development platform for **Modernize SCG Capability Development 2027** (ABC and BCD accelerators, skill passport, impact ledger, gates, coaching, governance). Built for client walkthroughs with **fictional demo data**.

- Blueprint (roles, records, workflows, requirement matrix, integration register): `docs/BLUEPRINT.md`
- DevOps hand-off: `docs/DEVOPS-HANDOFF.md`
- Verification log: `docs/VERIFICATION.md`

## Run locally

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173. Choose a persona on the login page or press **Introduction to platform**.

## Backend

The app targets Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`). On start it probes the schema:

- **Connected to Supabase** (green badge): reads and writes go to the project; writes run through role-checked Postgres functions.
- **Local demo fixtures** (amber badge): the schema is not installed or unreachable, so the same scenario runs from `src/data/fixtures.ts` persisted in the browser. Add `?backend=local` to force this mode.

### Install the schema (one time)

The Supabase project `bczqgxqlvgbauvtkvdnu` is not linked to the Supabase connector used during development, so the SQL was not applied automatically. Either:

1. **SQL editor:** paste and run `supabase/migrations/0001_schema.sql`, then `supabase/migrations/0002_seed.sql`.
2. **CLI with the database password:**
   ```bash
   npx supabase db push --db-url "postgresql://postgres:<DB_PASSWORD>@db.bczqgxqlvgbauvtkvdnu.supabase.co:5432/postgres"
   ```

Reload the app; the badge turns green. `select public.reset_demo();` restores the demo scenario at any time (the UI has no reset button on purpose).

Regenerate the seed after editing fixtures: `pnpm seed:sql`.

## Stack

Vite 8 · React 19 · TypeScript · TanStack Router and Query · React Hook Form + Zod · Zustand (client preferences only) · Tailwind v4 tokens · Supabase JS. Icons are verified Duocolor exports from Champ's Untitled UI Icons PRO v1.6 Figma library (`src/icons/provenance.json`).

## Known limitations

- Persona switching replaces authentication; no passwords or service keys are in the browser.
- AI diagnostic, personalisation engine and AI coach are simulated and labelled as such.
- HR core sync, email notifications and Start the Dot hand-off are not connected.
- Cohort creation, team formation and marketplace shortlisting are not implemented.
- Brand tokens are placeholders pending approved SCG logo, colours and typeface.
