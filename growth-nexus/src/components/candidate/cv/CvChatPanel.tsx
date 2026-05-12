'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CvChatMessage } from '@/types/cv'

interface CvChatPanelProps {
  messages: CvChatMessage[]
  onSendMessage: (message: string) => void
  isProcessing: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export default function CvChatPanel({
  messages,
  onSendMessage,
  isProcessing,
  disabled = false,
  placeholder = 'اكتب تعليماتك لتحسين السيرة الذاتية...',
  className = '',
}: CvChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isProcessing])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isProcessing || disabled) return
    onSendMessage(trimmed)
    setInput('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const senderConfig = {
    user: {
      icon: User,
      bgClass: 'bg-gold/10 border-gold/20',
      iconBg: 'bg-gold/20',
      iconColor: 'text-gold',
      textColor: 'text-cream',
      align: 'items-end',
    },
    ai: {
      icon: Bot,
      bgClass: 'bg-navy-lighter border-gold/10',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      textColor: 'text-cream-dark/80',
      align: 'items-start',
    },
    system: {
      icon: Info,
      bgClass: 'bg-blue-500/5 border-blue-500/20',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      textColor: 'text-cream-dark/60',
      align: 'items-center',
    },
  }

  return (
    <div className={`flex flex-col bg-navy-light rounded-xl border border-gold/10 overflow-hidden ${className}`}>
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gold/10 bg-navy-lighter/50">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-400" />
          <span className="text-sm font-medium text-cream">مساعد تحسين السيرة الذاتية</span>
          {isProcessing && (
            <span className="text-xs text-gold animate-pulse">يفكر...</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[600px]">
        {messages.length === 0 && !isProcessing && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-4 rounded-2xl bg-purple-500/10 mb-4">
              <Bot className="h-10 w-10 text-purple-400" />
            </div>
            <h3 className="text-cream font-medium mb-2">مرحباً! أنا مساعد تحسين السيرة الذاتية</h3>
            <p className="text-sm text-cream-dark/40 max-w-sm">
              ارفع سيرتك الذاتية وأخبرني بما تريد تحسينه. يمكنني تحسين الصياغة، إضافة كلمات ATS، وتحديث التصميم.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['حسّن الملخص المهني', 'أضف كلمات ATS', 'حسّن قسم الخبرة'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion)
                    inputRef.current?.focus()
                  }}
                  className="px-3 py-1.5 text-xs rounded-full border border-gold/20 text-gold/80 hover:bg-gold/10 hover:text-gold transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const config = senderConfig[msg.sender]
          const Icon = config.icon
          return (
            <div key={msg.id} className={`flex flex-col ${config.align}`}>
              <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 p-1.5 rounded-lg ${config.iconBg}`}>
                  <Icon className={`h-4 w-4 ${config.iconColor}`} />
                </div>
                <div className={`px-4 py-3 rounded-xl border ${config.bgClass}`}>
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${config.textColor}`}>
                    {msg.content}
                  </p>
                  <span className="text-[10px] text-cream-dark/25 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing Indicator */}
        {isProcessing && (
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 p-1.5 rounded-lg bg-purple-500/20">
              <Bot className="h-4 w-4 text-purple-400" />
            </div>
            <div className="px-4 py-3 rounded-xl border bg-navy-lighter border-gold/10">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-gold/10 p-3 bg-navy-lighter/30">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isProcessing}
            rows={1}
            className="flex-1 resize-none bg-navy-lighter border border-gold/10 rounded-xl px-4 py-3 text-sm text-cream placeholder:text-cream-dark/30 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 disabled:opacity-50 transition-colors"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing || disabled}
            className="bg-gold hover:bg-gold-dark text-navy h-[44px] w-[44px] p-0 rounded-xl shrink-0 disabled:opacity-30"
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 rotate-180" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
