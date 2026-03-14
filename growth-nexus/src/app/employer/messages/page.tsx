'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    MessageSquare, Send, Loader2, Search, ArrowLeft
} from 'lucide-react'

type Conversation = {
    id: string
    other_user_id: string
    other_user_name: string
    other_user_avatar: string | null
    last_message: string
    last_message_at: string
    unread_count: number
}

type Message = {
    id: string
    sender_id: string
    content: string
    created_at: string
    is_read: boolean
}

export default function EmployerMessagesPage() {
    const searchParams = useSearchParams()
    const chatId = searchParams.get('chat')

    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const loadConversations = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        setUserId(user.id)

        const { data } = await supabase
            .from('conversations')
            .select('id, participant_1, participant_2, last_message, last_message_at, unread_count_1, unread_count_2')
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
            .order('last_message_at', { ascending: false })

        if (data) {
            const convos: Conversation[] = await Promise.all(
                data.map(async (c: any) => {
                    const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1
                    const isP1 = c.participant_1 === user.id
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('id', otherId)
                        .single()
                    return {
                        id: c.id,
                        other_user_id: otherId,
                        other_user_name: profile?.full_name || 'مرشح',
                        other_user_avatar: profile?.avatar_url,
                        last_message: c.last_message || '',
                        last_message_at: c.last_message_at,
                        unread_count: isP1 ? c.unread_count_1 || 0 : c.unread_count_2 || 0,
                    }
                })
            )
            setConversations(convos)

            // Auto-open conversation from ?chat= param
            if (chatId) {
                const target = convos.find(c => c.id === chatId)
                if (target) {
                    loadMessages(target)
                }
            }
        }
        setLoading(false)
    }

    const loadMessages = async (convo: Conversation) => {
        setActiveConvo(convo)
        
        // Optimistically clear unread count for this conversation in the sidebar list
        setConversations(prev => prev.map(c => 
            c.id === convo.id ? { ...c, unread_count: 0 } : c
        ))

        const supabase = createClient()
        const { data } = await supabase
            .from('messages')
            .select('id, sender_id, content, created_at, is_read')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: true })
        if (data) setMessages(data)

        // Mark messages as read
        if (userId) {
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', convo.id)
                .neq('sender_id', userId)
        }
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeConvo || !userId) return
        setSending(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('messages')
            .insert({ conversation_id: activeConvo.id, sender_id: userId, content: newMessage.trim() })
            .select().single()
        if (data) {
            setMessages(prev => [...prev, data])
            setNewMessage('')
            await supabase.from('conversations').update({
                last_message: newMessage.trim(),
                last_message_at: new Date().toISOString(),
            }).eq('id', activeConvo.id)
        }
        setSending(false)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-cream">الرسائل</h1>
                <p className="text-cream-dark/50 text-sm">تواصل مع المرشحين</p>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {/* Conversations List */}
                <div className={`w-full md:w-80 shrink-0 flex flex-col ${activeConvo ? 'hidden md:flex' : 'flex'}`}>
                    <Card className="bg-navy-light border-gold/10 flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-gold/10">
                            <div className="relative">
                                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream-dark/30" />
                                <Input placeholder="ابحث..." className="ps-9 bg-navy border-gold/10 text-cream text-sm h-9" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageSquare className="h-10 w-10 text-cream-dark/15 mx-auto mb-2" />
                                    <p className="text-sm text-cream-dark/30">لا توجد محادثات بعد</p>
                                    <p className="text-xs text-cream-dark/20 mt-1">افتح محادثة من صفحة المتقدمين</p>
                                </div>
                            ) : (
                                conversations.map((convo) => (
                                    <button
                                        key={convo.id}
                                        onClick={() => loadMessages(convo)}
                                        className={`w-full text-right p-3 border-b border-gold/5 hover:bg-navy-lighter transition-colors ${activeConvo?.id === convo.id ? 'bg-navy-lighter' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold text-sm shrink-0">
                                                {convo.other_user_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-cream text-sm truncate">{convo.other_user_name}</span>
                                                    {convo.unread_count > 0 && (
                                                        <Badge className="bg-gold text-navy text-[10px] h-5 min-w-5 flex items-center justify-center">{convo.unread_count}</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-cream-dark/30 truncate">{convo.last_message}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col min-w-0 ${!activeConvo ? 'hidden md:flex' : 'flex'}`}>
                    {activeConvo ? (
                        <Card className="bg-navy-light border-gold/10 flex-1 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gold/10 flex items-center gap-3">
                                <button onClick={() => setActiveConvo(null)} className="md:hidden text-cream-dark/40 hover:text-cream">
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center text-cream font-bold text-sm">
                                    {activeConvo.other_user_name.charAt(0)}
                                </div>
                                <p className="font-medium text-cream text-sm">{activeConvo.other_user_name}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 && (
                                    <div className="text-center py-12">
                                        <MessageSquare className="h-10 w-10 text-cream-dark/10 mx-auto mb-2" />
                                        <p className="text-cream-dark/30 text-sm">ابدأ المحادثة مع {activeConvo.other_user_name}</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                            msg.sender_id === userId ? 'bg-gold text-navy rounded-ee-md' : 'bg-navy-lighter text-cream rounded-es-md'
                                        }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${msg.sender_id === userId ? 'text-navy/50' : 'text-cream-dark/30'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-3 border-t border-gold/10">
                                <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
                                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالة..." className="bg-navy border-gold/10 text-cream text-sm" disabled={sending} />
                                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()} className="bg-gold hover:bg-gold-dark text-navy h-10 w-10 shrink-0">
                                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </form>
                            </div>
                        </Card>
                    ) : (
                        <Card className="bg-navy-light border-gold/10 flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="h-16 w-16 text-cream-dark/10 mx-auto mb-3" />
                                <p className="text-cream-dark/30">اختر محادثة للبدء</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
