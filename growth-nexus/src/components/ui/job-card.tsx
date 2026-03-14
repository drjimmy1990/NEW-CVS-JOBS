'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    MapPin, 
    Briefcase, 
    Clock, 
    Building2, 
    DollarSign, 
    ChevronRight,
    Heart,
    Zap,
    Users
} from 'lucide-react';

const typeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    remote: 'Remote',
    internship: 'Internship',
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
    // Mock simulation for competition & applicants logic
    // In prod, this would map directly to DB counters
    const applicantsCount = job.priority_applications_count ? job.priority_applications_count * 10 + 42 : Math.floor(Math.random() * 150) + 5;
    
    let competitionLevel = 'Low';
    let competitionColor = 'text-green-400 border-green-500/30 bg-green-500/10';
    
    if (applicantsCount > 50) {
        competitionLevel = 'Medium';
        competitionColor = 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    }
    if (applicantsCount > 100) {
        competitionLevel = 'High';
        competitionColor = 'text-red-400 border-red-500/30 bg-red-500/10';
    }

    // Mock match score based on job title length to simulate difference
    const matchScore = Math.min(98, 50 + (job.title.length * 2));

    return (
        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group overflow-hidden relative">
            {/* Match Score Strip (If logged in) */}
            {isLoggedIn && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-md z-10 flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-current" />
                    {matchScore}% Match
                </div>
            )}
            
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    
                    {/* Company Logo */}
                    <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                        {job.companies?.logo_url ? (
                            <img
                                src={job.companies.logo_url}
                                alt={job.companies.name}
                                className="w-full h-full object-cover rounded-xl"
                            />
                        ) : (
                            <Building2 className="h-8 w-8 text-slate-500" />
                        )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-1 sm:mt-0">
                            <div>
                                <Link href={`/jobs/${job.slug}`} className="block group/title">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h3 className="text-xl font-bold text-white group-hover/title:text-emerald-400 transition-colors line-clamp-1">
                                            {job.title}
                                        </h3>
                                        {job.is_featured && (
                                            <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 text-xs border border-amber-500/30">
                                                ★ Featured
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-base font-medium mb-3">
                                        {job.is_confidential ? 'Confidential Company' : job.companies?.name}
                                    </p>
                                </Link>
                                
                                {/* Info Pills */}
                                <div className="flex flex-wrap items-center gap-3">
                                    {job.location && (
                                        <span className="flex items-center gap-1.5 text-sm text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                            {job.location}
                                        </span>
                                    )}
                                    {job.salary_range && (
                                        <span className="flex items-center gap-1.5 text-sm text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                                            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                                            {job.salary_range} AED
                                        </span>
                                    )}
                                    <Badge className={`${typeColors[job.job_type] || 'bg-slate-500/20 text-slate-400'} border-transparent`}>
                                        {typeLabels[job.job_type] || job.job_type}
                                    </Badge>
                                </div>
                            </div>
                            
                            {/* Actions & Competition */}
                            <div className="flex flex-col items-start sm:items-end gap-3 min-w-[200px]">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-500 hover:bg-rose-500/10 transition-colors">
                                        <Heart className="h-5 w-5" />
                                    </Button>
                                    <Link href={`/jobs/${job.slug}`} className="flex-1 sm:flex-initial">
                                        <Button className="w-full h-10 bg-white text-slate-900 hover:bg-slate-200 font-semibold shadow-sm">
                                            Apply Now
                                            <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>

                                <div className="w-full bg-slate-950 rounded-lg p-2.5 border border-slate-800/80">
                                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {applicantsCount} Applicants
                                        </span>
                                    </div>
                                    <div className={`text-xs font-semibold px-2 py-1 rounded border inline-block ${competitionColor}`}>
                                        {competitionLevel} Competition
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upsell Alert for High Competition */}
                {competitionLevel === 'High' && (
                    <div className="mt-5 pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-amber-200/80 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            Increase your chances with Priority Apply
                        </p>
                        <Link href={`/jobs/${job.slug}/priority`}>
                            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 h-8 text-xs">
                                <Zap className="mr-1.5 h-3 w-3 fill-current" />
                                Priority Apply — 5 AED
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
