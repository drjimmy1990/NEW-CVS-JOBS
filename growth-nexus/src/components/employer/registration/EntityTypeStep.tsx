import { Label } from '@/components/ui/label'
import { ENTITY_TYPES } from '@/lib/types'
import { cn } from '@/lib/utils'

export function EntityTypeStep({ data, updateData }: any) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-cream mb-4">نوع الجهة</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ENTITY_TYPES.map((type) => {
                    const isSelected = data.entity_type === type.value
                    return (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => updateData({ entity_type: type.value })}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 text-center gap-3",
                                isSelected
                                    ? "bg-gold/10 border-gold text-gold scale-[1.02]"
                                    : "bg-navy-lighter border-navy-lighter text-cream-dark hover:border-gold/30 hover:bg-navy-lighter/80"
                            )}
                        >
                            <span className="text-4xl">{type.icon}</span>
                            <span className="font-semibold text-lg">{type.label}</span>
                        </button>
                    )
                })}
            </div>
            
            {data.entity_type === 'recruitment_agency' && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400 text-sm">
                    <strong>ملاحظة هامة:</strong> شركات التوظيف تخضع لتدقيق أمني إضافي ويتطلب التسجيل إرفاق إثبات نشاط توظيف ساري المفعول.
                </div>
            )}
        </div>
    )
}
