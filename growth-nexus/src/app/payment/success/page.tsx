import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4" dir="rtl">
            <Card className="bg-navy-light border-gold/10 max-w-md w-full">
                <CardContent className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-cream">تم الاشتراك بنجاح! 🎉</h1>
                    <p className="text-cream-dark/50">
                        شكراً لاشتراكك في GrowthNexus. تم تفعيل خطتك الجديدة ويمكنك الآن الاستفادة من جميع المميزات.
                    </p>
                    <div className="space-y-3">
                        <Link href="/employer/dashboard">
                            <Button className="w-full bg-gold hover:bg-gold-dark text-navy font-bold">
                                الذهاب للوحة التحكم <ArrowRight className="h-4 w-4 ms-2" />
                            </Button>
                        </Link>
                        <Link href="/employer/jobs/new">
                            <Button variant="outline" className="w-full border-gold/20 text-gold hover:bg-gold/10">
                                نشر وظيفة جديدة
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
