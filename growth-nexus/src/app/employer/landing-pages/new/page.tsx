'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewLandingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    })

    const generateToken = () => {
        // Simple random 8 char hex string for secure URL
        return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('Please login to continue')
            setLoading(false)
            return
        }

        // Get company ID
        const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (!company) {
            toast.error('You need a company profile first')
            router.push('/employer/settings')
            return
        }

        const token = generateToken()

        const { error } = await supabase
            .from('landing_pages')
            .insert({
                company_id: company.id,
                title: formData.title,
                job_description: formData.description,
                token: token,
                is_active: true
            })

        if (error) {
            toast.error('Failed to create landing page: ' + error.message)
            setLoading(false)
            return
        }

        toast.success('Private link generated successfully!')
        router.push('/employer/landing-pages')
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/employer/landing-pages">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Create Private Link</h1>
                    <p className="text-slate-400 mt-1">Generate a secure URL to collect candidates directly</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-cyan-500" />
                            Campaign Details
                        </CardTitle>
                        <CardDescription>
                            This information will be shown to candidates when they visit your private link.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-white">Campaign Title (Internal / Public Heading)</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Senior Backend Dev - LinkedIn Sourcing"
                                className="bg-slate-800 border-slate-700 text-white"
                                required
                            />
                            <p className="text-xs text-slate-500">
                                This will act as the Page Title when candidates open the link.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">Role Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add specific requirements or a welcome message for candidates coming through this link..."
                                className="bg-slate-800 border-slate-700 text-white min-h-[150px]"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex gap-4">
                            <Button
                                type="submit"
                                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                                disabled={loading || !formData.title}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating Link...
                                    </>
                                ) : (
                                    'Generate Private Link'
                                )}
                            </Button>
                            <Link href="/employer/landing-pages">
                                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
