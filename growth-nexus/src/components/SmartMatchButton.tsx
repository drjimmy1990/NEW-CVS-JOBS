'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Loader2, X, Sparkles, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'

interface SmartMatchResult {
    candidate_id: string
    name: string
    score: number
    reasoning: string
    strengths: string[]
    gaps: string[]
    recommendation: string
}

interface Props {
    jobId: string
    jobTitle: string
    candidateIds: string[]
}

export default function SmartMatchButton({ jobId, jobTitle, candidateIds }: Props) {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<SmartMatchResult[] | null>(null)
    const [source, setSource] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [expanded, setExpanded] = useState(true)

    const handleSmartMatch = async () => {
        setLoading(true)
        setError(null)
        setResults(null)

        try {
            const res = await fetch('/api/ai/smart-match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: jobId,
                    candidate_ids: candidateIds.slice(0, 20), // max 20
                }),
            })

            const data = await res.json()

            if (data.error && !data.rankings) {
                setError(data.error)
            } else {
                setResults(data.rankings || [])
                setSource(data.source || 'ai')
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع')
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10'
        if (score >= 40) return 'text-amber-400 border-amber-500/50 bg-amber-500/10'
        return 'text-red-400 border-red-500/50 bg-red-500/10'
    }

    const getRecommendationColor = (rec: string) => {
        if (rec?.includes('جداً')) return 'bg-emerald-500/15 text-emerald-400'
        if (rec?.includes('مناسب') && !rec?.includes('غير')) return 'bg-blue-500/15 text-blue-400'
        if (rec?.includes('جزئي')) return 'bg-amber-500/15 text-amber-400'
        return 'bg-red-500/15 text-red-400'
    }

    return (
        <div className="space-y-4">
            {/* Trigger Button */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={handleSmartMatch}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-500/20"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            جارٍ تحليل المرشحين بالذكاء الاصطناعي...
                        </>
                    ) : (
                        <>
                            <Brain className="h-4 w-4 me-2" />
                            🧠 تطابق ذكي — {jobTitle}
                        </>
                    )}
                </Button>
                {results && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="text-cream-dark/50"
                    >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                )}
                {results && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setResults(null); setError(null) }}
                        className="text-cream-dark/30 hover:text-red-400"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                    ❌ {error}
                </div>
            )}

            {/* Results Panel */}
            {results && expanded && (
                <Card className="bg-navy-light border-purple-500/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="font-semibold text-cream text-sm">
                                نتائج التطابق الذكي — {results.length} مرشح
                            </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-purple-400/30 text-purple-400">
                            {source === 'ai' ? '🧠 Gemini AI' : '📊 Local Fallback'}
                        </Badge>
                    </div>
                    <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                        {results.map((r, i) => (
                            <div
                                key={r.candidate_id}
                                className="flex items-start gap-4 p-4 rounded-lg bg-navy/50 border border-gold/5 hover:border-gold/15 transition-colors"
                            >
                                {/* Rank */}
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    <span className="text-xs text-cream-dark/30 font-mono">#{i + 1}</span>
                                    <div className={`h-14 w-14 rounded-full flex items-center justify-center border-2 ${getScoreColor(r.score)}`}>
                                        <span className="text-base font-bold">{r.score}%</span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold text-cream">{r.name}</h4>
                                        <Badge className={`text-[10px] ${getRecommendationColor(r.recommendation)}`}>
                                            {r.recommendation}
                                        </Badge>
                                    </div>

                                    {/* AI Reasoning */}
                                    <p className="text-xs text-cream-dark/50 leading-relaxed" dir="auto">
                                        {r.reasoning}
                                    </p>

                                    {/* Strengths & Gaps */}
                                    <div className="flex flex-wrap gap-3">
                                        {r.strengths?.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                                                {r.strengths.map(s => (
                                                    <Badge key={s} variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 py-0">
                                                        {s}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {r.gaps?.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <TrendingDown className="h-3 w-3 text-red-400 shrink-0" />
                                                {r.gaps.map(g => (
                                                    <Badge key={g} variant="outline" className="text-[9px] border-red-500/20 text-red-400 py-0">
                                                        {g}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {results.length === 0 && (
                            <p className="text-center text-cream-dark/30 py-6 text-sm">
                                لا توجد نتائج تحليل
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
