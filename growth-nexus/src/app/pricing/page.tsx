import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Check, Briefcase, Star, Zap, Crown,
    Search, FileText, Rocket, Shield
} from 'lucide-react'
import Link from 'next/link'

const employerPlans = [
    {
        name: 'أساسي',
        price: '0',
        period: 'مجاني',
        description: 'ابدأ بنشر وظائفك الأولى',
        icon: Briefcase,
        color: 'border-gold/10',
        buttonStyle: 'border-gold/30 text-gold hover:bg-gold/10',
        buttonText: 'ابدأ الآن',
        buttonVariant: 'outline' as const,
        features: [
            'نشر 3 وظائف شهرياً',
            'لوحة تحكم أساسية',
            'استقبال طلبات التوظيف',
            'ملف شركة عام',
        ],
    },
    {
        name: 'احترافي',
        price: '299',
        period: 'شهرياً',
        description: 'للشركات النامية والتوظيف النشط',
        icon: Star,
        color: 'border-gold/40 ring-2 ring-gold/20',
        buttonStyle: 'bg-gold hover:bg-gold-dark text-navy font-bold',
        buttonText: 'اشترك الآن',
        buttonVariant: 'default' as const,
        badge: 'الأكثر طلباً',
        features: [
            '10 وظائف شهرياً',
            'تمييز وظيفتين كمميزة',
            'لوحة تحكم متقدمة مع إحصائيات',
            'فلترة المتقدمين الذكية',
            'دعم فني بالأولوية',
            'شعار الشركة على إعلانات الوظائف',
        ],
    },
    {
        name: 'مؤسسي',
        price: '699',
        period: 'شهرياً',
        description: 'للشركات الكبيرة وفرق التوظيف',
        icon: Crown,
        color: 'border-gold/10',
        buttonStyle: 'border-gold/30 text-gold hover:bg-gold/10',
        buttonText: 'تواصل معنا',
        buttonVariant: 'outline' as const,
        features: [
            'وظائف غير محدودة',
            'وصول كامل لقاعدة السير الذاتية',
            'مطابقة ذكية بالذكاء الاصطناعي',
            'تمييز جميع الوظائف',
            'تحليلات متقدمة',
            'حساب مدير توظيف مخصص',
            'API مخصص للتكامل',
        ],
    },
]

const candidateServices = [
    {
        name: 'تقديم بأولوية',
        price: '5',
        icon: Zap,
        description: 'اجعل طلبك يظهر أولاً أمام مسؤول التوظيف.',
        color: 'from-gold/10 to-gold/5',
    },
    {
        name: 'تعزيز الملف 7 أيام',
        price: '29',
        icon: Rocket,
        description: 'ملفك يظهر في أعلى نتائج البحث — 3 أضعاف المشاهدات.',
        color: 'from-purple-500/10 to-purple-500/5',
    },
    {
        name: 'تعزيز الملف 30 يوم',
        price: '79',
        icon: Star,
        description: 'أقصى انتشار لملفك لمدة شهر كامل.',
        color: 'from-blue-500/10 to-blue-500/5',
    },
    {
        name: 'مراجعة سيرة ذاتية احترافية',
        price: '199',
        icon: FileText,
        description: 'خبراؤنا يراجعون سيرتك ويحسّنونها لأنظمة ATS — تسليم خلال 24 ساعة.',
        color: 'from-success/10 to-success/5',
    },
]

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-navy">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-navy-lighter to-navy py-20 px-4">
                <div className="container mx-auto text-center max-w-3xl">
                    <Badge className="bg-gold/10 text-gold border-gold/30 text-sm px-4 py-1 mb-6">
                        خطط الأسعار
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold text-cream mb-6">
                        خطط مرنة تناسب احتياجاتك
                    </h1>
                    <p className="text-lg text-cream-dark/50 max-w-xl mx-auto">
                        سواء كنت باحثاً عن عمل أو شركة توظّف، لدينا الخطة المناسبة لك.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 space-y-20">
                {/* Employer Plans */}
                <div>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-cream mb-3">خطط أصحاب العمل</h2>
                        <p className="text-cream-dark/50">انشر وظائفك واعثر على أفضل المواهب في الإمارات</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {employerPlans.map((plan) => (
                            <Card key={plan.name} className={`bg-navy-light ${plan.color} relative overflow-hidden`}>
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
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-cream">{plan.price}</span>
                                        <span className="text-cream-dark/40 text-sm">د.إ / {plan.period}</span>
                                    </div>

                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3 text-sm text-cream-dark/60">
                                                <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button variant={plan.buttonVariant} className={`w-full ${plan.buttonStyle}`}>
                                        {plan.buttonText}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
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
                                    <div className="text-2xl font-bold text-gold">{service.price} <span className="text-sm font-normal text-cream-dark/40">د.إ</span></div>
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
                        <span className="text-sm">دفع آمن ومشفّر. يمكنك الإلغاء في أي وقت.</span>
                    </div>
                    <Link href="/" className="text-gold hover:text-gold-light text-sm transition-colors">
                        ← العودة للرئيسية
                    </Link>
                </div>
            </div>
        </div>
    )
}
