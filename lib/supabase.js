import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase = null

if (typeof window !== 'undefined') {
  if (!globalThis.__supabase_client__) {
    globalThis.__supabase_client__ = createClient(url, key)
  }
  supabase = globalThis.__supabase_client__
} else {
  supabase = createClient(url, key)
}

export default supabase