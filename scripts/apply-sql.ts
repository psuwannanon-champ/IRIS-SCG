// Applies the migrations to a Postgres database. Usage: DB_URL=postgresql://... npx tsx scripts/apply-sql.ts
import pg from 'pg'
import { readFileSync } from 'node:fs'
const url = process.env.DB_URL
if (!url) { console.error('DB_URL missing'); process.exit(1) }
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
for (const f of process.argv.slice(2)) {
  process.stdout.write(`applying ${f} … `)
  await client.query(readFileSync(f, 'utf8'))
  console.log('ok')
}
const { rows } = await client.query("select (select count(*) from personas) as personas, (select count(*) from impact_contracts) as contracts, (select count(*) from record_events) as events")
console.log(rows[0])
await client.end()
