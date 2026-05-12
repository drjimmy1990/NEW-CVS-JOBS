'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { SUB_INDUSTRIES } from '@/lib/types'

// Steps
import { RegistrationStepper } from '@/components/employer/registration/RegistrationStepper'
import { AccountDataStep } from '@/components/employer/registration/AccountDataStep'
import { EntityTypeStep } from '@/components/employer/registration/EntityTypeStep'
import { IndustryStep } from '@/components/employer/registration/IndustryStep'
import { CompanyDataStep } from '@/components/employer/registration/CompanyDataStep'
import { DocumentUploadStep } from '@/components/employer/registration/DocumentUploadStep'
import { PendingApprovalStep } from '@/components/employer/registration/PendingApprovalStep'

export default function EmployerRegistrationWizard() {
    const router = useRouter()
    
    const [currentStep, setCurrentStep] = useState(1)
    const [completedSteps, setCompletedSteps] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Master State
    const [formData, setFormData] = useState({
        // Step 1
        email: '',
        password: '',
        contact_person_name: '',
        contact_person_title: '',
        // Step 2
        entity_type: '',
        // Step 3
        industry: '',
        sub_industry: '',
        // Step 4
        official_name: '',
        trade_name: '',
        trade_license_number: '',
        trade_license_expiry: '',
        emirate: '',
        city: '',
        address: '',
        phone: '',
        website: '',
        linkedin_url: '',
        employee_count_range: '',
        // Step 6
        documents: [],
    })

    const updateFormData = (newData: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...newData }))
    }

    const validateStep = (step: number) => {
        setError(null)
        switch(step) {
            case 1:
                if (!formData.email || !formData.password || !formData.contact_person_name) {
                    setError('يرجى تعبئة جميع الحقول المطلوبة')
                    return false
                }
                if (formData.password.length < 8) {
                    setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
                    return false
                }
                return true
            case 2:
                if (!formData.entity_type) {
                    setError('يرجى اختيار نوع الجهة')
                    return false
                }
                return true
            case 3:
                const hasSubIndustries = formData.industry && SUB_INDUSTRIES[formData.industry] && SUB_INDUSTRIES[formData.industry].length > 0;
                if (!formData.industry || (hasSubIndustries && !formData.sub_industry)) {
                    setError('يرجى اختيار القطاع الرئيسي والفرعي')
                    return false
                }
                return true
            case 4:
                if (!formData.official_name || !formData.emirate || !formData.phone || !formData.employee_count_range) {
                    setError('يرجى تعبئة الحقول الأساسية لبيانات الشركة')
                    return false
                }
                return true
            case 5:
                // Check if all required docs for the entity type are present
                // Simple validation for now
                if (formData.entity_type !== 'government' && formData.documents.length === 0) {
                    setError('يرجى إرفاق المستندات المطلوبة')
                    return false
                }
                return true
            default:
                return true
        }
    }

    const handleNext = () => {
        if (!validateStep(currentStep)) return
        
        if (!completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep])
        }
        
        setCurrentStep(prev => prev + 1)
    }

    const handleBack = () => {
        setCurrentStep(prev => prev - 1)
        setError(null)
    }

    const submitRegistration = async () => {
        if (!validateStep(5)) return
        
        setIsLoading(true)
        setError(null)
        
        try {
            const supabase = createClient()
            
            // 1. Sign up the user (or recover if they already exist from a failed attempt)
            let userId: string

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.contact_person_name,
                        role: 'employer',
                    }
                }
            })
            
            if (authError) {
                // If user already exists (from a previous failed attempt), try signing in
                if (authError.message?.includes('already registered') || authError.status === 422) {
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: formData.email,
                        password: formData.password,
                    })
                    if (signInError) {
                        throw new Error('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر.')
                    }
                    userId = signInData.user.id
                } else {
                    throw authError
                }
            } else {
                if (!authData.user) throw new Error("فشل إنشاء الحساب")
                userId = authData.user.id
            }

            // 2. Upload documents
            const uploadedDocs = []
            for (const doc of formData.documents as any[]) {
                if (doc.file_object) {
                    const fileExt = doc.file_name.split('.').pop()
                    const filePath = `${userId}/${doc.document_type}-${Date.now()}.${fileExt}`
                    
                    const { error: uploadError } = await supabase.storage
                        .from('company_documents')
                        .upload(filePath, doc.file_object)
                        
                    if (uploadError) {
                        console.error("Upload error:", uploadError)
                        throw new Error("فشل رفع المستندات. يرجى المحاولة مرة أخرى.")
                    }
                        
                    uploadedDocs.push({
                        document_type: doc.document_type,
                        file_name: doc.file_name,
                        file_size: doc.file_size,
                        file_url: filePath // Store relative path for private bucket
                    })
                }
            }

            // 3. Call API to insert DB records
            const response = await fetch('/api/company/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    userId,
                    documents: uploadedDocs
                })
            })
            
            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || "فشل تسجيل بيانات الشركة")
            }
            
            // Mark as complete and go to final step
            setCompletedSteps([...completedSteps, 5])
            setCurrentStep(6)
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-cream mb-2">تسجيل كصاحب عمل</h1>
                <p className="text-cream-dark/70">يرجى إكمال خطوات التسجيل لتوثيق حساب شركتك</p>
            </div>

            {/* Stepper */}
            <RegistrationStepper currentStep={currentStep} completedSteps={completedSteps} />

            {/* Wizard Card */}
            <div className="bg-navy-dark border border-gold/20 rounded-2xl p-6 md:p-10 shadow-xl shadow-navy-dark/50 relative overflow-hidden">
                
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="relative z-10">
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in">
                            {error}
                        </div>
                    )}

                    {/* Step Content */}
                    <div className="min-h-[400px]">
                        {currentStep === 1 && <AccountDataStep data={formData} updateData={updateFormData} />}
                        {currentStep === 2 && <EntityTypeStep data={formData} updateData={updateFormData} />}
                        {currentStep === 3 && <IndustryStep data={formData} updateData={updateFormData} />}
                        {currentStep === 4 && <CompanyDataStep data={formData} updateData={updateFormData} />}
                        {currentStep === 5 && <DocumentUploadStep data={formData} updateData={updateFormData} />}
                        {currentStep === 6 && <PendingApprovalStep data={formData} />}
                    </div>

                    {/* Navigation Buttons */}
                    {currentStep < 6 && (
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gold/10">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={currentStep === 1 || isLoading}
                                className="border-gold/20 text-cream-dark hover:bg-gold/5"
                            >
                                <ArrowRight className="me-2 h-4 w-4" />
                                السابق
                            </Button>

                            {currentStep < 5 ? (
                                <Button
                                    onClick={handleNext}
                                    className="bg-gold text-navy hover:bg-gold-light"
                                >
                                    التالي
                                    <ArrowLeft className="ms-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={submitRegistration}
                                    disabled={isLoading}
                                    className="bg-success text-white hover:bg-success/90"
                                >
                                    {isLoading ? (
                                        <><Loader2 className="me-2 h-4 w-4 animate-spin" /> جاري التوثيق...</>
                                    ) : (
                                        <><CheckCircle2 className="me-2 h-4 w-4" /> إرسال طلب التوثيق</>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Back to Login */}
            {currentStep === 1 && (
                <div className="text-center mt-6">
                    <Link href="/register" className="text-cream-dark/50 hover:text-gold text-sm transition-colors">
                        العودة لاختيار نوع الحساب
                    </Link>
                </div>
            )}
        </div>
    )
}
