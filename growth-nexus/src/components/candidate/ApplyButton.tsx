'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { ApplyModal } from '@/components/candidate/ApplyModal'

type ApplyButtonProps = {
    jobId: string
    jobTitle: string
    companyName: string
    className?: string
    children?: React.ReactNode
}

export function ApplyButton({ jobId, jobTitle, companyName, className, children }: ApplyButtonProps) {
    const router = useRouter()
    const [showModal, setShowModal] = useState(false)
    const [isChecking, setIsChecking] = useState(false)

    const handleClick = async () => {
        setIsChecking(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            // Redirect to login with return URL
            router.push(`/login?redirect=/jobs/${encodeURIComponent(jobId)}`)
            return
        }

        // Check user role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'employer') {
            router.push('/employer/dashboard')
            return
        }

        setIsChecking(false)
        setShowModal(true)
    }

    return (
        <>
            <Button
                onClick={handleClick}
                disabled={isChecking}
                className={className || "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"}
            >
                {children || 'Apply Now'}
            </Button>

            <ApplyModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                jobId={jobId}
                jobTitle={jobTitle}
                companyName={companyName}
            />
        </>
    )
}
