import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch { /* already in shell */ }
}
loadEnv()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const seed = JSON.parse(
  readFileSync(join(process.cwd(), 'supabase/seed/restaurants.sample.json'), 'utf8')
) as Array<{ name: string; latitude: number; longitude: number }>

async function run() {
  console.log(`Restoring coordinates for ${seed.length} restaurants...`)
  for (const r of seed) {
    const { error } = await supabase
      .from('restaurants')
      .update({ latitude: r.latitude, longitude: r.longitude })
      .eq('name', r.name)
    if (error) {
      console.error(`  ✗ ${r.name}:`, error.message)
    } else {
      console.log(`  ✓ ${r.name} → ${r.latitude}, ${r.longitude}`)
    }
  }
  console.log('Done.')
}

run()
