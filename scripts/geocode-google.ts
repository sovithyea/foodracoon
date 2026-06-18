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

const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY
if (!GOOGLE_KEY) {
  console.error('Missing GOOGLE_PLACES_KEY in .env.local')
  process.exit(1)
}

// Bias toward central Phnom Penh — 15km radius
const LOCATION = '11.5564,104.9282'
const RADIUS = 15000

async function searchPlace(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.set('query', query)
  url.searchParams.set('location', LOCATION)
  url.searchParams.set('radius', String(RADIUS))
  url.searchParams.set('key', GOOGLE_KEY!)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error(`  API error: ${data.status} — ${data.error_message ?? ''}`)
    return null
  }

  const loc = data.results?.[0]?.geometry?.location
  if (!loc) return null
  return { lat: loc.lat, lng: loc.lng }
}

async function run() {
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, address')

  if (error || !restaurants) {
    console.error('Failed to fetch restaurants:', error)
    process.exit(1)
  }

  console.log(`Geocoding ${restaurants.length} restaurants via Google Places...\n`)

  for (const r of restaurants) {
    const query = `${r.name}, Phnom Penh, Cambodia`
    console.log(`${r.name}`)
    console.log(`  query: ${query}`)

    let coords = await searchPlace(query)

    if (!coords && r.address) {
      // Fallback: try with address included
      const fallbackQuery = `${r.name} ${r.address} Phnom Penh`
      console.log(`  fallback: ${fallbackQuery}`)
      coords = await searchPlace(fallbackQuery)
    }

    if (!coords) {
      console.log(`  ✗ Not found — skipping\n`)
      continue
    }

    console.log(`  ✓ ${coords.lat}, ${coords.lng}`)

    const { error: updateErr } = await supabase
      .from('restaurants')
      .update({ latitude: coords.lat, longitude: coords.lng })
      .eq('id', r.id)

    if (updateErr) console.error(`  ✗ DB update failed:`, updateErr.message)

    console.log()
    // Stay well under Google's QPS limit
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('Done.')
}

run()
