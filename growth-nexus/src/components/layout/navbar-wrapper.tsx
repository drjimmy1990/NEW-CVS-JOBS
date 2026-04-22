import { headers } from 'next/headers'
import { Navbar } from './navbar'

export async function NavbarWrapper() {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || ''

    // Don't render navbar on dashboard or auth pages
    const hiddenPrefixes = ['/employer', '/candidate', '/admin', '/login', '/register']
    const shouldHide = hiddenPrefixes.some(prefix => pathname.startsWith(prefix))

    if (shouldHide) {
        return null
    }

    return <Navbar />
}
