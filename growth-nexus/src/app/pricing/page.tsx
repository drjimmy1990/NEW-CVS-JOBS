'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Check, Briefcase, Star, Crown, Zap,
    Search, FileText, Rocket, Shield, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const employerPlans = [
    {
        id: 'starter',
        name: 'أساسي',
        description: 'للشركات الصغيرة أو التي توظف بشكل محدود',
        icon: Briefcase,
        color: 'border-gold/10',
        buttonStyle: 'border-gold/30 text-gold hover:bg-gold/10',
        buttonVariant: 'outline' as const,
        features: [
            '3 وظائف مفتوحة شهرياً',
            'حتى 300 مرشح / شهر',
            'حتى 2 مستخدمين',
            'مقابلات آلية أساسية',
            'لوحة تحكم أساسية',
            'استقبال وفرز الطلبات',
        ],
    },
    {
        id: 'growth',
        name: 'احترافي',
        description: 'للشركات النامية والتوظيف النشط',
        icon: Star,
        color: 'border-gold/40 ring-2 ring-gold/20',
        buttonStyle: 'bg-gold hover:bg-gold-dark text-navy font-bold',
        buttonVariant: 'default' as const,
        badge: 'الأكثر طلباً',
        features: [
            '10 وظائف مفتوحة شهرياً',
            'حتى 1,500 مرشح / شهر',
            'حتى 5 مستخدمين',
            'مقابلات آلية متقدمة',
            'لجنة تقييم المرشحين',
            'عروض عمل وإدارة العقود',
            'لوحة مؤشرات KPI',
            'تحليلات المصادر',
        ],
    },
    {
        id: 'pro',
        name: 'مؤسسي',
        description: 'للشركات الكبيرة وفرق التوظيف المتقدمة',
        icon: Crown,
        color: 'border-gold/10',
        buttonStyle: 'border-gold/30 text-gold hover:bg-gold/10',
        buttonVariant: 'outline' as const,
        features: [
            '25 وظيفة مفتوحة شهرياً',
            'حتى 5,000 مرشح / شهر',
            'حتى 15 مستخدم',
            'كل مميزات الاحترافي',
            'محرك التنبؤات الذكي',
            'نظام التوطين مع تنبيهات MOHRE',
            'التوقيع الإلكتروني للعقود',
            'تحليلات متقدمة وتقارير',
        ],
    },
]

const candidateServices = [
    {
        name: 'تقديم بأولوية',
        icon: Zap,
        description: 'اجعل طلبك يظهر أولاً أمام مسؤول التوظيف.',
        color: 'from-gold/10 to-gold/5',
    },
    {
        name: 'تعزيز الملف الشخصي',
        icon: Rocket,
        description: 'ملفك يظهر في أعلى نتائج البحث — 3 أضعاف المشاهدات.',
        color: 'from-purple-500/10 to-purple-500/5',
    },
    {
        name: 'مراجعة سيرة ذاتية احترافية',
        icon: FileText,
        description: 'خبراؤنا يراجعون سيرتك ويحسّنونها لأنظمة ATS — تسليم خلال 24 ساعة.',
        color: 'from-success/10 to-success/5',
    },
    {
        name: 'حزمة التجهيز الكامل',
        icon: Search,
        description: 'سيرة ذاتية + خطاب تعريف + ملخص LinkedIn + أجوبة مقابلات.',
        color: 'from-blue-500/10 to-blue-500/5',
    },
]

export default function PricingPage() {
    const [loadingTier, setLoadingTier] = useState<string | null>(null)

    const handleSelectPlan = async (tierId: string) => {
        setLoadingTier(tierId)
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tierId, billing: 'monthly' }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                toast.error(data.error || 'حدث خطأ')
            }
        } catch {
            toast.error('فشل الاتصال بخادم الدفع')
        }
        setLoadingTier(null)
    }

    return (
        <div className="min-h-screen bg-navy" dir="rtl">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-navy-lighter to-navy py-20 px-4">
                <div className="container mx-auto text-center max-w-3xl">
                    <Badge className="bg-gold/10 text-gold border-gold/30 text-sm px-4 py-1 mb-6">
                        خطط مرنة
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold text-cream mb-6">
                        ابنِ فريقك المثالي
                    </h1>
                    <p className="text-lg text-cream-dark/50 max-w-xl mx-auto">
                        اختر الخطة المناسبة لحجم شركتك واحتياجات التوظيف. ابدأ مجاناً وقم بالترقية عندما تحتاج.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 space-y-20">
                {/* Employer Plans */}
                <div>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-cream mb-3">خطط أصحاب العمل</h2>
                        <p className="text-cream-dark/50">منظومة توظيف ذكية متكاملة مدعومة بالذكاء الاصطناعي</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {employerPlans.map((plan) => (
                            <Card key={plan.id} className={`bg-navy-light ${plan.color} relative overflow-hidden`}>
                                {plan.badge && (
                                    <div className="absolute top-0 start-0 bg-gold text-navy text-xs font-bold px-3 py-1 rounded-be-lg">
                                        {plan.badge}
                                    </div>
                                )}
                                <CardHeader className="pb-4 pt-8">
                                    <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                                        <plan.icon className="h-6 w-6 text-gold" />
                                    </div>
                                    <CardTitle className="text-cream text-xl">{plan.name}</CardTitle>
                                    <p className="text-sm text-cream-dark/40 mt-1">{plan.description}</p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3 text-sm text-cream-dark/60">
                                                <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        variant={plan.buttonVariant}
                                        className={`w-full ${plan.buttonStyle}`}
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={loadingTier !== null}
                                    >
                                        {loadingTier === plan.id ? (
                                            <><Loader2 className="h-4 w-4 animate-spin me-2" />جاري التحويل...</>
                                        ) : 'اختر هذه الخطة'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Enterprise CTA */}
                    <div className="text-center mt-8">
                        <p className="text-cream-dark/40 text-sm mb-3">تحتاج حلاً مخصصاً لمؤسستك؟</p>
                        <Link href="/employer/messages">
                            <Button variant="outline" className="border-gold/20 text-gold hover:bg-gold/10">
                                تواصل معنا للخطة المؤسسية
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Candidate Services */}
                <div>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-cream mb-3">خدمات الباحثين عن عمل</h2>
                        <p className="text-cream-dark/50">عزّز فرصك في الحصول على الوظيفة المثالية</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        {candidateServices.map((service) => (
                            <Card key={service.name} className={`bg-gradient-to-b ${service.color} border-gold/10 hover:border-gold/20 transition-colors`}>
                                <CardContent className="p-6 text-center space-y-4">
                                    <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                                        <service.icon className="h-5 w-5 text-gold" />
                                    </div>
                                    <h3 className="font-semibold text-cream">{service.name}</h3>
                                    <p className="text-xs text-cream-dark/40 leading-relaxed">{service.description}</p>
                                    <Button variant="outline" className="w-full border-gold/20 text-gold hover:bg-gold/10" size="sm">
                                        اطلب الآن
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="text-center max-w-2xl mx-auto space-y-6 py-8">
                    <div className="flex items-center justify-center gap-3 text-cream-dark/40">
                        <Shield className="h-5 w-5 text-gold" />
                        <span className="text-sm">دفع آمن ومشفّر عبر Stripe. يمكنك الإلغاء في أي وقت.</span>
                    </div>
                    <Link href="/" className="text-gold hover:text-gold-light text-sm transition-colors">
                        ← العودة للرئيسية
                    </Link>
                </div>
            </div>
        </div>
    )
}
