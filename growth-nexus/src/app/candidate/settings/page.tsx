'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Loader2,
  Key,
  Mail,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function CandidateSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Privacy
  const [isPublic, setIsPublic] = useState(true)

  // Notification preferences (stored in candidates table)
  const [notifications, setNotifications] = useState({
    email_new_jobs: true,
    email_application_updates: true,
    email_messages: true,
    email_marketing: false,
  })

  // Danger zone
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)
      setEmail(user.email || '')

      // Load candidate privacy setting
      const { data: candidate } = await supabase
        .from('candidates')
        .select('is_public, notification_preferences')
        .eq('id', user.id)
        .single()

      if (candidate) {
        setIsPublic(candidate.is_public ?? true)
        if (candidate.notification_preferences) {
          setNotifications(prev => ({ ...prev, ...candidate.notification_preferences }))
        }
      }

      setLoading(false)
    }
    loadSettings()
  }, [])

  // --- Change Password ---
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع حقول كلمة المرور')
      return
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة')
      return
    }

    setChangingPassword(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      toast.error('فشل تغيير كلمة المرور: ' + error.message)
    } else {
      toast.success('تم تغيير كلمة المرور بنجاح')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPassword(false)
  }

  // --- Save Privacy + Notifications ---
  const handleSaveSettings = async () => {
    if (!userId) return
    setSaving(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('candidates')
      .update({
        is_public: isPublic,
        notification_preferences: notifications,
      })
      .eq('id', userId)

    if (error) {
      toast.error('فشل حفظ الإعدادات')
    } else {
      toast.success('تم حفظ الإعدادات بنجاح')
    }
    setSaving(false)
  }

  // --- Delete Account ---
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'حذف حسابي') {
      toast.error('يرجى كتابة "حذف حسابي" للتأكيد')
      return
    }

    const supabase = createClient()

    // Sign out first, then the user would need to contact support for deletion
    // (Supabase doesn't allow self-deletion from client side for security)
    await supabase.auth.signOut()
    toast.success('تم تسجيل الخروج. للحذف النهائي، تواصل مع الدعم الفني.')
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cream flex items-center gap-3">
          <Settings className="h-8 w-8 text-gold" />
          الإعدادات
        </h1>
        <p className="text-cream-dark/50 mt-1">
          إدارة حسابك، الخصوصية، والإشعارات
        </p>
      </div>

      <div className="space-y-6">

        {/* Account Info */}
        <Card className="bg-navy-light border-gold/10">
          <CardHeader>
            <CardTitle className="text-cream flex items-center gap-2">
              <Mail className="h-5 w-5 text-gold" />
              معلومات الحساب
            </CardTitle>
            <CardDescription className="text-cream-dark/40">
              بريدك الإلكتروني المسجل
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-navy/50 border border-gold/5">
              <div>
                <Label className="text-cream-dark/50 text-xs">البريد الإلكتروني</Label>
                <p className="text-cream font-medium">{email}</p>
              </div>
              <Badge className="bg-success/20 text-success">
                <CheckCircle2 className="h-3 w-3 me-1" />
                مفعّل
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="bg-navy-light border-gold/10">
          <CardHeader>
            <CardTitle className="text-cream flex items-center gap-2">
              <Key className="h-5 w-5 text-gold" />
              تغيير كلمة المرور
            </CardTitle>
            <CardDescription className="text-cream-dark/40">
              حافظ على أمان حسابك بتحديث كلمة المرور دورياً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-cream-dark/70 text-sm">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-navy-lighter border-gold/10 text-cream placeholder:text-cream-dark/25 pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute top-1/2 end-3 -translate-y-1/2 text-cream-dark/30 hover:text-cream-dark/60"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-cream-dark/70 text-sm">تأكيد كلمة المرور الجديدة</Label>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-navy-lighter border-gold/10 text-cream placeholder:text-cream-dark/25"
                />
              </div>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-yellow-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                كلمة المرور يجب أن تكون 6 أحرف على الأقل
              </p>
            )}
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="bg-gold hover:bg-gold-dark text-navy font-bold disabled:opacity-30"
            >
              {changingPassword ? (
                <><Loader2 className="h-4 w-4 animate-spin me-2" />جارِ التحديث...</>
              ) : (
                'تحديث كلمة المرور'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="bg-navy-light border-gold/10">
          <CardHeader>
            <CardTitle className="text-cream flex items-center gap-2">
              <Shield className="h-5 w-5 text-gold" />
              الخصوصية
            </CardTitle>
            <CardDescription className="text-cream-dark/40">
              تحكم في ظهور ملفك أمام مسؤولي التوظيف
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => setIsPublic(!isPublic)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-gold/10 bg-navy/50 hover:border-gold/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPublic ? 'bg-success/10' : 'bg-cream-dark/10'}`}>
                  {isPublic ? <Globe className="h-5 w-5 text-success" /> : <Lock className="h-5 w-5 text-cream-dark/40" />}
                </div>
                <div className="text-start">
                  <p className="text-cream font-medium">
                    {isPublic ? 'ملفك مرئي للجميع' : 'ملفك مخفي'}
                  </p>
                  <p className="text-xs text-cream-dark/40">
                    {isPublic
                      ? 'يمكن لمسؤولي التوظيف العثور عليك في نتائج البحث'
                      : 'لن يظهر ملفك في نتائج بحث مسؤولي التوظيف'}
                  </p>
                </div>
              </div>
              {isPublic ? (
                <ToggleRight className="h-8 w-8 text-success shrink-0" />
              ) : (
                <ToggleLeft className="h-8 w-8 text-cream-dark/30 shrink-0" />
              )}
            </button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-navy-light border-gold/10">
          <CardHeader>
            <CardTitle className="text-cream flex items-center gap-2">
              <Bell className="h-5 w-5 text-gold" />
              إشعارات البريد الإلكتروني
            </CardTitle>
            <CardDescription className="text-cream-dark/40">
              اختر أنواع الإشعارات التي تريد استقبالها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'email_new_jobs' as const, label: 'وظائف جديدة مطابقة لمهاراتك', desc: 'عند نشر وظيفة تتوافق مع ملفك' },
              { key: 'email_application_updates' as const, label: 'تحديثات طلبات التوظيف', desc: 'عند تغيّر حالة طلبك' },
              { key: 'email_messages' as const, label: 'رسائل جديدة', desc: 'عند استقبال رسالة من صاحب عمل' },
              { key: 'email_marketing' as const, label: 'نصائح وعروض', desc: 'نصائح مهنية وعروض حصرية' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                }
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gold/5 bg-navy/30 hover:border-gold/15 transition-colors"
              >
                <div className="text-start">
                  <p className="text-sm text-cream">{item.label}</p>
                  <p className="text-xs text-cream-dark/30">{item.desc}</p>
                </div>
                {notifications[item.key] ? (
                  <ToggleRight className="h-6 w-6 text-gold shrink-0" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-cream-dark/20 shrink-0" />
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full bg-gold hover:bg-gold-dark text-navy font-bold py-5 text-base shadow-lg shadow-gold/20"
        >
          {saving ? (
            <><Loader2 className="h-5 w-5 animate-spin me-2" />جارِ الحفظ...</>
          ) : (
            'حفظ الإعدادات'
          )}
        </Button>

        {/* Danger Zone */}
        <Card className="bg-navy-light border-rose-500/20">
          <CardHeader>
            <CardTitle className="text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              منطقة الخطر
            </CardTitle>
            <CardDescription className="text-cream-dark/40">
              إجراءات لا يمكن التراجع عنها
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500"
              >
                <Trash2 className="h-4 w-4 me-2" />
                حذف الحساب نهائياً
              </Button>
            ) : (
              <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/5 space-y-3">
                <p className="text-sm text-cream-dark/60">
                  هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف جميع بياناتك بما في ذلك السيرة الذاتية وسجل الطلبات.
                </p>
                <div>
                  <Label className="text-sm text-rose-400 mb-1 block">
                    اكتب &quot;حذف حسابي&quot; للتأكيد
                  </Label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="حذف حسابي"
                    className="bg-navy-lighter border-rose-500/20 text-cream"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'حذف حسابي'}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold disabled:opacity-30"
                  >
                    تأكيد الحذف
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                    className="text-cream-dark/50 hover:text-cream"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
