'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, User, FileText, Briefcase, GraduationCap, Wrench, Globe, FolderOpen, Award, Trophy, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { CvData, CvWorkExperience, CvEducation, CvSkill, CvLanguageEntry, CvProject, CvCertification, CvAward, CustomSection, CustomSectionItem } from '@/types/cv'

interface CvFormStepsProps {
  formData: CvData
  onChange: (data: CvData) => void
}

// --- Collapsible Section Wrapper ---
function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  count,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gold/10 rounded-xl overflow-hidden bg-navy-light">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-navy-lighter/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gold/10">
            <Icon className="h-4 w-4 text-gold" />
          </div>
          <span className="font-medium text-cream">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-cream-dark/40" />
        ) : (
          <ChevronDown className="h-4 w-4 text-cream-dark/40" />
        )}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-gold/10 pt-4">{children}</div>}
    </div>
  )
}

// --- Field helpers ---
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-cream-dark/70 text-sm mb-1.5 block">{label}</Label>
      {children}
    </div>
  )
}

const inputClass =
  'bg-navy-lighter border-gold/10 text-cream placeholder:text-cream-dark/25 focus:border-gold/30 focus:ring-1 focus:ring-gold/20'

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-gold/70 hover:text-gold border border-dashed border-gold/20 rounded-lg px-4 py-2.5 w-full justify-center hover:border-gold/40 hover:bg-gold/5 transition-all"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-lg text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}

