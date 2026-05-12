'use client'

import Link from 'next/link'
import { ArrowRight, Globe, Sparkles, PenTool, FileCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { CvSessionType, CvLanguage, CvSessionStatus } from '@/types/cv'

interface CvSessionHeaderProps {
  title: string
  subtitle?: string
  sessionType?: CvSessionType
  language?: CvLanguage
  status?: CvSessionStatus
}

const typeIcons = {
  optimize: Sparkles,
  create: PenTool,
  ats_convert: FileCheck,
}

const typeLabels = {
  optimize: 'تحسين السيرة',
  create: 'إنشاء سيرة',
  ats_convert: 'تحويل ATS',
}

const langLabels = {
  en: 'English',
  ar: 'العربية',
  bilingual: 'ثنائي اللغة',
}

const statusMap: Record<CvSessionStatus, { label: string; className: string }> = {
  active: { label: 'نشط', className: 'bg-blue-500/20 text-blue-400' },
  processing: { label: 'قيد المعالجة', className: 'bg-yellow-500/20 text-yellow-400' },
  ready: { label: 'جاهز', className: 'bg-success/20 text-success' },
  downloaded: { label: 'تم التحميل', className: 'bg-cream-dark/20 text-cream-dark/60' },
  archived: { label: 'مؤرشف', className: 'bg-cream-dark/20 text-cream-dark/40' },
}

export default function CvSessionHeader({
  title,
  subtitle,
  sessionType,
  language,
  status,
}: CvSessionHeaderProps) {
  const TypeIcon = sessionType ? typeIcons[sessionType] : Sparkles

  return (
    <div className="mb-6">
      {/* Back Link */}
      <Link
        href="/candidate/cv"
        className="inline-flex items-center gap-1.5 text-sm text-cream-dark/50 hover:text-gold transition-colors mb-4"
      >
        <ArrowRight className="h-4 w-4" />
        العودة إلى خدمات السيرة الذاتية
      </Link>

      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-cream flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <TypeIcon className="h-6 w-6 text-gold" />
            </div>
            {title}
          </h1>
          {subtitle && (
            <p className="text-cream-dark/50 mt-1 ms-12">{subtitle}</p>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 ms-12 sm:ms-0">
          {sessionType && (
            <Badge className="bg-gold/10 text-gold border-gold/20">
              {typeLabels[sessionType]}
            </Badge>
          )}
          {language && (
            <Badge className="bg-navy-lighter text-cream-dark/60 border-gold/10">
              <Globe className="h-3 w-3 me-1" />
              {langLabels[language]}
            </Badge>
          )}
          {status && (
            <Badge className={statusMap[status].className}>
              {statusMap[status].label}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
