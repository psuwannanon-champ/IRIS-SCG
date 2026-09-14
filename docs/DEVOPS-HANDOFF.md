# DevOps hand-off · SCG Capability Suite prototype

| Item | Value |
| --- | --- |
| Repository | https://github.com/psuwannanon-champ/IRIS-SCG · branch `main` (public repository; no secrets committed) |
| Hosting | Vercel project `iris-scg`, team `psuwannanon`, framework preset Vite, GitHub integration connected (push to `main` = production deploy) |
| Build | root `/` · install `pnpm install` · build `pnpm build` · output `dist/` |
| Runtime | Node 24.x · pnpm 11.x · Vite 8 |
| SPA routing | Rewrite all paths to `/index.html` (Vercel: `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`) |
| Public env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key only) |
| Server-only secrets | None required by the browser app. Database password / service-role key are used only by whoever applies migrations; never in `VITE_*`. |
| Database | Supabase project `bczqgxqlvgbauvtkvdnu` (IRIS-SCG, ap-southeast-1). Migrations `0001_schema.sql` and `0002_seed.sql` applied 14 Sep 2026 via `scripts/apply-sql.ts` over the session pooler. RLS: anon read only; writes via SECURITY DEFINER functions. |
| Storage | None (no file uploads in the prototype) |
| CORS / origin | Supabase REST accepts browser calls with the publishable key; add the production origin to Auth URL configuration if Supabase Auth is introduced later. |
| Auth | Not used (persona switch). If enabled later: set Site URL and redirect URLs to the production hostname. |
| Custom hostname | To be decided (e.g. `capability-demo.example.com`). Add to Vercel first, then give DNS the CNAME shown by Vercel. |
| Access protection | **Not enabled.** The production URL is public and exposes all demo personas (fictional data). Recommended before sharing widely: Vercel Deployment Protection (password) on production. |
| Health / smoke | `/login` renders; `/home` after choosing a persona; header badge shows *Connected to Supabase*; create an evidence entry as Nara and confirm it appears after reload. |
| Rollback | Redeploy previous Vercel build; database reset via `select public.reset_demo();` |
