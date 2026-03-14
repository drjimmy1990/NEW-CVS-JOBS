import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Briefcase,
  Users,
  Zap,
  Shield,
  TrendingUp,
  ArrowLeft,
  Building2,
  UserCircle,
  Sparkles
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GrowthNexus - منصة التوظيف الذكية في الإمارات',
  description: 'تواصل مع أفضل المواهب وأبرز جهات التوظيف. أنشر وظائف، حلل السير الذاتية بالذكاء الاصطناعي، ووظّف بذكاء.',
  openGraph: {
    title: 'GrowthNexus - منصة التوظيف الذكية',
    description: 'تواصل مع أفضل المواهب وأبرز جهات التوظيف.',
    images: ['/og-image.png'],
  }
}

const features = [
  {
    icon: Sparkles,
    title: 'تحليل السيرة الذاتية بالذكاء الاصطناعي',
    description: 'يستخرج الذكاء الاصطناعي المهارات والخبرات والمؤهلات من السيرة الذاتية تلقائياً.'
  },
  {
    icon: Shield,
    title: 'إعلانات سرية',
    description: 'أنشر وظائف بدون الكشف عن هوية شركتك لحماية التوظيف الحساس.'
  },
  {
    icon: TrendingUp,
    title: 'مطابقة ذكية',
    description: 'مطابقة مدعومة بالذكاء الاصطناعي تربط المرشحين المناسبين بالفرص المناسبة.'
  },
  {
    icon: Zap,
    title: 'سريع وسهل',
    description: 'أنشر وظيفة في أقل من 5 دقائق. بسيط وبديهي وقوي.'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gold/10 text-gold border-gold/30">
              <Sparkles className="me-1 h-3 w-3" />
              توظيف مدعوم بالذكاء الاصطناعي
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-cream mb-6 leading-tight">
              اعثر على فرصتك
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold">
                المهنية القادمة
              </span>
            </h1>

            <p className="text-xl text-cream-dark/70 mb-10 max-w-2xl mx-auto">
              تواصل مع أبرز جهات التوظيف، اعرض مهاراتك بسيرة ذاتية محسنة بالذكاء الاصطناعي،
              واحصل على وظيفة أحلامك بشكل أسرع.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/jobs">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold">
                  <Search className="me-2 h-5 w-5" />
                  تصفح الوظائف
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 border-gold/30 text-cream hover:bg-gold/10 hover:text-gold">
                  <Briefcase className="me-2 h-5 w-5" />
                  أنشر وظيفة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-gold/10 bg-navy-light/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '+10K', label: 'وظيفة نشطة' },
              { value: '+50K', label: 'باحث عن عمل' },
              { value: '+5K', label: 'شركة' },
              { value: '95%', label: 'نسبة النجاح' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
                  {stat.value}
                </div>
                <div className="text-cream-dark/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-cream mb-4">
            مصمم للجميع
          </h2>
          <p className="text-cream-dark/60 text-lg max-w-2xl mx-auto">
            سواء كنت تبحث عن وظيفتك القادمة أو تبحث عن أفضل المواهب
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* For Candidates */}
          <Card className="bg-gradient-to-br from-gold/5 to-gold/[0.02] border-gold/20 hover:border-gold/40 transition-colors group">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center mb-6">
                <UserCircle className="h-8 w-8 text-gold" />
              </div>
              <h3 className="text-2xl font-bold text-cream mb-3">للباحثين عن عمل</h3>
              <ul className="space-y-3 text-cream-dark/60 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  ارفع سيرتك الذاتية ودع الذكاء الاصطناعي يتكفل بالباقي
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  احصل على مطابقة مع الوظائف المناسبة
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  تقدم بنقرة واحدة
                </li>
              </ul>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold group-hover:shadow-lg group-hover:shadow-gold/25 transition-shadow">
                  أنشئ حساب مجاني
                  <ArrowLeft className="ms-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* For Employers */}
          <Card className="bg-gradient-to-br from-success/5 to-success/[0.02] border-success/20 hover:border-success/40 transition-colors group">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center mb-6">
                <Building2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-cream mb-3">لأصحاب العمل</h3>
              <ul className="space-y-3 text-cream-dark/60 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  أنشر وظائف في دقائق
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  ملفات مرشحين محللة بالذكاء الاصطناعي
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  خيارات توظیف سرية
                </li>
              </ul>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-success to-success-dark hover:from-success-dark hover:to-success text-white font-bold group-hover:shadow-lg group-hover:shadow-success/25 transition-shadow">
                  أنشر أول وظيفة
                  <ArrowLeft className="ms-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-navy-light/30 border-y border-gold/10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-cream mb-4">
              لماذا تختار GrowthNexus؟
            </h2>
            <p className="text-cream-dark/60 text-lg max-w-2xl mx-auto">
              مدعوم بأحدث تقنيات الذكاء الاصطناعي لجعل التوظيف والبحث عن عمل أسهل
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-navy-light/50 border-gold/10 hover:border-gold/25 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-cream mb-2">{feature.title}</h3>
                  <p className="text-cream-dark/50 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold to-gold-dark opacity-90" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

          <div className="relative px-8 py-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              مستعد للبدء؟
            </h2>
            <p className="text-navy/80 text-lg mb-8 max-w-xl mx-auto">
              انضم إلى آلاف الشركات والمرشحين الذين يستخدمون GrowthNexus
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/jobs">
                <Button size="lg" className="w-full sm:w-auto bg-navy text-cream hover:bg-navy-light">
                  <Search className="me-2 h-5 w-5" />
                  ابحث عن وظائف
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-navy text-navy hover:bg-navy/10">
                  <Briefcase className="me-2 h-5 w-5" />
                  ابدأ التوظيف
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                <span className="text-sm font-bold text-navy">G</span>
              </div>
              <span className="font-bold text-cream">GrowthNexus</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-cream-dark/50">
              <Link href="/jobs" className="hover:text-gold transition-colors">الوظائف</Link>
              <Link href="/register" className="hover:text-gold transition-colors">أنشر وظيفة</Link>
              <Link href="/login" className="hover:text-gold transition-colors">تسجيل الدخول</Link>
            </div>
            <div className="text-sm text-cream-dark/40">
              © 2026 GrowthNexus. جميع الحقوق محفوظة.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
