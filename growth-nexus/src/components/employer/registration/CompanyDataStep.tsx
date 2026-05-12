import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, MapPin, Phone, Globe, Linkedin, FileText, Calendar } from 'lucide-react'
import { UAE_CITIES } from '@/lib/types'

export function CompanyDataStep({ data, updateData }: any) {
    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <h2 className="text-xl font-bold text-cream mb-4 sticky top-0 bg-navy-dark pt-2 pb-4 z-10">بيانات الشركة</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-cream-dark/70">الاسم الرسمي (كما في الرخصة)</Label>
                    <div className="relative">
                        <Building className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                        <Input
                            type="text"
                            value={data.official_name}
                            onChange={(e) => updateData({ official_name: e.target.value })}
                            required
                            className="pe-10 bg-navy border-gold/15 text-cream"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-cream-dark/70">الاسم التجاري (الاسم المعروف)</Label>
                    <div className="relative">
                        <Building className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                        <Input
                            type="text"
                            value={data.trade_name}
                            onChange={(e) => updateData({ trade_name: e.target.value })}
                            required
                            className="pe-10 bg-navy border-gold/15 text-cream"
                        />
                    </div>
                </div>

                {data.entity_type !== 'government' && (
                    <>
                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">رقم الرخصة التجارية</Label>
                            <div className="relative">
                                <FileText className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                                <Input
                                    type="text"
                                    value={data.trade_license_number}
                                    onChange={(e) => updateData({ trade_license_number: e.target.value })}
                                    required={data.entity_type !== 'semi_government'} // semi gov can sometimes just give official letter
                                    className="pe-10 bg-navy border-gold/15 text-cream"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-cream-dark/70">تاريخ انتهاء الرخصة</Label>
                            <div className="relative">
                                <Calendar className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                                <Input
                                    type="date"
                                    value={data.trade_license_expiry}
                                    onChange={(e) => updateData({ trade_license_expiry: e.target.value })}
                                    required={data.entity_type !== 'semi_government'}
                                    className="pe-10 bg-navy border-gold/15 text-cream text-right"
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <Label className="text-cream-dark/70">الإمارة / المدينة</Label>
                    <div className="relative">
                        <MapPin className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                        <select
                            value={data.emirate}
                            onChange={(e) => updateData({ emirate: e.target.value, city: e.target.value })}
                            required
                            className="w-full p-2.5 rounded-md bg-navy border border-gold/15 text-cream focus:border-gold outline-none appearance-none pe-10"
                        >
                            <option value="" disabled>اختر الإمارة</option>
                            {UAE_CITIES.map((city) => (
                                <option key={city.value} value={city.value}>{city.labelAr}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-cream-dark/70">رقم هاتف الشركة</Label>
                    <div className="relative">
                        <Phone className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                        <Input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => updateData({ phone: e.target.value })}
                            required
                            dir="ltr"
                            className="pe-10 bg-navy border-gold/15 text-cream text-left"
                            placeholder="+971 4 XXXXXXX"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-cream-dark/70">الموقع الإلكتروني</Label>
                    <div className="relative">
                        <Globe className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                        <Input
                            type="url"
                            value={data.website}
                            onChange={(e) => updateData({ website: e.target.value })}
                            dir="ltr"
                            className="pe-10 bg-navy border-gold/15 text-cream text-left"
                            placeholder="https://www.example.ae"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-cream-dark/70">رابط LinkedIn للشركة</Label>
                    <div className="relative">
                        <Linkedin className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                        <Input
                            type="url"
                            value={data.linkedin_url}
                            onChange={(e) => updateData({ linkedin_url: e.target.value })}
                            dir="ltr"
                            className="pe-10 bg-navy border-gold/15 text-cream text-left"
                            placeholder="https://linkedin.com/company/..."
                        />
                    </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label className="text-cream-dark/70">عدد الموظفين</Label>
                    <select
                        value={data.employee_count_range}
                        onChange={(e) => updateData({ employee_count_range: e.target.value })}
                        required
                        className="w-full p-2.5 rounded-md bg-navy border border-gold/15 text-cream focus:border-gold outline-none"
                    >
                        <option value="" disabled>اختر حجم الشركة</option>
                        <option value="1-10">1 - 10 موظفين</option>
                        <option value="11-50">11 - 50 موظف</option>
                        <option value="51-200">51 - 200 موظف</option>
                        <option value="201-500">201 - 500 موظف</option>
                        <option value="501-1000">501 - 1000 موظف</option>
                        <option value="1000+">أكثر من 1000 موظف</option>
                    </select>
                </div>
            </div>
        </div>
    )
}
