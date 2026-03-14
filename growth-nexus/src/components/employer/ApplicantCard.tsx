'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Mail, FileText, ArrowLeft, ChevronDown
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const STATUSES = [
    { id: 'applied', label: 'تم التقديم' },
    { id: 'reviewing', label: 'قيد المراجعة' },
    { id: 'interview', label: 'مقابلة' },
    { id: 'shortlisted', label: 'القائمة المختصرة' },
    { id: 'rejected', label: 'مرفوض' },
]

type ApplicantCardProps = {
    applicationId: string
    candidateId: string
    candidateName: string
    jobTitle: string
    date: string
    currentStatus: string
    cvUrl?: string | null
}

export function ApplicantCard({
    applicationId,
    candidateId,
    candidateName,
    jobTitle,
    date,
    currentStatus,
    cvUrl,
}: ApplicantCardProps) {
    const [showMoveMenu, setShowMoveMenu] = useState(false)
    const [moving, setMoving] = useState(false)
    const [startingChat, setStartingChat] = useState(false)
    const router = useRouter()

    const moveToStatus = async (newStatus: string) => {
        setMoving(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('applications')
            .update({ status: newStatus })
            .eq('id', applicationId)

        if (!error) {
            router.refresh()
        }
        setMoving(false)
        setShowMoveMenu(false)
    }

    const startChat = async () => {
        setStartingChat(true)
        try {
            const res = await fetch('/api/conversations/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otherUserId: candidateId }),
            })
            const data = await res.json()
            if (data.conversationId) {
                router.push(`/employer/messages?chat=${data.conversationId}`)
            }
        } catch (e) {
            console.error('Failed to start chat', e)
        }
        setStartingChat(false)
    }

    return (
        <Card className="bg-navy-light border-gold/10 hover:border-gold/20 transition-all hover:shadow-lg hover:shadow-navy/50 group">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold text-sm shrink-0">
                            {candidateName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-cream">{candidateName}</p>
                            <p className="text-xs text-cream-dark/40">{jobTitle}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-cream-dark/40">{date}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-gold/10">
                    {/* CV Button */}
                    {cvUrl ? (
                        <a
                            href={cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-cream-dark/60 hover:text-cream py-1.5 rounded-md hover:bg-navy-lighter transition-colors"
                        >
                            <FileText className="h-3 w-3" /> سيرة
                        </a>
                    ) : (
                        <button
                            disabled
                            className="flex-1 flex items-center justify-center gap-1 text-xs text-cream-dark/20 py-1.5 rounded-md cursor-not-allowed"
                        >
                            <FileText className="h-3 w-3" /> لا توجد سيرة
                        </button>
                    )}

                    {/* Message Button — creates/finds conversation then navigates */}
                    <button
                        onClick={startChat}
                        disabled={startingChat}
                        className="flex-1 flex items-center justify-center gap-1 text-xs text-cream-dark/60 hover:text-cream py-1.5 rounded-md hover:bg-navy-lighter transition-colors"
                    >
                        <Mail className="h-3 w-3" />
                        {startingChat ? '...' : 'رسالة'}
                    </button>

                    {/* Move Button — dropdown */}
                    <div className="relative flex-1">
                        <button
                            onClick={() => setShowMoveMenu(!showMoveMenu)}
                            disabled={moving}
                            className="w-full flex items-center justify-center gap-1 text-xs text-gold hover:text-gold-light py-1.5 rounded-md hover:bg-gold/10 transition-colors"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            {moving ? '...' : 'نقل'}
                            <ChevronDown className="h-3 w-3" />
                        </button>

                        {showMoveMenu && (
                            <div className="absolute bottom-full mb-1 start-0 end-0 bg-navy-light border border-gold/20 rounded-lg shadow-xl z-50 overflow-hidden">
                                {STATUSES
                                    .filter(s => s.id !== currentStatus)
                                    .map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => moveToStatus(s.id)}
                                            className="w-full px-3 py-2 text-xs text-cream-dark/70 hover:text-cream hover:bg-navy-lighter text-right transition-colors"
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
