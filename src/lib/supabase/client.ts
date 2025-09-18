import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { config, hasValidSupabaseConfig } from '@/lib/config'

export function createClient() {
  if (!hasValidSupabaseConfig()) {
    console.warn('Using placeholder Supabase configuration. Please set environment variables.')
  }

  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.anonKey
  )
}