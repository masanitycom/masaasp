export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
  }
}

export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'

// Check if we have valid Supabase configuration
export const hasValidSupabaseConfig = () => {
  return (
    config.supabase.url !== 'https://placeholder.supabase.co' &&
    config.supabase.anonKey !== 'placeholder-key'
  )
}