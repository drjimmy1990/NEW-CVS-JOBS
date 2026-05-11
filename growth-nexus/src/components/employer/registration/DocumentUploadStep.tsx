import { Label } from '@/components/ui/label'
import { DOCUMENT_REQUIREMENTS } from '@/lib/types'
import { UploadCloud, File, X } from 'lucide-react'

export function DocumentUploadStep({ data, updateData }: any) {
    const requiredDocs = DOCUMENT_REQUIREMENTS[data.entity_type] || []
    const documents = data.documents || []

    const handleFileUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const newDoc = {
            document_type: docType,
            file_name: file.name,
            file_size: file.size,
            file_object: file, // Store actual file for later upload
            file_url: URL.createObjectURL(file) // temporary URL
        }

        const filtered = documents.filter((d: any) => d.document_type !== docType)
        updateData({ documents: [...filtered, newDoc] })
    }

    const removeDoc = (docType: string) => {
        const filtered = documents.filter((d: any) => d.document_type !== docType)
        updateData({ documents: filtered })
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <h2 className="text-xl font-bold text-cream mb-2 sticky top-0 bg-navy-dark pt-2 z-10">المستندات المطلوبة</h2>
            <p className="text-cream-dark/70 text-sm mb-6">
                بناءً على نوع الجهة ({data.entity_type})، يرجى إرفاق المستندات التالية للتحقق من هوية الشركة.
            </p>

            <div className="space-y-4">
                {requiredDocs.map((doc: any) => {
                    const uploadedDoc = documents.find((d: any) => d.document_type === doc.type)
                    
                    return (
                        <div key={doc.type} className="p-4 rounded-lg border border-gold/15 bg-navy-lighter/50">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <Label className="text-cream text-base block mb-1">
                                        {doc.label}
                                        {doc.required && <span className="text-red-400 ms-1">*</span>}
                                    </Label>
                                    <span className="text-xs text-cream-dark/50">PDF, JPG, PNG (Max 5MB)</span>
                                </div>
                            </div>

                            {uploadedDoc ? (
                                <div className="flex items-center justify-between p-3 bg-navy rounded border border-success/30">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="p-2 bg-success/10 rounded text-success">
                                            <File className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-cream truncate max-w-[200px] sm:max-w-[300px]">
                                            {uploadedDoc.file_name}
                                        </span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => removeDoc(doc.type)}
                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleFileUpload(doc.type, e)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        required={doc.required}
                                    />
                                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gold/20 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition-all">
                                        <UploadCloud className="w-8 h-8 text-gold/60 mb-2" />
                                        <span className="text-sm text-cream-dark/70">اضغط أو اسحب الملف هنا</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
