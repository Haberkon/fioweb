import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.redirect(new URL('/login', req.url))

  // verificar rol en app_user
  const { data: userData } = await supabase
    .from('app_user')
    .select('rol')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (userData?.rol !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!login).*)'], // proteger todo menos /login
}
