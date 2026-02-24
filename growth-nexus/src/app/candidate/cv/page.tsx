'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Upload,
    FileText,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Download,
    Trash2,
    Brain
} from 'lucide-react'
import { toast } from 'sonner'

type ParsedData = {
    skills?: string[]
    experience_years?: number
    education?: string[]
    summary?: string
}

export default function CVPage() {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [parsing, setParsing] = useState(false)
    const [cvUrl, setCvUrl] = useState<string | null>(null)
    const [parsedData, setParsedData] = useState<ParsedData | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadCandidateData()
    }, [])

    const loadCandidateData = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data: candidate } = await supabase
                .from('candidates')
                .select('cv_url, resume_parsed_data, skills')
                .eq('id', user.id)
                .single()

            if (candidate) {
                setCvUrl(candidate.cv_url)
                setParsedData(candidate.resume_parsed_data as ParsedData)
            }
        }
        setLoading(false)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file
        if (file.type !== 'application/pdf') {
            toast.error('Please upload a PDF file')
            return
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('File size must be less than 10MB')
            return
        }

        setUploading(true)
        setUploadProgress(0)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('Please login to continue')
            setUploading(false)
            return
        }

        // Simulate progress
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 200)

        // Upload to Supabase Storage
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('resumes')
            .upload(fileName, file, { upsert: true })

        clearInterval(progressInterval)

        if (uploadError) {
            toast.error('Upload failed: ' + uploadError.message)
            setUploading(false)
            return
        }

        // Get public URL
        const { data: urlData } = supabase
            .storage
            .from('resumes')
            .getPublicUrl(fileName)

        const publicUrl = urlData.publicUrl

        // Update candidate record
        const { error: updateError } = await supabase
            .from('candidates')
            .upsert({
                id: user.id,
                cv_url: publicUrl,
                updated_at: new Date().toISOString()
            })

        if (updateError) {
            // Try insert if upsert failed (new candidate)
            await supabase.from('candidates').insert({
                id: user.id,
                cv_url: publicUrl
            })
        }

        setUploadProgress(100)
        setCvUrl(publicUrl)
        toast.success('CV uploaded successfully!')
        setUploading(false)

        // Trigger AI parsing
        triggerAIParsing(publicUrl, user.id)
    }

    const triggerAIParsing = async (fileUrl: string, userId: string) => {
        setParsing(true)

        try {
            // Get n8n webhook URL from env
            const webhookUrl = process.env.NEXT_PUBLIC_N8N_CV_PARSER_WEBHOOK

            if (!webhookUrl) {
                // Simulate parsing if webhook not configured
                toast.info('AI parsing will be available once n8n webhook is configured')

                // Simulate parsed data for demo
                setTimeout(() => {
                    const mockParsed: ParsedData = {
                        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL'],
                        experience_years: 3,
                        education: ['Bachelor in Computer Science'],
                        summary: 'Experienced software developer with focus on web technologies.'
                    }
                    setParsedData(mockParsed)
                    setParsing(false)
                    toast.success('CV analyzed! (Demo mode)')
                }, 2000)
                return
            }

            // Call n8n webhook
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file_url: fileUrl,
                    user_id: userId
                })
            })

            if (response.ok) {
                toast.success('CV sent for AI analysis!')
                // Reload data after a delay to get parsed results
                setTimeout(loadCandidateData, 5000)
            } else {
                toast.error('Failed to trigger AI parsing')
            }
        } catch (error) {
            console.error('AI parsing error:', error)
            toast.error('AI parsing temporarily unavailable')
        }

        setParsing(false)
    }

    const deleteCV = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            await supabase
                .from('candidates')
                .update({ cv_url: null, resume_parsed_data: null })
                .eq('id', user.id)

            setCvUrl(null)
            setParsedData(null)
            toast.success('CV deleted')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">My CV</h1>
                <p className="text-slate-400 mt-1">
                    Upload your resume for AI-powered skill extraction
                </p>
            </div>

            {/* Upload Section */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-cyan-500" />
                        Resume Upload
                    </CardTitle>
                    <CardDescription>
                        Upload a PDF file (max 10MB). Our AI will automatically extract your skills.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!cvUrl ? (
                        <div
                            className="border-2 border-dashed border-slate-700 rounded-lg p-12 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            {uploading ? (
                                <div className="space-y-4">
                                    <Loader2 className="h-12 w-12 mx-auto text-cyan-500 animate-spin" />
                                    <p className="text-slate-300">Uploading...</p>
                                    <Progress value={uploadProgress} className="max-w-xs mx-auto" />
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                                    <p className="text-slate-300 mb-2">
                                        Drop your CV here or click to browse
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        PDF format, max 10MB
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Resume uploaded</p>
                                    <p className="text-sm text-slate-400">Click below to download or replace</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700"
                                    onClick={() => window.open(cvUrl, '_blank')}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    View
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700 text-red-400 hover:bg-red-500/20"
                                    onClick={deleteCV}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-cyan-500 hover:bg-cyan-600"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Replace
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* AI Parsing Status */}
            {parsing && (
                <Card className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/30 rounded-full animate-pulse">
                                <Brain className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">AI is analyzing your CV...</p>
                                <p className="text-sm text-slate-300">
                                    Extracting skills, experience, and education
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Parsed Skills */}
            {parsedData && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            AI-Extracted Profile
                        </CardTitle>
                        <CardDescription>
                            These details were automatically extracted from your CV
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Skills */}
                        {parsedData.skills && parsedData.skills.length > 0 && (
                            <div>
                                <Label className="text-slate-300">Skills</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {parsedData.skills.map((skill, i) => (
                                        <Badge
                                            key={i}
                                            className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Experience */}
                        {parsedData.experience_years && (
                            <div>
                                <Label className="text-slate-300">Experience</Label>
                                <p className="text-white mt-1">
                                    {parsedData.experience_years} years
                                </p>
                            </div>
                        )}

                        {/* Education */}
                        {parsedData.education && parsedData.education.length > 0 && (
                            <div>
                                <Label className="text-slate-300">Education</Label>
                                <ul className="mt-1 space-y-1">
                                    {parsedData.education.map((edu, i) => (
                                        <li key={i} className="text-white">{edu}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Summary */}
                        {parsedData.summary && (
                            <div>
                                <Label className="text-slate-300">Summary</Label>
                                <p className="text-slate-300 mt-1">{parsedData.summary}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Tips */}
            <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-6">
                    <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Tips for a better CV
                    </h3>
                    <ul className="text-sm text-slate-400 space-y-2">
                        <li>• Use a clear, professional format</li>
                        <li>• List your skills prominently for better AI extraction</li>
                        <li>• Include specific achievements with numbers</li>
                        <li>• Keep it concise (1-2 pages max)</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
