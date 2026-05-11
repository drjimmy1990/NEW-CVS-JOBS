'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ExportReports() {
    const [exporting, setExporting] = useState<string | null>(null)

    const handleExport = async (type: string, format: string) => {
        const key = `${type}-${format}`
        setExporting(key)
        try {
            const res = await fetch('/api/emiratisation/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, format }),
            })
            const data = await res.json()
            console.log('[ExportReports] API response:', { ok: res.ok, status: res.status, hasReport: !!data.report, data })
            if (!res.ok) throw new Error(data.error || 'فشل تحميل البيانات')

            // Generate client-side download
            if (format === 'excel') {
                const XLSX = await import('xlsx')
                const ws = XLSX.utils.json_to_sheet(flattenReport(data.report))
                const wb = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(wb, ws, 'Report')
                XLSX.writeFile(wb, `${type}-report.xlsx`)
            } else {
                // PDF: render Arabic HTML through browser engine
                const { default: jsPDF } = await import('jspdf')
                const html2canvas = (await import('html2canvas')).default

                // Build a styled HTML string for the report
                const htmlContent = buildReportHtml(data.report, type)

                // Create container — must be visible for html2canvas to capture
                const container = document.createElement('div')
                container.style.position = 'fixed'
                container.style.top = '0'
                container.style.left = '0'
                container.style.width = '794px' // A4 width at 96dpi
                container.style.padding = '40px'
                container.style.background = '#ffffff'
                container.style.zIndex = '99999'
                container.innerHTML = htmlContent
                document.body.appendChild(container)

                // Wait for fonts to load
                await document.fonts.ready
                // Small delay to ensure rendering
                await new Promise(resolve => setTimeout(resolve, 100))

                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                })

                document.body.removeChild(container)

                const imgData = canvas.toDataURL('image/png')
                const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                const pageWidth = doc.internal.pageSize.getWidth()
                const pageHeight = doc.internal.pageSize.getHeight()
                const imgWidth = pageWidth - 20 // 10mm margins
                const imgHeight = (canvas.height * imgWidth) / canvas.width

                // Handle multi-page if content is tall
                let heightLeft = imgHeight
                let position = 10

                doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
                heightLeft -= (pageHeight - 20)

                while (heightLeft > 0) {
                    position = -(pageHeight - 20) + 10
                    doc.addPage()
                    doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
                    heightLeft -= (pageHeight - 20)
                }

                doc.save(`${type}-report.pdf`)
            }

            toast.success('تم تصدير التقرير بنجاح')
        } catch (err: any) {
            toast.error(err.message || 'فشل التصدير')
        }
        setExporting(null)
    }

    const reports = [
        { type: 'compliance', label: 'تقرير الالتزام', icon: FileText, desc: 'حالة الالتزام والنسب والتنبيهات' },
        { type: 'gap', label: 'تقرير الفجوة', icon: FileText, desc: 'تحليل الفجوة وخطة العمل' },
        { type: 'candidates', label: 'تقرير المرشحين', icon: FileSpreadsheet, desc: 'قائمة المرشحين المواطنين المقترحين' },
        { type: 'jobs', label: 'تقرير الوظائف', icon: FileSpreadsheet, desc: 'الوظائف المناسبة للتوطين' },
    ]

    return (
        <Card className="bg-navy-light border-gold/10">
            <CardHeader>
                <CardTitle className="text-cream text-lg flex items-center gap-2">
                    <Download className="h-5 w-5 text-gold" />
                    تصدير التقارير
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map(r => (
                        <div key={r.type} className="p-4 rounded-lg bg-navy/50 border border-gold/5">
                            <div className="flex items-start gap-3 mb-3">
                                <r.icon className="h-5 w-5 text-gold shrink-0" />
                                <div>
                                    <h4 className="text-cream text-sm font-medium">{r.label}</h4>
                                    <p className="text-[10px] text-cream-dark/40 mt-0.5">{r.desc}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleExport(r.type, 'pdf')}
                                    disabled={exporting !== null}
                                    className="flex-1 border-gold/10 text-cream text-xs hover:bg-gold/5">
                                    {exporting === `${r.type}-pdf` ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3 me-1" />}
                                    PDF
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleExport(r.type, 'excel')}
                                    disabled={exporting !== null}
                                    className="flex-1 border-gold/10 text-cream text-xs hover:bg-gold/5">
                                    {exporting === `${r.type}-excel` ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3 w-3 me-1" />}
                                    Excel
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// Flatten nested report object for Excel export
function flattenReport(report: any): any[] {
    if (report.candidates) return report.candidates
    if (report.jobs) return report.jobs
    if (report.gap) return [{ ...report.gap, ...report.profile }]
    return [report.profile || report]
}

// Build styled Arabic HTML for PDF rendering
function buildReportHtml(report: any, type: string): string {
    const date = new Date().toLocaleDateString('ar-AE', { year: 'numeric', month: 'long', day: 'numeric' })
    const styles = `
        font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
        direction: rtl;
        text-align: right;
        color: #1a1a2e;
        font-size: 11px;
        line-height: 1.6;
    `
    const headerHtml = `
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #c9a227; padding-bottom: 16px;">
            <h1 style="font-size: 18px; color: #c9a227; margin: 0 0 6px 0;">${report.title || 'تقرير'}</h1>
            <p style="font-size: 12px; color: #666; margin: 0;">${report.companyName} — ${date}</p>
        </div>
    `

    let bodyHtml = ''

    if (type === 'compliance') {
        const p = report.profile || {}
        const c = report.compliance || {}
        const alerts = report.alerts || []
        bodyHtml = `
            <h2 style="font-size: 14px; color: #1a1a2e; border-bottom: 1px solid #eee; padding-bottom: 4px;">بيانات القوى العاملة</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">إجمالي الموظفين</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${p.total_employees || 0}</td></tr>
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">الموظفين المهاريين</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${p.skilled_employees || 0}</td></tr>
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">المواطنين الحاليين</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${p.current_emiratis || 0}</td></tr>
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">المواطنين في وظائف مهارية</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${p.emiratis_in_skilled || 0}</td></tr>
            </table>
            <h2 style="font-size: 14px; color: #1a1a2e; border-bottom: 1px solid #eee; padding-bottom: 4px;">حالة الالتزام</h2>
            <p><strong>الحالة:</strong> ${c.status === 'compliant' ? '✅ ملتزم' : c.status === 'at_risk' ? '⚠️ في خطر' : '❌ غير ملتزم'}</p>
            <p><strong>النسبة الحالية:</strong> ${c.currentRate ?? '—'}%</p>
            <p><strong>النسبة المطلوبة:</strong> ${c.requiredRate ?? '—'}%</p>
            ${alerts.length > 0 ? `
                <h2 style="font-size: 14px; color: #c0392b; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 16px;">التنبيهات</h2>
                <ul style="padding-right: 16px;">${alerts.map((a: any) => `<li style="margin-bottom: 4px;"><strong>${a.title}</strong>: ${a.description}</li>`).join('')}</ul>
            ` : ''}
        `
    } else if (type === 'gap') {
        const g = report.gap || {}
        const actions = report.actionPlan || []
        bodyHtml = `
            <h2 style="font-size: 14px; color: #1a1a2e; border-bottom: 1px solid #eee; padding-bottom: 4px;">تحليل الفجوة</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">المواطنين المطلوبين</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${g.requiredEmiratis ?? 0}</td></tr>
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">المواطنين الحاليين</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${g.currentEmiratis ?? 0}</td></tr>
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">الفجوة</td><td style="padding: 4px 8px; border: 1px solid #ddd; color: ${(g.gap || 0) > 0 ? '#c0392b' : '#27ae60'};">${g.gap ?? 0}</td></tr>
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">النسبة الحالية</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${g.currentRate ?? 0}%</td></tr>
                <tr><td style="padding: 4px 8px; border: 1px solid #ddd;">النسبة المطلوبة</td><td style="padding: 4px 8px; border: 1px solid #ddd;">${g.requiredRate ?? 0}%</td></tr>
            </table>
            ${actions.length > 0 ? `
                <h2 style="font-size: 14px; color: #1a1a2e; border-bottom: 1px solid #eee; padding-bottom: 4px;">خطة العمل</h2>
                <ol style="padding-right: 16px;">${actions.map((a: any) => `<li style="margin-bottom: 6px;"><strong>${a.title || ''}</strong><br/>${a.description || ''}</li>`).join('')}</ol>
            ` : ''}
        `
    } else if (type === 'candidates') {
        const candidates = report.candidates || []
        bodyHtml = `
            <p style="margin-bottom: 8px;">عدد المرشحين: ${candidates.length}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead><tr style="background: #f5f5f5;">
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">الاسم</th>
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">المسمى</th>
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">المهارات</th>
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">الخبرة</th>
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">الموقع</th>
                </tr></thead>
                <tbody>${candidates.map((c: any) => `
                    <tr>
                        <td style="padding: 4px 6px; border: 1px solid #ddd;">${c.name || '—'}</td>
                        <td style="padding: 4px 6px; border: 1px solid #ddd;">${c.headline || '—'}</td>
                        <td style="padding: 4px 6px; border: 1px solid #ddd; font-size: 9px;">${c.skills || '—'}</td>
                        <td style="padding: 4px 6px; border: 1px solid #ddd;">${c.experience || 0} سنة</td>
                        <td style="padding: 4px 6px; border: 1px solid #ddd;">${c.location || '—'}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `
    } else if (type === 'jobs') {
        const jobs = report.jobs || []
        bodyHtml = `
            <p style="margin-bottom: 8px;">عدد الوظائف: ${jobs.length}</p>
            <table style="width: 100%; border-collapse: collapse;">
                <thead><tr style="background: #f5f5f5;">
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">المسمى الوظيفي</th>
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">الموقع</th>
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">النوع</th>
                    <th style="padding: 6px; border: 1px solid #ddd; text-align: right;">الحالة</th>
                </tr></thead>
                <tbody>${jobs.map((j: any) => `
                    <tr>
                        <td style="padding: 4px 6px; border: 1px solid #ddd;">${j.title || '—'}</td>
                        <td style="padding: 4px 6px; border: 1px solid #ddd;">${j.location || '—'}</td>
                        <td style="padding: 4px 6px; border: 1px solid #ddd;">${j.type || '—'}</td>
                        <td style="padding: 4px 6px; border: 1px solid #ddd;">${j.status || '—'}</td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `
    }

    return `<div style="${styles}">${headerHtml}${bodyHtml}</div>`
}
