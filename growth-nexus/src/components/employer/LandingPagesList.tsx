'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Link as LinkIcon, Copy, Users, Clock, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function LandingPagesList({ pages: initialPages }: { pages: any[] }) {
    const supabase = createClient()
    const [pages, setPages] = useState(initialPages)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const toggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('landing_pages')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (error) {
            toast.error('Failed to update status')
            return
        }

        setPages(pages.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
        toast.success(`Link ${!currentStatus ? 'activated' : 'deactivated'}`)
    }

    const handleDelete = async () => {
        if (!deletingId) return

        const { error } = await supabase
            .from('landing_pages')
            .delete()
            .eq('id', deletingId)

        if (error) {
            toast.error('Failed to delete landing page')
        } else {
            toast.success('Landing page deleted')
            setPages(pages.filter(p => p.id !== deletingId))
        }
        setDeletingId(null)
    }

    const copyLink = (token: string) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        navigator.clipboard.writeText(`${baseUrl}/apply/${token}`)
        toast.success('Link copied to clipboard!')
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pages.map((page) => (
                <Card key={page.id} className={`bg-slate-900 border-slate-800 transition-all ${!page.is_active && 'opacity-70'}`}>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-semibold text-white">{page.title}</h3>
                                    <Badge variant="outline" className={page.is_active ? 'border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-500'}>
                                        {page.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-400 font-mono">/apply/{page.token}</p>
                            </div>
                            <Switch
                                checked={page.is_active}
                                onCheckedChange={() => toggleActive(page.id, page.is_active)}
                                aria-label="Toggle active status"
                            />
                        </div>

                        <p className="text-slate-300 text-sm mb-6 line-clamp-2">
                            {page.job_description || 'No description provided.'}
                        </p>

                        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-800">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Eye className="h-4 w-4" />
                                <span className="text-sm">{page.views_count || 0} Views</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">Created {new Date(page.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
                                onClick={() => copyLink(page.token)}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Public Link
                            </Button>

                            <Button
                                variant="destructive"
                                size="icon"
                                className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-0"
                                onClick={() => setDeletingId(page.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
                <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            This action cannot be undone. This will permanently delete this private link. Any candidates who try to apply using this URL will see a "Not Found" error.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
