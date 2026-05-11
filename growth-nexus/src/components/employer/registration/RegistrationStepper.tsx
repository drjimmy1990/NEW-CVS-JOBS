'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
    number: number
    title: string
    titleEn: string
}

const STEPS: Step[] = [
    { number: 1, title: 'بيانات الحساب', titleEn: 'Account Data' },
    { number: 2, title: 'نوع الجهة', titleEn: 'Entity Type' },
    { number: 3, title: 'القطاع', titleEn: 'Industry' },
    { number: 4, title: 'بيانات الشركة', titleEn: 'Company Data' },
    { number: 5, title: 'رفع المستندات', titleEn: 'Documents' },
    { number: 6, title: 'انتظار الموافقة', titleEn: 'Pending' },
]

interface RegistrationStepperProps {
    currentStep: number
    completedSteps: number[]
}

export function RegistrationStepper({ currentStep, completedSteps }: RegistrationStepperProps) {
    return (
        <div className="w-full">
            {/* Desktop stepper */}
            <div className="hidden md:flex items-center justify-between mb-8">
                {STEPS.map((step, i) => (
                    <div key={step.number} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                                completedSteps.includes(step.number)
                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                    : currentStep === step.number
                                        ? 'bg-gold text-navy shadow-lg shadow-gold/30 ring-4 ring-gold/20'
                                        : 'bg-navy-lighter text-cream-dark/40 border border-gold/10'
                            )}>
                                {completedSteps.includes(step.number) ? (
                                    <Check className="h-5 w-5" />
                                ) : step.number}
                            </div>
                            <span className={cn(
                                'text-xs mt-2 text-center max-w-[80px]',
                                currentStep === step.number ? 'text-gold font-medium' : 'text-cream-dark/40'
                            )}>
                                {step.title}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={cn(
                                'flex-1 h-0.5 mx-2 mt-[-20px] transition-colors duration-300',
                                completedSteps.includes(step.number) ? 'bg-green-500/50' : 'bg-gold/10'
                            )} />
                        )}
                    </div>
                ))}
            </div>

            {/* Mobile stepper */}
            <div className="md:hidden mb-6">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-gold font-medium text-sm">
                        الخطوة {currentStep} من {STEPS.length}
                    </span>
                    <span className="text-cream-dark/50 text-sm">
                        {STEPS[currentStep - 1]?.title}
                    </span>
                </div>
                <div className="w-full bg-navy-lighter rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-gold to-gold-light h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
