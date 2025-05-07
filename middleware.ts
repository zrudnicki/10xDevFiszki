import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes
  if (!session && (req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/study"))) {
    const redirectUrl = new URL("/auth/sign-in", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If session and trying to access auth routes
  if (session && req.nextUrl.pathname.startsWith("/auth")) {
    const redirectUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/dashboard/:path*", "/study/:path*", "/auth/:path*"],
}
