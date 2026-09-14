import { useSession } from '@/app/session'
import { useSnapshot } from '@/app/data'
import type { Snapshot } from '@/data/datasource'
import type { Persona } from '@/domain/types'

/** The signed-in demo persona plus the loaded snapshot. Pages render loading/error states via `status`. */
export function useActor(): { snap: Snapshot | undefined; actor: Persona | null; status: 'loading' | 'error' | 'ready'; error?: string; refetch: () => void } {
  const { personaId } = useSession()
  const q = useSnapshot()
  const actor = q.data?.personas.find((p) => p.id === personaId) ?? null
  return { snap: q.data, actor, status: q.isLoading ? 'loading' : q.isError ? 'error' : 'ready', error: (q.error as Error | null)?.message, refetch: () => q.refetch() }
}
