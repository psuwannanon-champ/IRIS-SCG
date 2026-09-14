import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionState {
  personaId: string | null
  signIn: (id: string) => void
  signOut: () => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  tourSeen: boolean
  setTourSeen: (v: boolean) => void
  lang: 'en' | 'th'
  setLang: (v: 'en' | 'th') => void
}

/** Persisted client preferences only. Server data lives in TanStack Query. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      personaId: null,
      signIn: (id) => set({ personaId: id }),
      signOut: () => set({ personaId: null }),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      tourSeen: false,
      setTourSeen: (v) => set({ tourSeen: v }),
      lang: 'en',
      setLang: (v) => set({ lang: v }),
    }),
    { name: 'scg-capability-suite.session.v1' },
  ),
)
