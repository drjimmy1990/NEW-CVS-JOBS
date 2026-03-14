'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
    User, 
    Briefcase, 
    GraduationCap, 
    Lightbulb, 
    Globe, 
    MapPin, 
    Save,
    Plus,
    Trash2,
    Calendar,
    Building2,
    Languages,
    Image as ImageIcon
} from 'lucide-react'

// Mock initial data
const initialData = {
    first_name: 'Ahmed',
    last_name: 'Al Mansoori',
    email: 'ahmed.m@example.com',
    phone: '+971 50 123 4567',
    candidate_type: 'emirati',
    residence_emirate: 'Dubai',
    family_book_emirate: 'Abu Dhabi', // Emirati specific
    visa_status: '', // Resident specific
}

export default function CandidateProfilePage() {
    const [activeTab, setActiveTab] = useState('personal')
    const [formData, setFormData] = useState(initialData)
    const [isSaving, setIsSaving] = useState(false)

    // Dynamic Lists State
    const [experiences, setExperiences] = useState([
        { id: 1, title: 'Senior Marketing Exec', company: 'Emirates NBD', start: '2020', end: 'Present' }
    ])

    const handleSave = () => {
        setIsSaving(true)
        setTimeout(() => setIsSaving(false), 1000)
    }

    const tabs = [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'experience', label: 'Experience', icon: Briefcase },
        { id: 'education', label: 'Education', icon: GraduationCap },
        { id: 'skills', label: 'Skills & Languages', icon: Lightbulb },
        { id: 'preferences', label: 'Job Preferences', icon: MapPin },
    ]

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
                    <p className="text-slate-400 mt-1">
                        Complete your profile to unlock personalized job recommendations.
                    </p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[120px]"
                >
                    {isSaving ? 'Saving...' : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive 
                                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5' 
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                                }`}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <span className="font-medium text-sm">{tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {/* Personal Info Tab */}
                    {activeTab === 'personal' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Avatar Section */}
                            <Card className="bg-slate-900 border-slate-800">
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="h-24 w-24 rounded-full bg-slate-800 border-2 border-emerald-500/20 flex flex-col items-center justify-center text-slate-400 overflow-hidden relative group cursor-pointer">
                                        <User className="h-10 w-10 mb-1" />
                                        <span className="text-[10px] font-medium uppercase tracking-wider">Avatar</span>
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ImageIcon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium mb-1">Profile Photo</h3>
                                        <p className="text-sm text-slate-400 mb-4 max-w-sm">
                                            Upload a professional photo to make your profile stand out. Supported formats: JPG, PNG.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button size="sm" variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                                                Upload New
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Basic Details */}
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-white text-xl">Basic Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">First Name</Label>
                                            <Input className="bg-slate-950 border-slate-800 text-white" defaultValue={formData.first_name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Last Name</Label>
                                            <Input className="bg-slate-950 border-slate-800 text-white" defaultValue={formData.last_name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Email Address</Label>
                                            <Input className="bg-slate-950 border-slate-800 text-white" type="email" defaultValue={formData.email} disabled />
                                            <p className="text-xs text-slate-500">Contact support to change your primary email.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">Phone Number</Label>
                                            <Input className="bg-slate-950 border-slate-800 text-white" type="tel" defaultValue={formData.phone} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Residency & Status (Emirati vs Resident Logic) */}
                            <Card className="bg-slate-900 border-slate-800 overflow-hidden relative">
                                {/* Decorator */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl rounded-tr-xl"></div>
                                
                                <CardHeader>
                                    <CardTitle className="text-white text-xl flex items-center justify-between">
                                        Residency Status
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                            {formData.candidate_type === 'emirati' ? 'UAE National' : 'UAE Resident'}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 relative z-10">
                                    
                                    {/* Type Toggle Simulation */}
                                    <div className="flex gap-4 p-1 bg-slate-950 rounded-lg inline-flex mb-4 border border-slate-800">
                                        <button 
                                            onClick={() => setFormData({...formData, candidate_type: 'emirati'})}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${formData.candidate_type === 'emirati' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Emirati 🇦🇪
                                        </button>
                                        <button 
                                            onClick={() => setFormData({...formData, candidate_type: 'resident'})}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${formData.candidate_type === 'resident' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            Resident 🌍
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-300">City / Emirate of Residence</Label>
                                            <select className="w-full flex h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                                <option>Dubai</option>
                                                <option>Abu Dhabi</option>
                                                <option>Sharjah</option>
                                                <option>Ajman</option>
                                            </select>
                                        </div>

                                        {/* Conditional Fields based on Candidate Type */}
                                        {formData.candidate_type === 'emirati' ? (
                                            <>
                                                <div className="space-y-2 animate-in fade-in duration-300">
                                                    <Label className="text-emerald-400">Family Book Emirate</Label>
                                                    <select className="w-full flex h-10 rounded-md border border-emerald-500/50 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                                        <option>Abu Dhabi</option>
                                                        <option>Dubai</option>
                                                        <option>Sharjah</option>
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-2 animate-in fade-in duration-300">
                                                    <Label className="text-slate-300">Visa Status</Label>
                                                    <select className="w-full flex h-10 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                                                        <option value="">Select Visa Status</option>
                                                        <option value="employment">Employment Visa</option>
                                                        <option value="golden">Golden Visa</option>
                                                        <option value="freelance">Freelance Visa</option>
                                                        <option value="tourist">Tourist Visa (Looking for work)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2 animate-in fade-in duration-300">
                                                    <Label className="text-slate-300">Nationality</Label>
                                                    <Input className="bg-slate-950 border-slate-800 text-white" placeholder="e.g. British, Indian, Egyptian..." />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Experience Tab */}
                    {activeTab === 'experience' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-white">Work Experience</h2>
                                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Experience
                                </Button>
                            </div>

                            {experiences.map((exp) => (
                                <Card key={exp.id} className="bg-slate-900 border-slate-800 group hover:border-slate-700 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 bg-slate-800 p-2 rounded-lg">
                                                    <Building2 className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-medium text-white">{exp.title}</h3>
                                                    <p className="text-emerald-400">{exp.company}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>{exp.start} — {exp.end}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="pl-14">
                                            <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                                Led regional marketing campaigns across MENA. Managed a team of 5 performance marketers and increased inbound lead generation by 45% YoY.
                                            </p>
                                            <Button variant="outline" size="sm" className="border-slate-700 hover:bg-slate-800 text-slate-300">
                                                Edit Details
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Other Tabs Placeholder */}
                    {['education', 'skills', 'preferences'].includes(activeTab) && (
                        <Card className="bg-slate-900 border-slate-800 border-dashed animate-in fade-in duration-500">
                            <CardContent className="p-16 text-center flex flex-col items-center justify-center">
                                <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Lightbulb className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">Build {tabs.find(t => t.id === activeTab)?.label} Form</h3>
                                <p className="text-slate-400 max-w-sm">
                                    This tab is part of the extensive candidate profile builder and follows the same premium UI patterns as Personal Info.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    )
}
