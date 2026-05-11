import { Button } from '@/components/ui/button'
import { CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function PendingApprovalStep({ data }: any) {
    const router = useRouter()
    
    // In a real app, this status would come from the API response
    // based on the risk score and auto-approval logic
    const isAutoVerified = data.entity_type === 'government' 
        && data.email.includes('gov.ae')
        
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-8">
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-gold/20">
                {isAutoVerified ? (
                    <div className="w-full h-full bg-success/20 rounded-full flex items-center justify-center border-2 border-success/50">
                        <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                ) : (
                    <div className="w-full h-full bg-orange-500/20 rounded-full flex items-center justify-center border-2 border-orange-500/50">
                        <ShieldAlert className="w-10 h-10 text-orange-400" />
                    </div>
                )}
            </div>
            
            <h2 className="text-2xl font-bold text-cream mb-2">
                {isAutoVerified ? 'تم التحقق بنجاح!' : 'طلبك قيد المراجعة'}
            </h2>
            
            <p className="text-cream-dark/70 text-base max-w-md mx-auto mb-4">
                {isAutoVerified 
                    ? 'تم توثيق حساب الجهة الحكومية تلقائياً. يمكنك الآن البدء في نشر الوظائف والبحث عن المرشحين.'
                    : 'لقد استلمنا بيانات الشركة والمستندات بنجاح. سيقوم فريقنا بمراجعتها والرد عليك خلال 24-48 ساعة عمل كحد أقصى.'
                }
            </p>

            <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 mb-8 max-w-md mx-auto text-sm text-gold-light">
                <strong>يرجى التحقق من بريدك الإلكتروني:</strong> لقد أرسلنا رابط تفعيل إلى بريدك الإلكتروني. يرجى النقر عليه لتفعيل الحساب أثناء مراجعة المستندات.
            </div>

            <Button 
                onClick={() => router.push('/employer/dashboard')}
                className="bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-navy font-bold px-8 py-6 h-auto text-lg"
            >
                الانتقال إلى لوحة التحكم
                <ArrowLeft className="ms-2 h-5 w-5" />
            </Button>
            
            {!isAutoVerified && (
                <p className="mt-6 text-sm text-cream-dark/40">
                    ملاحظة: يمكنك الوصول إلى لوحة التحكم بصلاحيات محدودة حتى تتم الموافقة.
                </p>
            )}
        </div>
    )
}
