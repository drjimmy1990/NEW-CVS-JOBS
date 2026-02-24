import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

    // Refresh session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Route protection logic
    const pathname = request.nextUrl.pathname

    // Protected routes
    const protectedRoutes = ['/employer', '/candidate', '/admin']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !user) {
        // Redirect to login if not authenticated
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    // Role-based access control
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // If no profile exists, create one based on the route they're trying to access
        if (!profile) {
            // Try to get role from user metadata
            const role = user.user_metadata?.role || 'candidate'

            // Create profile
            await supabase.from('profiles').insert({
                id: user.id,
                email: user.email,
                role: role,
                full_name: user.user_metadata?.full_name || ''
            })

            // Allow access - profile was just created
            return supabaseResponse
        }

        if (profile) {
            // Check if employer has a company, create if not
            if (profile.role === 'employer' && pathname.startsWith('/employer')) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single()

                if (!company) {
                    const fullName = user.user_metadata?.full_name || ''
                    const companySlug = (fullName || 'company').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
                    await supabase.from('companies').insert({
                        owner_id: user.id,
                        name: fullName ? fullName + "'s Company" : 'My Company',
                        slug: companySlug
                    })
                }
            }

            // Employers cannot access candidate routes
            if (pathname.startsWith('/candidate') && profile.role === 'employer') {
                return NextResponse.redirect(new URL('/employer/dashboard', request.url))
            }
            // Candidates cannot access employer routes
            if (pathname.startsWith('/employer') && profile.role === 'candidate') {
                return NextResponse.redirect(new URL('/candidate/dashboard', request.url))
            }
            // Admin routes only for admins
            if (pathname.startsWith('/admin') && profile.role !== 'admin') {
                return NextResponse.redirect(new URL('/', request.url))
            }
        }
    }

    return supabaseResponse
}
