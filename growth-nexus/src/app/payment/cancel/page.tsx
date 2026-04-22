import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4" dir="rtl">
            <Card className="bg-navy-light border-gold/10 max-w-md w-full">
                <CardContent className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-cream">تم إلغاء العملية</h1>
                    <p className="text-cream-dark/50">
                        لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى في أي وقت.
                    </p>
                    <div className="space-y-3">
                        <Link href="/pricing">
                            <Button className="w-full bg-gold hover:bg-gold-dark text-navy font-bold">
                                العودة للخطط
                            </Button>
                        </Link>
                        <Link href="/employer/dashboard">
                            <Button variant="ghost" className="w-full text-cream-dark/50 hover:text-cream">
                                العودة للوحة التحكم
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
