'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    MapPin, 
    Briefcase, 
    Building2, 
    DollarSign, 
    ChevronLeft,
    Heart,
    Zap,
    Users
} from 'lucide-react';

const typeLabels: Record<string, string> = {
    full_time: 'دوام كامل',
    part_time: 'دوام جزئي',
    contract: 'عقد',
    remote: 'عن بُعد',
    internship: 'تدريب',
};

const typeColors: Record<string, string> = {
    full_time: 'bg-blue-500/20 text-blue-400',
    part_time: 'bg-purple-500/20 text-purple-400',
    contract: 'bg-orange-500/20 text-orange-400',
    remote: 'bg-green-500/20 text-green-400',
    internship: 'bg-pink-500/20 text-pink-400',
};

interface JobCardProps {
    job: any;
    isLoggedIn?: boolean;
}

export function JobCard({ job, isLoggedIn = false }: JobCardProps) {
    // Use real applicants_count from DB instead of Math.random()
    const applicantsCount = job.applicants_count || 0;
    
    let competitionLevel = 'منخفضة';
    let competitionColor = 'text-green-400 border-green-500/30 bg-green-500/10';
    
    if (applicantsCount > 50) {
        competitionLevel = 'متوسطة';
        competitionColor = 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    }
    if (applicantsCount > 100) {
        competitionLevel = 'مرتفعة';
        competitionColor = 'text-red-400 border-red-500/30 bg-red-500/10';
    }

    // Use real match_score from DB if available, otherwise show nothing
    const matchScore = job.match_score || null;

    return (
        <Card className="bg-navy-light border-gold/10 hover:border-gold/20 hover:shadow-xl hover:shadow-navy/50 transition-all group overflow-hidden relative">
            {/* Match Score Strip (If logged in and score exists) */}
            {isLoggedIn && matchScore && (
                <div className="absolute top-0 start-0 bg-gold text-navy text-xs font-bold px-3 py-1 rounded-be-xl shadow-md z-10 flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-current" />
                    {matchScore}% مطابقة
                </div>
            )}
            
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    
                    {/* Company Logo */}
                    <div className="w-16 h-16 rounded-xl bg-navy flex items-center justify-center flex-shrink-0 border border-gold/15 group-hover:border-gold/30 transition-colors">
                        {job.companies?.logo_url ? (
                            <img
                                src={job.companies.logo_url}
                                alt={job.companies.name}
                                className="w-full h-full object-cover rounded-xl"
                            />
                        ) : (
                            <Building2 className="h-8 w-8 text-cream-dark/30" />
                        )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-1 sm:mt-0">
                            <div>
                                <Link href={`/jobs/${job.slug}`} className="block group/title">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h3 className="text-xl font-bold text-cream group-hover/title:text-gold transition-colors line-clamp-1">
                                            {job.title}
                                        </h3>
                                        {job.is_featured && (
                                            <Badge className="bg-gold/20 text-gold hover:bg-gold/30 text-xs border border-gold/30">
                                                ★ مميزة
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-cream-dark/50 text-base font-medium mb-3">
                                        {job.is_confidential ? 'شركة سرية' : job.companies?.name}
                                    </p>
                                </Link>
                                
                                {/* Info Pills */}
                                <div className="flex flex-wrap items-center gap-3">
                                    {job.location && (
                                        <span className="flex items-center gap-1.5 text-sm text-cream-dark/60 bg-navy/50 px-3 py-1 rounded-full border border-gold/10">
                                            <MapPin className="h-3.5 w-3.5 text-cream-dark/40" />
                                            {job.location}
                                        </span>
                                    )}
                                    {job.salary_range && (
                                        <span className="flex items-center gap-1.5 text-sm text-cream-dark/60 bg-navy/50 px-3 py-1 rounded-full border border-gold/10">
                                            <DollarSign className="h-3.5 w-3.5 text-cream-dark/40" />
                                            {job.salary_range} د.إ
                                        </span>
                                    )}
                                    <Badge className={`${typeColors[job.job_type] || 'bg-cream-dark/20 text-cream-dark/50'} border-transparent`}>
                                        {typeLabels[job.job_type] || job.job_type}
                                    </Badge>
                                </div>
                            </div>
                            
                            {/* Actions & Competition */}
                            <div className="flex flex-col items-start sm:items-end gap-3 min-w-[200px]">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-gold/15 text-cream-dark/40 hover:text-rose-500 hover:border-rose-500 hover:bg-rose-500/10 transition-colors">
                                        <Heart className="h-5 w-5" />
                                    </Button>
                                    <Link href={`/jobs/${job.slug}`} className="flex-1 sm:flex-initial">
                                        <Button className="w-full h-10 bg-gold text-navy hover:bg-gold-dark font-bold shadow-sm">
                                            تقدم الآن
                                            <ChevronLeft className="ms-1 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>

                                <div className="w-full bg-navy rounded-lg p-2.5 border border-gold/10">
                                    <div className="flex items-center justify-between text-xs text-cream-dark/40 mb-1.5">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {applicantsCount} متقدم
                                        </span>
                                    </div>
                                    <div className={`text-xs font-semibold px-2 py-1 rounded border inline-block ${competitionColor}`}>
                                        منافسة {competitionLevel}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upsell Alert for High Competition */}
                {competitionLevel === 'مرتفعة' && (
                    <div className="mt-5 pt-4 border-t border-gold/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gold/80 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                            </span>
                            زد فرصك مع التقديم المميز
                        </p>
                        <Link href={`/jobs/${job.slug}/priority`}>
                            <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold-light h-8 text-xs">
                                <Zap className="me-1.5 h-3 w-3 fill-current" />
                                تقديم مميز — 5 د.إ
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
