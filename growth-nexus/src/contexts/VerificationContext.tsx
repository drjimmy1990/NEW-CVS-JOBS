'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * Verification permissions matching the shape from verification-engine.ts
 */
export interface VerificationPermissions {
    canPublishJobs: boolean
    canViewCVs: boolean
    canMessageCandidates: boolean
    canSaveDrafts: boolean
    canEditProfile: boolean
    canUploadDocs: boolean
    canViewAnalytics: boolean
    canUseAI: boolean
}

interface VerificationContextValue {
    permissions: VerificationPermissions
    verificationStatus: string
    company: any | null
}

const VerificationContext = createContext<VerificationContextValue | null>(null)

interface VerificationProviderProps {
    children: ReactNode
    permissions: VerificationPermissions
    verificationStatus: string
    company: any | null
}

/**
 * Server → Client bridge for verification state.
 * Wraps employer layout children so any client page can call useVerification()
 * without re-querying the database.
 */
export function VerificationProvider({
    children,
    permissions,
    verificationStatus,
    company,
}: VerificationProviderProps) {
    return (
        <VerificationContext.Provider value={{ permissions, verificationStatus, company }}>
            {children}
        </VerificationContext.Provider>
    )
}

/**
 * Hook to access verification permissions and status from any client component
 * inside the employer layout.
 */
export function useVerification(): VerificationContextValue {
    const ctx = useContext(VerificationContext)
    if (!ctx) {
        // Fallback for pages rendered outside the provider (shouldn't happen
        // in normal flow but prevents crashes during development)
        return {
            permissions: {
                canPublishJobs: false,
                canViewCVs: false,
                canMessageCandidates: false,
                canSaveDrafts: false,
                canEditProfile: false,
                canUploadDocs: false,
                canViewAnalytics: false,
                canUseAI: false,
            },
            verificationStatus: 'pending_verification',
            company: null,
        }
    }
    return ctx
}
