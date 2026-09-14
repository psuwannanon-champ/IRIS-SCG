// Vercel serverless function: POST /api/guidance
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleGuidance } from '../server/guidance'

export const config = { maxDuration: 120 }

export default async function handler(req: IncomingMessage & { body?: unknown; method?: string }, res: ServerResponse) {
  if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Allow', 'POST'); res.end('Method not allowed'); return }
  let body = req.body
  if (body === undefined) {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    const raw = Buffer.concat(chunks).toString('utf8')
    body = raw ? JSON.parse(raw) : {}
  } else if (typeof body === 'string') body = JSON.parse(body)
  const { status, json } = await handleGuidance(body, process.env.ANTHROPIC_API_KEY)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(json))
}
