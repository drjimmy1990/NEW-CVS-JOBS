'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
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
    Users,
    Globe,
    ExternalLink,
    Lock
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
    isSaved?: boolean;
    isExternal?: boolean;
    sourceUrl?: string;
    sourcePlatform?: string;
    accessLevel?: string;
}

const platformLabels: Record<string, string> = {
    linkedin: 'LinkedIn',
    bayt: 'Bayt.com',
    gulftalen: 'GulfTalent',
    indeed: 'Indeed',
    glassdoor: 'Glassdoor',
    weworkremotely: 'WeWorkRemotely',
    remoteok: 'RemoteOK',
    naukrigulf: 'NaukriGulf',
};

export function JobCard({ job, isLoggedIn = false, isSaved = false, isExternal = false, sourceUrl, sourcePlatform, accessLevel }: JobCardProps) {
    const router = useRouter();
    const supabase = createClient();
    const [saved, setSaved] = useState(isSaved);
    const [isLoading, setIsLoading] = useState(false);
    const [clickLoading, setClickLoading] = useState(false);

    // Use views_count for external jobs, applicants_count for internal
    const applicantsCount = isExternal ? (job.views_count || 0) : (job.applicants_count || 0);
    
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

    const handleSaveToggle = async () => {
        if (!isLoggedIn) {
            router.push('/login?redirect=/jobs');
            return;
        }
        
        if (isLoading) return;
        setIsLoading(true);
        const newState = !saved;
        setSaved(newState); // optimistic update

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            if (newState) {
                await supabase.from('saved_jobs').insert({ candidate_id: user.id, job_id: job.id });
            } else {
                await supabase.from('saved_jobs').delete().match({ candidate_id: user.id, job_id: job.id });
            }
        } catch (error) {
            console.error('Error toggling save status:', error);
            setSaved(!newState); // revert on failure
        } finally {
            setIsLoading(false);
        }
    };

    // Handle external job apply click
    const handleExternalApply = async () => {
        if (!sourceUrl) return;
        setClickLoading(true);
        try {
            await fetch(`/api/external-jobs/${job.id}/click`, { method: 'POST' });
        } catch { /* don't block redirect */ }
        window.open(sourceUrl, '_blank', 'noopener,noreferrer');
        setClickLoading(false);
    };

    const isPremiumLocked = isExternal && accessLevel === 'premium' && !isLoggedIn;
    const jobDetailUrl = isExternal ? `/jobs/external/${job.slug}` : `/jobs/${job.slug}`;

    return (
        <Card className={`bg-navy-light border-gold/8 hover:border-gold/20 hover:shadow-2xl hover:shadow-gold/5 transition-all duration-300 group overflow-hidden relative hover:border-l-gold/40 hover:border-l-2 ${isExternal ? 'border-l-blue-500/20' : ''}`}>
            {/* External Badge */}
            {isExternal && (
                <div className="absolute top-0 start-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-be-xl shadow-md z-10 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {platformLabels[sourcePlatform || ''] || sourcePlatform || 'خارجي'}
                </div>
            )}
            {/* Match Score Strip (If logged in, not external, and score exists) */}
            {!isExternal && isLoggedIn && matchScore && (
                <div className="absolute top-0 start-0 bg-gold text-navy text-xs font-bold px-3 py-1 rounded-be-xl shadow-md z-10 flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-current" />
                    {matchScore}% مطابقة
                </div>
            )}
            
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    
                    {/* Company Logo */}
                    <div className={`w-16 h-16 rounded-2xl bg-navy/80 flex items-center justify-center flex-shrink-0 border ${isExternal ? 'border-blue-500/20 group-hover:border-blue-500/40' : 'border-gold/10 group-hover:border-gold/25'} transition-all duration-300 shadow-inner`}>
                        {(isExternal ? job.company_logo_url : job.companies?.logo_url) ? (
                            <img
                                src={isExternal ? job.company_logo_url : job.companies.logo_url}
                                alt={isExternal ? job.company_name : job.companies.name}
                                className="w-full h-full object-cover rounded-xl"
                            />
                        ) : (
                            <Building2 className={`h-8 w-8 ${isExternal ? 'text-blue-400/30' : 'text-cream-dark/30'}`} />
                        )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-1 sm:mt-0">
                            <div>
                                <Link href={jobDetailUrl} className="block group/title">
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
                                        {isExternal
                                            ? (job.company_name || 'شركة خارجية')
                                            : (job.is_confidential ? 'شركة سرية' : job.companies?.name)
                                        }
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
                                    {/* Save button — only for internal jobs */}
                                    {!isExternal && (
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            onClick={handleSaveToggle}
                                            disabled={isLoading}
                                            className={`h-10 w-10 shrink-0 transition-colors border-gold/15 ${
                                                saved 
                                                    ? 'text-rose-500 border-rose-500 bg-rose-500/10' 
                                                    : 'text-cream-dark/40 hover:text-rose-500 hover:border-rose-500 hover:bg-rose-500/10'
                                            }`}
                                        >
                                            <Heart className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} />
                                        </Button>
                                    )}
                                    
                                    {/* Apply button — different behavior for external vs internal */}
                                    {isExternal ? (
                                        isPremiumLocked ? (
                                            <Link href="/pricing" className="flex-1 sm:flex-initial">
                                                <Button className="w-full h-10 bg-gradient-to-r from-gold to-gold-light text-navy font-bold shadow-sm">
                                                    <Lock className="me-1 h-4 w-4" />
                                                    اشترك للتقديم
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Button
                                                onClick={handleExternalApply}
                                                disabled={clickLoading}
                                                className="flex-1 sm:flex-initial w-full h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-sm"
                                            >
                                                <ExternalLink className="me-1 h-4 w-4" />
                                                تقدم على الموقع
                                            </Button>
                                        )
                                    ) : (
                                        <Link href={`/jobs/${job.slug}`} className="flex-1 sm:flex-initial">
                                            <Button className="w-full h-10 bg-gold text-navy hover:bg-gold-dark font-bold shadow-sm">
                                                تقدم الآن
                                                <ChevronLeft className="ms-1 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>

                                <div className="w-full bg-navy/60 rounded-xl p-2.5 border border-gold/8 backdrop-blur-sm">
                                    <div className="flex items-center justify-between text-xs text-cream-dark/40 mb-1.5">
                                        <span className="flex items-center gap-1">
                                            <><Users className="h-3 w-3" />{applicantsCount} مشاهدة</>
                                        </span>
                                    </div>
                                    {!isExternal && (
                                        <div className={`text-xs font-semibold px-2 py-1 rounded border inline-block ${competitionColor}`}>
                                            منافسة {competitionLevel}
                                        </div>
                                    )}
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
