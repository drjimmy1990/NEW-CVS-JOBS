import { Button } from '@/components/ui/button'
import { Mail, CheckCircle2, RefreshCw } from 'lucide-react'

export function EmailVerificationStep({ data, onVerify }: any) {
    // In a real flow, this step either polls for verification or sends an OTP
    // For this standard Supabase link flow, we show instructions to check email
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center py-6">
            <div className="mx-auto w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-gold" />
            </div>
            
            <h2 className="text-xl font-bold text-cream mb-2">تأكيد البريد الإلكتروني</h2>
            <p className="text-cream-dark/70 text-sm max-w-md mx-auto">
                لقد أرسلنا رابط تأكيد إلى <span className="text-cream font-medium dir-ltr inline-block">{data.email}</span>
                <br />
                يرجى التحقق من صندوق الوارد (أو مجلد الرسائل غير المرغوب فيها) والنقر على الرابط للاستمرار.
            </p>

            <div className="flex flex-col gap-3 justify-center max-w-xs mx-auto mt-6">
                <Button 
                    onClick={onVerify}
                    className="bg-gold text-navy hover:bg-gold-light"
                >
                    <CheckCircle2 className="w-4 h-4 me-2" />
                    لقد قمت بتأكيد البريد
                </Button>
                
                <Button 
                    variant="outline"
                    className="border-gold/20 text-cream-dark hover:bg-gold/5"
                >
                    <RefreshCw className="w-4 h-4 me-2" />
                    إعادة إرسال الرابط
                </Button>
            </div>
            
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 text-sm text-right">
                <strong className="block mb-1">ملاحظة حول البريد الإلكتروني:</strong>
                استخدام بريد إلكتروني رسمي للشركة يسرّع من عملية التحقق والموافقة على حسابك.
            </div>
        </div>
    )
}
