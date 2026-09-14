# DevOps hand-off · SCG Capability Suite prototype

| Item | Value |
| --- | --- |
| Repository | Local git repository at `SCG-Capability-Suite` (no remote yet) · branch `main` |
| Hosting | Proposed: Vercel static site (React SPA). No project created; nothing deployed. |
| Build | root `/` · install `pnpm install` · build `pnpm build` · output `dist/` |
| Runtime | Node 24.x · pnpm 11.x · Vite 8 |
| SPA routing | Rewrite all paths to `/index.html` (Vercel: `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`) |
| Public env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key only) |
| Server-only secrets | None required by the browser app. Database password / service-role key are used only by whoever applies migrations; never in `VITE_*`. |
| Database | Supabase project `bczqgxqlvgbauvtkvdnu` (ap region as configured). Migrations in `supabase/migrations/` applied via SQL editor or `supabase db push --db-url`. |
| Storage | None (no file uploads in the prototype) |
| CORS / origin | Supabase REST accepts browser calls with the publishable key; add the production origin to Auth URL configuration if Supabase Auth is introduced later. |
| Auth | Not used (persona switch). If enabled later: set Site URL and redirect URLs to the production hostname. |
| Custom hostname | To be decided (e.g. `capability-demo.example.com`). Add to Vercel first, then give DNS the CNAME shown by Vercel. |
| Access protection | Recommended for a demo with privileged personas: Vercel password protection or an allow-listed preview. |
| Health / smoke | `/login` renders; `/home` after choosing a persona; header badge shows *Connected to Supabase*; create an evidence entry as Nara and confirm it appears after reload. |
| Rollback | Redeploy previous Vercel build; database reset via `select public.reset_demo();` |
