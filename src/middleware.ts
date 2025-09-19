import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Skip auth check for public routes
  if (request.nextUrl.pathname.startsWith('/auth-setup')) {
    return supabaseResponse
  }

  // Protect authenticated routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/organization') ||
      request.nextUrl.pathname.startsWith('/rewards') ||
      request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get user data from our users table using Auth email
    const { data: userData } = await supabase
      .from('users')
      .select('system_access_flg, admin_flg, user_id')
      .eq('mail_address', user.email)
      .single()

    // Check system access flag for all protected routes
    if (!userData?.system_access_flg) {
      return NextResponse.redirect(new URL('/access-denied', request.url))
    }

    // Check admin access for admin routes only
    if (request.nextUrl.pathname.startsWith('/admin-dashboard') ||
        request.nextUrl.pathname.startsWith('/admin')) {
      if (!userData?.admin_flg) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}