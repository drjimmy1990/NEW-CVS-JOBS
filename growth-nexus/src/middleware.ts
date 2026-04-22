import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Run Supabase session refresh + route protection
    const response = await updateSession(request)

    // Inject pathname header for server components (NavbarWrapper)
    response.headers.set('x-pathname', request.nextUrl.pathname)

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
