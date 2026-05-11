import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, User, Briefcase } from 'lucide-react'

export function AccountDataStep({ data, updateData }: any) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-cream mb-4">بيانات الحساب</h2>

            <div className="space-y-2">
                <Label className="text-cream-dark/70">البريد الإلكتروني للعمل (Official Email)</Label>
                <div className="relative">
                    <Mail className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                    <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => updateData({ email: e.target.value })}
                        required
                        className="pe-10 bg-navy border-gold/15 text-cream"
                        placeholder="hr@company.ae"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-cream-dark/70">كلمة المرور</Label>
                <div className="relative">
                    <Lock className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                    <Input
                        type="password"
                        value={data.password}
                        onChange={(e) => updateData({ password: e.target.value })}
                        required
                        minLength={8}
                        className="pe-10 bg-navy border-gold/15 text-cream"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-cream-dark/70">اسم مسؤول الحساب</Label>
                    <div className="relative">
                        <User className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                        <Input
                            type="text"
                            value={data.contact_person_name}
                            onChange={(e) => updateData({ contact_person_name: e.target.value })}
                            required
                            className="pe-10 bg-navy border-gold/15 text-cream"
                            placeholder="الاسم الكامل"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-cream-dark/70">المسمى الوظيفي</Label>
                    <div className="relative">
                        <Briefcase className="absolute end-3 top-3 h-4 w-4 text-cream-dark/40" />
                        <Input
                            type="text"
                            value={data.contact_person_title}
                            onChange={(e) => updateData({ contact_person_title: e.target.value })}
                            required
                            className="pe-10 bg-navy border-gold/15 text-cream"
                            placeholder="مدير الموارد البشرية"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
