import { Label } from '@/components/ui/label'
import { INDUSTRY_SECTORS, SUB_INDUSTRIES } from '@/lib/types'

export function IndustryStep({ data, updateData }: any) {
    const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sector = e.target.value
        updateData({ 
            industry: sector,
            sub_industry: '' // reset sub-industry when sector changes
        })
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-cream mb-4">قطاع العمل</h2>

            <div className="space-y-2">
                <Label className="text-cream-dark/70">القطاع الرئيسي</Label>
                <select
                    value={data.industry}
                    onChange={handleSectorChange}
                    required
                    className="w-full p-3 rounded-md bg-navy border border-gold/15 text-cream focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                >
                    <option value="" disabled>اختر القطاع</option>
                    {INDUSTRY_SECTORS.map((sector) => (
                        <option key={sector.value} value={sector.value}>
                            {sector.label}
                        </option>
                    ))}
                </select>
            </div>

            {data.industry && SUB_INDUSTRIES[data.industry] && (
                <div className="space-y-2 animate-in fade-in zoom-in-95">
                    <Label className="text-cream-dark/70">القطاع الفرعي (التخصص الدقيق)</Label>
                    <select
                        value={data.sub_industry}
                        onChange={(e) => updateData({ sub_industry: e.target.value })}
                        required
                        className="w-full p-3 rounded-md bg-navy border border-gold/15 text-cream focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                    >
                        <option value="" disabled>اختر القطاع الفرعي</option>
                        {SUB_INDUSTRIES[data.industry].map((sub) => (
                            <option key={sub.value} value={sub.value}>
                                {sub.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    )
}
