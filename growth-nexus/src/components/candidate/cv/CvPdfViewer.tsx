'use client'

import { Download, FileText, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CvPdfViewerProps {
  pdfUrl: string | null
  status?: 'draft' | 'ready' | 'processing'
  onDownload?: () => void
  className?: string
}

const statusMap = {
  draft: { label: 'مسودة', className: 'bg-yellow-500/20 text-yellow-400' },
  ready: { label: 'جاهز', className: 'bg-success/20 text-success' },
  processing: { label: 'قيد المعالجة', className: 'bg-blue-500/20 text-blue-400' },
}

export default function CvPdfViewer({
  pdfUrl,
  status = 'draft',
  onDownload,
  className = '',
}: CvPdfViewerProps) {
  const statusInfo = statusMap[status]

  if (!pdfUrl) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-navy-light/50 rounded-xl border border-gold/10 ${className}`}>
        <FileText className="h-16 w-16 text-cream-dark/15 mb-4" />
        <p className="text-cream-dark/40 text-center">
          لم يتم تحميل أي سيرة ذاتية بعد
        </p>
        <p className="text-sm text-cream-dark/25 mt-1">
          ارفع سيرتك الذاتية للبدء
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col bg-navy-light rounded-xl border border-gold/10 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-navy-lighter/50">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gold" />
          <span className="text-sm text-cream font-medium">معاينة السيرة الذاتية</span>
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-cream-dark/60 hover:text-cream hover:bg-navy-lighter"
            onClick={() => window.open(pdfUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-cream-dark/60 hover:text-cream hover:bg-navy-lighter"
            onClick={onDownload || (() => window.open(pdfUrl, '_blank'))}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Embed */}
      <div className="flex-1 relative min-h-[500px]">
        {status === 'processing' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy/80 z-10">
            <Loader2 className="h-10 w-10 text-gold animate-spin mb-3" />
            <p className="text-cream-dark/60 text-sm">جاري تحديث المعاينة...</p>
          </div>
        ) : null}
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full min-h-[500px] bg-white"
          title="CV Preview"
        />
      </div>
    </div>
  )
}