export default function CvFormSteps({ formData, onChange }: CvFormStepsProps) {
  const update = (partial: Partial<CvData>) => onChange({ ...formData, ...partial })

  // --- Array Helpers ---
  const addExperience = () =>
    update({
      experience: [...formData.experience, { title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }],
    })
  const updateExperience = (i: number, partial: Partial<CvWorkExperience>) =>
    update({ experience: formData.experience.map((x, idx) => (idx === i ? { ...x, ...partial } : x)) })
  const removeExperience = (i: number) =>
    update({ experience: formData.experience.filter((_, idx) => idx !== i) })

  const addEducation = () =>
    update({ education: [...formData.education, { institution: '', degree: '', field: '', gradDate: '', gpa: '' }] })
  const updateEducation = (i: number, partial: Partial<CvEducation>) =>
    update({ education: formData.education.map((x, idx) => (idx === i ? { ...x, ...partial } : x)) })
  const removeEducation = (i: number) =>
    update({ education: formData.education.filter((_, idx) => idx !== i) })

  const addSkill = () => update({ skills: [...formData.skills, { name: '' }] })
  const updateSkill = (i: number, name: string) =>
    update({ skills: formData.skills.map((x, idx) => (idx === i ? { name } : x)) })
  const removeSkill = (i: number) =>
    update({ skills: formData.skills.filter((_, idx) => idx !== i) })

  const addLanguage = () => update({ languages: [...formData.languages, { name: '', proficiency: '' }] })
  const updateLanguage = (i: number, partial: Partial<CvLanguageEntry>) =>
    update({ languages: formData.languages.map((x, idx) => (idx === i ? { ...x, ...partial } : x)) })
  const removeLanguage = (i: number) =>
    update({ languages: formData.languages.filter((_, idx) => idx !== i) })

  const addProject = () => update({ projects: [...formData.projects, { name: '', date: '', description: '', link: '' }] })
  const updateProject = (i: number, partial: Partial<CvProject>) =>
    update({ projects: formData.projects.map((x, idx) => (idx === i ? { ...x, ...partial } : x)) })
  const removeProject = (i: number) =>
    update({ projects: formData.projects.filter((_, idx) => idx !== i) })

  const addCertification = () =>
    update({ certifications: [...formData.certifications, { name: '', org: '', date: '', link: '' }] })
  const updateCertification = (i: number, partial: Partial<CvCertification>) =>
    update({ certifications: formData.certifications.map((x, idx) => (idx === i ? { ...x, ...partial } : x)) })
  const removeCertification = (i: number) =>
    update({ certifications: formData.certifications.filter((_, idx) => idx !== i) })

  const addAward = () => update({ awards: [...formData.awards, { name: '', org: '', year: '' }] })
  const updateAward = (i: number, partial: Partial<CvAward>) =>
    update({ awards: formData.awards.map((x, idx) => (idx === i ? { ...x, ...partial } : x)) })
  const removeAward = (i: number) =>
    update({ awards: formData.awards.filter((_, idx) => idx !== i) })

  const addCustomSection = () => {
    const id = `custom-${Date.now()}`
    update({ customSections: [...formData.customSections, { id, title: '', items: [] }] })
  }
  const updateCustomSection = (i: number, partial: Partial<CustomSection>) =>
    update({ customSections: formData.customSections.map((x, idx) => (idx === i ? { ...x, ...partial } : x)) })
  const removeCustomSection = (i: number) =>
    update({ customSections: formData.customSections.filter((_, idx) => idx !== i) })
  const addCustomItem = (sectionIdx: number) => {
    const section = formData.customSections[sectionIdx]
    updateCustomSection(sectionIdx, {
      items: [...section.items, { title: '', description: '', fields: [] }],
    })
  }
  const updateCustomItem = (sectionIdx: number, itemIdx: number, partial: Partial<CustomSectionItem>) => {
    const section = formData.customSections[sectionIdx]
    updateCustomSection(sectionIdx, {
      items: section.items.map((x, idx) => (idx === itemIdx ? { ...x, ...partial } : x)),
    })
  }
  const removeCustomItem = (sectionIdx: number, itemIdx: number) => {
    const section = formData.customSections[sectionIdx]
    updateCustomSection(sectionIdx, {
      items: section.items.filter((_, idx) => idx !== itemIdx),
    })
  }

  return (
    <div className="space-y-4">
      {/* 1. Personal Info */}
      <Section title="المعلومات الشخصية" icon={User} defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="الاسم الكامل *">
            <Input className={inputClass} placeholder="أحمد محمد" value={formData.fullName} onChange={(e) => update({ fullName: e.target.value })} />
          </FormField>
          <FormField label="المسمى الوظيفي *">
            <Input className={inputClass} placeholder="مطور برمجيات أول" value={formData.jobTitle} onChange={(e) => update({ jobTitle: e.target.value })} />
          </FormField>
          <FormField label="البريد الإلكتروني *">
            <Input className={inputClass} type="email" placeholder="ahmed@example.com" value={formData.email} onChange={(e) => update({ email: e.target.value })} />
          </FormField>
          <FormField label="رقم الهاتف">
            <Input className={inputClass} type="tel" placeholder="+971 50 123 4567" value={formData.phone} onChange={(e) => update({ phone: e.target.value })} />
          </FormField>
          <FormField label="الموقع">
            <Input className={inputClass} placeholder="دبي، الإمارات" value={formData.location} onChange={(e) => update({ location: e.target.value })} />
          </FormField>
          <FormField label="LinkedIn">
            <Input className={inputClass} placeholder="https://linkedin.com/in/..." value={formData.linkedin} onChange={(e) => update({ linkedin: e.target.value })} />
          </FormField>
        </div>
      </Section>

      {/* 2. Summary */}
      <Section title="الملخص المهني" icon={FileText} defaultOpen>
        <textarea
          value={formData.summary}
          onChange={(e) => update({ summary: e.target.value })}
          placeholder="اكتب ملخصاً مهنياً مختصراً يبرز خبراتك ومهاراتك الرئيسية..."
          rows={4}
          className={`w-full rounded-md px-3 py-2 text-sm resize-none ${inputClass}`}
        />
      </Section>

      {/* 3. Experience */}
      <Section title="الخبرة المهنية" icon={Briefcase} count={formData.experience.length} defaultOpen>
        {formData.experience.map((exp, i) => (
          <div key={i} className="p-4 rounded-lg bg-navy/50 border border-gold/5 space-y-3 relative group">
            <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <RemoveButton onClick={() => removeExperience(i)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="المسمى الوظيفي">
                <Input className={inputClass} placeholder="مطور برمجيات" value={exp.title} onChange={(e) => updateExperience(i, { title: e.target.value })} />
              </FormField>
              <FormField label="الشركة">
                <Input className={inputClass} placeholder="اسم الشركة" value={exp.company} onChange={(e) => updateExperience(i, { company: e.target.value })} />
              </FormField>
              <FormField label="الموقع">
                <Input className={inputClass} placeholder="دبي، الإمارات" value={exp.location} onChange={(e) => updateExperience(i, { location: e.target.value })} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="من">
                  <Input className={inputClass} type="month" value={exp.startDate} onChange={(e) => updateExperience(i, { startDate: e.target.value })} />
                </FormField>
                <FormField label="إلى">
                  <Input className={inputClass} type="month" value={exp.endDate} disabled={exp.current} placeholder={exp.current ? 'حتى الآن' : ''} onChange={(e) => updateExperience(i, { endDate: e.target.value })} />
                </FormField>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-cream-dark/50 cursor-pointer">
              <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(i, { current: e.target.checked, endDate: '' })} className="rounded border-gold/20" />
              أعمل هنا حالياً
            </label>
            <FormField label="الوصف">
              <textarea
                value={exp.description}
                onChange={(e) => updateExperience(i, { description: e.target.value })}
                placeholder="صف إنجازاتك ومسؤولياتك..."
                rows={3}
                className={`w-full rounded-md px-3 py-2 text-sm resize-none ${inputClass}`}
              />
            </FormField>
          </div>
        ))}
        <AddButton onClick={addExperience} label="إضافة خبرة مهنية" />
      </Section>

      {/* 4. Education */}
      <Section title="التعليم" icon={GraduationCap} count={formData.education.length}>
        {formData.education.map((edu, i) => (
          <div key={i} className="p-4 rounded-lg bg-navy/50 border border-gold/5 space-y-3 relative group">
            <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <RemoveButton onClick={() => removeEducation(i)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="المؤسسة التعليمية">
                <Input className={inputClass} placeholder="جامعة الإمارات" value={edu.institution} onChange={(e) => updateEducation(i, { institution: e.target.value })} />
              </FormField>
              <FormField label="الدرجة العلمية">
                <Input className={inputClass} placeholder="بكالوريوس" value={edu.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} />
              </FormField>
              <FormField label="التخصص">
                <Input className={inputClass} placeholder="علوم الحاسوب" value={edu.field} onChange={(e) => updateEducation(i, { field: e.target.value })} />
              </FormField>
              <FormField label="تاريخ التخرج">
                <Input className={inputClass} type="month" value={edu.gradDate} onChange={(e) => updateEducation(i, { gradDate: e.target.value })} />
              </FormField>
              <FormField label="المعدل (اختياري)">
                <Input className={inputClass} placeholder="3.8 / 4.0" value={edu.gpa} onChange={(e) => updateEducation(i, { gpa: e.target.value })} />
              </FormField>
            </div>
          </div>
        ))}
        <AddButton onClick={addEducation} label="إضافة مؤهل تعليمي" />
      </Section>

      {/* 5. Skills */}
      <Section title="المهارات" icon={Wrench} count={formData.skills.length}>
        <div className="flex flex-wrap gap-2">
          {formData.skills.map((skill, i) => (
            <div key={i} className="flex items-center gap-1 bg-navy/50 border border-gold/10 rounded-lg px-3 py-1.5 group">
              <input
                value={skill.name}
                onChange={(e) => updateSkill(i, e.target.value)}
                placeholder="مهارة..."
                className="bg-transparent text-sm text-cream placeholder:text-cream-dark/25 outline-none w-24 min-w-0"
              />
              <button
                type="button"
                onClick={() => removeSkill(i)}
                className="text-cream-dark/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <AddButton onClick={addSkill} label="إضافة مهارة" />
      </Section>

      {/* 6. Languages */}
      <Section title="اللغات" icon={Globe} count={formData.languages.length}>
        {formData.languages.map((lang, i) => (
          <div key={i} className="flex items-center gap-3 group">
            <Input
              className={`flex-1 ${inputClass}`}
              placeholder="اللغة"
              value={lang.name}
              onChange={(e) => updateLanguage(i, { name: e.target.value })}
            />
            <select
              value={lang.proficiency}
              onChange={(e) => updateLanguage(i, { proficiency: e.target.value })}
              className={`flex-1 rounded-md px-3 py-2 text-sm ${inputClass}`}
            >
              <option value="">مستوى الإتقان</option>
              <option value="native">لغة أم</option>
              <option value="fluent">طليق</option>
              <option value="advanced">متقدم</option>
              <option value="intermediate">متوسط</option>
              <option value="beginner">مبتدئ</option>
            </select>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <RemoveButton onClick={() => removeLanguage(i)} />
            </div>
          </div>
        ))}
        <AddButton onClick={addLanguage} label="إضافة لغة" />
      </Section>

      {/* 7. Projects */}
      <Section title="المشاريع" icon={FolderOpen} count={formData.projects.length}>
        {formData.projects.map((proj, i) => (
          <div key={i} className="p-4 rounded-lg bg-navy/50 border border-gold/5 space-y-3 relative group">
            <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <RemoveButton onClick={() => removeProject(i)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="اسم المشروع">
                <Input className={inputClass} placeholder="تطبيق إدارة المهام" value={proj.name} onChange={(e) => updateProject(i, { name: e.target.value })} />
              </FormField>
              <FormField label="التاريخ">
                <Input className={inputClass} type="month" value={proj.date} onChange={(e) => updateProject(i, { date: e.target.value })} />
              </FormField>
              <FormField label="الرابط (اختياري)">
                <Input className={inputClass} placeholder="https://..." value={proj.link} onChange={(e) => updateProject(i, { link: e.target.value })} />
              </FormField>
            </div>
            <FormField label="الوصف">
              <textarea
                value={proj.description}
                onChange={(e) => updateProject(i, { description: e.target.value })}
                placeholder="وصف مختصر للمشروع..."
                rows={2}
                className={`w-full rounded-md px-3 py-2 text-sm resize-none ${inputClass}`}
              />
            </FormField>
          </div>
        ))}
        <AddButton onClick={addProject} label="إضافة مشروع" />
      </Section>

      {/* 8. Certifications */}
      <Section title="الشهادات المهنية" icon={Award} count={formData.certifications.length}>
        {formData.certifications.map((cert, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3 group">
            <div className="flex-1 min-w-[200px]">
              <FormField label="اسم الشهادة">
                <Input className={inputClass} placeholder="AWS Solutions Architect" value={cert.name} onChange={(e) => updateCertification(i, { name: e.target.value })} />
              </FormField>
            </div>
            <div className="flex-1 min-w-[150px]">
              <FormField label="المنظمة">
                <Input className={inputClass} placeholder="Amazon Web Services" value={cert.org} onChange={(e) => updateCertification(i, { org: e.target.value })} />
              </FormField>
            </div>
            <div className="w-[140px]">
              <FormField label="التاريخ">
                <Input className={inputClass} type="month" value={cert.date} onChange={(e) => updateCertification(i, { date: e.target.value })} />
              </FormField>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity pb-1">
              <RemoveButton onClick={() => removeCertification(i)} />
            </div>
          </div>
        ))}
        <AddButton onClick={addCertification} label="إضافة شهادة" />
      </Section>

      {/* 9. Awards */}
      <Section title="الجوائز والتكريمات" icon={Trophy} count={formData.awards.length}>
        {formData.awards.map((award, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3 group">
            <div className="flex-1 min-w-[200px]">
              <FormField label="الجائزة">
                <Input className={inputClass} placeholder="أفضل مشروع تخرج" value={award.name} onChange={(e) => updateAward(i, { name: e.target.value })} />
              </FormField>
            </div>
            <div className="flex-1 min-w-[150px]">
              <FormField label="المنظمة">
                <Input className={inputClass} placeholder="الجامعة" value={award.org} onChange={(e) => updateAward(i, { org: e.target.value })} />
              </FormField>
            </div>
            <div className="w-[100px]">
              <FormField label="السنة">
                <Input className={inputClass} placeholder="2024" value={award.year} onChange={(e) => updateAward(i, { year: e.target.value })} />
              </FormField>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity pb-1">
              <RemoveButton onClick={() => removeAward(i)} />
            </div>
          </div>
        ))}
        <AddButton onClick={addAward} label="إضافة جائزة" />
      </Section>

      {/* 10. Hobbies */}
      <Section title="الهوايات والاهتمامات" icon={Layers}>
        <textarea
          value={formData.hobbies}
          onChange={(e) => update({ hobbies: e.target.value })}
          placeholder="القراءة، البرمجة، كرة القدم..."
          rows={2}
          className={`w-full rounded-md px-3 py-2 text-sm resize-none ${inputClass}`}
        />
      </Section>

      {/* 11. References */}
      <Section title="المراجع" icon={User}>
        <textarea
          value={formData.references}
          onChange={(e) => update({ references: e.target.value })}
          placeholder="متاحة عند الطلب"
          rows={2}
          className={`w-full rounded-md px-3 py-2 text-sm resize-none ${inputClass}`}
        />
      </Section>

      {/* 12. Custom Sections */}
      {formData.customSections.map((section, si) => (
        <Section key={section.id} title={section.title || 'قسم مخصص'} icon={Layers}>
          <FormField label="عنوان القسم">
            <Input
              className={inputClass}
              placeholder="عنوان القسم المخصص"
              value={section.title}
              onChange={(e) => updateCustomSection(si, { title: e.target.value })}
            />
          </FormField>
          {section.items.map((item, ii) => (
            <div key={ii} className="p-3 rounded-lg bg-navy/50 border border-gold/5 space-y-2 relative group">
              <div className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <RemoveButton onClick={() => removeCustomItem(si, ii)} />
              </div>
              <Input className={inputClass} placeholder="العنوان" value={item.title} onChange={(e) => updateCustomItem(si, ii, { title: e.target.value })} />
              <textarea
                value={item.description}
                onChange={(e) => updateCustomItem(si, ii, { description: e.target.value })}
                placeholder="الوصف"
                rows={2}
                className={`w-full rounded-md px-3 py-2 text-sm resize-none ${inputClass}`}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <AddButton onClick={() => addCustomItem(si)} label="إضافة عنصر" />
            <button
              type="button"
              onClick={() => removeCustomSection(si)}
              className="flex items-center gap-2 text-sm text-rose-400/60 hover:text-rose-400 border border-dashed border-rose-500/20 rounded-lg px-4 py-2.5 hover:border-rose-500/40 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              حذف القسم
            </button>
          </div>
        </Section>
      ))}

      <AddButton onClick={addCustomSection} label="إضافة قسم مخصص" />
    </div>
  )
}
