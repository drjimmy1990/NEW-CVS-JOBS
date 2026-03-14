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
  ArrowRight,
  Building2,
  UserCircle,
  Sparkles
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GrowthNexus - AI-Powered Recruitment Platform',
  description: 'Connect with top talent and leading employers. Post jobs, parse CVs with AI, and hire smarter. The future of recruitment is here.',
  openGraph: {
    title: 'GrowthNexus - AI-Powered Recruitment Platform',
    description: 'Connect with top talent and leading employers.',
    images: ['/og-image.png'],
  }
}

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered CV Parsing',
    description: 'Our AI extracts skills, experience, and qualifications from CVs automatically.'
  },
  {
    icon: Shield,
    title: 'Confidential Listings',
    description: 'Post jobs without revealing your company identity to protect sensitive hires.'
  },
  {
    icon: TrendingUp,
    title: 'Smart Matching',
    description: 'AI-powered matching connects the right candidates to the right opportunities.'
  },
  {
    icon: Zap,
    title: 'Fast & Easy',
    description: 'Post a job in under 5 minutes. Simple, intuitive, and powerful.'
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <Sparkles className="mr-1 h-3 w-3" />
              AI-Powered Recruitment
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Find Your Next
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                Career Opportunity
              </span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Connect with top employers, showcase your skills with AI-optimized CVs,
              and land your dream job faster than ever.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/jobs">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Jobs
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-800 bg-slate-900/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Active Jobs' },
              { value: '50K+', label: 'Candidates' },
              { value: '5K+', label: 'Companies' },
              { value: '95%', label: 'Success Rate' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  {stat.value}
                </div>
                <div className="text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Built for Everyone
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Whether you're looking for your next role or searching for top talent
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* For Candidates */}
          <Card className="bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
                <UserCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">For Job Seekers</h3>
              <ul className="space-y-3 text-slate-400 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Upload your CV, let AI do the rest
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Get matched with relevant jobs
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Apply with one click
                </li>
              </ul>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white group-hover:shadow-lg group-hover:shadow-emerald-500/25 transition-shadow">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* For Employers */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20 hover:border-blue-500/40 transition-colors group">
            <CardContent className="p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Building2 className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">For Employers</h3>
              <ul className="space-y-3 text-slate-400 mb-6">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Post jobs in minutes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  AI-parsed candidate profiles
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Confidential hiring options
                </li>
              </ul>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-shadow">
                  Post Your First Job
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-900/30 border-y border-slate-800 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose GrowthNexus?
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Powered by cutting-edge AI to make hiring and job hunting effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-cyan-600 opacity-90" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

          <div className="relative px-8 py-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of companies and candidates already using GrowthNexus
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/jobs">
                <Button size="lg" className="w-full sm:w-auto bg-white text-emerald-600 hover:bg-slate-100">
                  <Search className="mr-2 h-5 w-5" />
                  Find Jobs
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Start Hiring
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">G</span>
              </div>
              <span className="font-bold text-white">GrowthNexus</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/jobs" className="hover:text-white transition-colors">Jobs</Link>
              <Link href="/register" className="hover:text-white transition-colors">Post a Job</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 GrowthNexus. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
