import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/** Dev-only: serves /api/guidance from the Vite process so the Anthropic key stays server-side locally too. */
function guidanceDevApi(env: Record<string, string>): Plugin {
  return {
    name: 'guidance-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/guidance', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        const chunks: Buffer[] = []
        for await (const c of req) chunks.push(c as Buffer)
        const mod = await server.ssrLoadModule('/server/guidance.ts')
        const { status, json } = await mod.handleGuidance(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'), env.ANTHROPIC_API_KEY)
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(json))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), guidanceDevApi(env)],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: { port: 5173, strictPort: true },
  }
})
