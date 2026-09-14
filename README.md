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

### Schema status

Both migrations were applied to project `bczqgxqlvgbauvtkvdnu` (IRIS-SCG) on 14 Sep 2026 and verified through the app. To re-apply or reset:

- Reset the demo scenario (keeps schema): run `select public.reset_demo();` in the SQL editor.
- Re-apply from scratch: `DB_URL="postgresql://postgres.bczqgxqlvgbauvtkvdnu:<DB_PASSWORD>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" npx tsx scripts/apply-sql.ts supabase/migrations/0001_schema.sql supabase/migrations/0002_seed.sql` (the direct `db.<ref>` host is IPv6-only; use the session pooler). Never commit the password.

Regenerate the seed after editing fixtures: `pnpm seed:sql`.

## Hosting

- GitHub: https://github.com/psuwannanon-champ/IRIS-SCG (branch `main`)
- Vercel project `iris-scg` (team psuwannanon), connected to the GitHub repo: every push to `main` deploys production. Environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set for production and preview.
- `vercel.json` sets the Vite build and the SPA rewrite so direct links such as `/contracts/ic-nara` load.

## Stack

Vite 8 · React 19 · TypeScript · TanStack Router and Query · React Hook Form + Zod · Zustand (client preferences only) · Tailwind v4 tokens · Supabase JS. Icons are verified Duocolor exports from Champ's Untitled UI Icons PRO v1.6 Figma library (`src/icons/provenance.json`).

## Known limitations

- Persona switching replaces authentication; no passwords or service keys are in the browser.
- AI diagnostic, personalisation engine and AI coach are simulated and labelled as such.
- HR core sync, email notifications and Start the Dot hand-off are not connected.
- Cohort creation, team formation and marketplace shortlisting are not implemented.
- Brand tokens are placeholders pending approved SCG logo, colours and typeface.
