import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DataSource, Snapshot } from '@/data/datasource'
import { LocalDataSource } from '@/data/local'
import { SupabaseDataSource, createSupabase } from '@/data/supabase'
import { toast } from '@/components/ui'

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } })

interface DataCtx { source: DataSource; backend: 'supabase' | 'local'; reason: string | null; supabaseUrl: string | null }
const Ctx = createContext<DataCtx | null>(null)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** Chooses Supabase when the schema is reachable, otherwise falls back to local fixtures with a visible banner. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<DataCtx | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const forceLocal = new URLSearchParams(window.location.search).get('backend') === 'local'
      if (SUPABASE_URL && SUPABASE_KEY && !forceLocal) {
        try {
          const sb = new SupabaseDataSource(createSupabase(SUPABASE_URL, SUPABASE_KEY))
          const ok = await sb.probe()
          if (ok) { if (!cancelled) setCtx({ source: sb, backend: 'supabase', reason: null, supabaseUrl: SUPABASE_URL }); return }
          if (!cancelled) setCtx({ source: new LocalDataSource(), backend: 'local', reason: 'Supabase project is reachable but the schema is not installed yet.', supabaseUrl: SUPABASE_URL })
          return
        } catch {
          if (!cancelled) setCtx({ source: new LocalDataSource(), backend: 'local', reason: 'Supabase could not be reached.', supabaseUrl: SUPABASE_URL })
          return
        }
      }
      if (!cancelled) setCtx({ source: new LocalDataSource(), backend: 'local', reason: forceLocal ? 'Local fixtures requested with ?backend=local.' : 'No Supabase configuration found.', supabaseUrl: SUPABASE_URL ?? null })
    })()
    return () => { cancelled = true }
  }, [])
  if (!ctx) return <div className="flex h-full items-center justify-center text-(--color-muted)">Connecting to data…</div>
  return <QueryClientProvider client={queryClient}><Ctx.Provider value={ctx}>{children}</Ctx.Provider></QueryClientProvider>
}

export function useData() {
  const c = useContext(Ctx)
  if (!c) throw new Error('DataProvider missing')
  return c
}

export const SNAPSHOT_KEY = ['snapshot'] as const

export function useSnapshot() {
  const { source } = useData()
  return useQuery<Snapshot>({ queryKey: SNAPSHOT_KEY, queryFn: () => source.loadSnapshot() })
}

/** Wraps a data-source mutation: invalidates the snapshot after success, surfaces DomainError text to the user. */
export function useAction<TArgs extends unknown[]>(fn: (source: DataSource, ...args: TArgs) => Promise<unknown>, successMessage?: string) {
  const { source } = useData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: TArgs) => fn(source, ...args),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: SNAPSHOT_KEY })
      if (successMessage) toast.success(successMessage)
    },
    onError: (e: Error) => toast.error(e.message || 'The action could not be completed.'),
  })
}

export function useInvalidate() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: SNAPSHOT_KEY })
}
