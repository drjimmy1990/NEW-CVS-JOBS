'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'

interface ExternalApplyButtonProps {
    jobId: string
    sourceUrl: string
    platform: string
}

export function ExternalApplyButton({ jobId, sourceUrl, platform }: ExternalApplyButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        setLoading(true)
        try {
            // Track the click
            await fetch(`/api/external-jobs/${jobId}/click`, { method: 'POST' })
        } catch {
            // Don't block redirect if tracking fails
        }
        // Open source URL in new tab
        window.open(sourceUrl, '_blank', 'noopener,noreferrer')
        setLoading(false)
    }

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-blue-500/25 transition-all text-base py-6"
        >
            {loading ? (
                <Loader2 className="h-5 w-5 animate-spin me-2" />
            ) : (
                <ExternalLink className="h-5 w-5 me-2" />
            )}
            تقدم على {platform}
        </Button>
    )
}
