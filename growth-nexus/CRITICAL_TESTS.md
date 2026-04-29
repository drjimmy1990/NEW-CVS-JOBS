# 🧪 Critical Tests — Team Members Feature

> Run these tests **after** executing the SQL migration in Supabase.

---

## Pre-requisites

1. ✅ Migration `20260429020000_company_team_members.sql` executed in Supabase SQL Editor
2. ✅ Dev server running (`npm run dev`)
3. ✅ You have an **owner** account logged in (the account that created the company)
4. ✅ You have a **second account** registered on the platform (candidate or employer)

---

## Test 1: Migration Verification

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Go to Supabase → Table Editor | `company_members` table exists |
| 1.2 | Check `company_members` data | Your owner account auto-populated with `role: 'owner'`, `status: 'active'` |
| 1.3 | Check RLS | RLS is enabled on `company_members` |

---

## Test 2: Team Page Appears

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Login as **owner** | Redirected to employer dashboard |
| 2.2 | Look at sidebar | "فريق العمل" link visible between "التوطين" and "إعدادات الشركة" |
| 2.3 | Click "فريق العمل" | Team page loads at `/employer/team` |
| 2.4 | Check members list | Owner appears with 👑 "مالك" badge |
| 2.5 | Check invite form | Email input + role selector + "إضافة" button visible |
| 2.6 | Check role cards | 4 role cards shown (مالك, مدير, عضو, مراقب) |

---

## Test 3: Invite — Email NOT Registered

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | In invite form, enter `nonexistent@test.com` | — |
| 3.2 | Select role "عضو" | — |
| 3.3 | Click "إضافة" | ❌ Red toast: "لم يتم العثور على مستخدم بهذا البريد الإلكتروني. يجب أن يكون لديه حساب مسجل أولاً." |
| 3.4 | Check members list | No new member added |

---

## Test 4: Invite — Employer Email (Normal Case)

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Register a second account with role `employer` (or use existing) | Note the email |
| 4.2 | In invite form, enter that email | — |
| 4.3 | Select role "عضو" | — |
| 4.4 | Click "إضافة" | ✅ Green toast: "تمت إضافة [name] إلى الفريق بصلاحية member" |
| 4.5 | Check members list | New member appears with 🛡️ "عضو" badge |
| 4.6 | **Login as that second account** | `/employer/dashboard` loads showing the SAME company data |
| 4.7 | Navigate to `/employer/jobs` | Same jobs visible as owner |
| 4.8 | Navigate to `/employer/applicants` | Same applicants visible |

---

## Test 5: Invite — Candidate Email (Warning Case) ⚠️

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Use an email registered as `candidate` | Note the email |
| 5.2 | In invite form, enter that candidate email | — |
| 5.3 | Select role "عضو" | — |
| 5.4 | Click "إضافة" | ✅ Green toast: "تمت إضافة [name] إلى الفريق..." |
| 5.5 | **Wait 0.5s** | ⚠️ Yellow/orange warning toast: "هذا الحساب مسجل كمرشح — سيتمكن من الوصول للوحة تحكم الشركة بالإضافة لحسابه كمرشح" |
| 5.6 | Check members list | Candidate appears as team member |
| 5.7 | **Login as that candidate** | Can access `/candidate/applications` (candidate features) |
| 5.8 | Navigate to `/employer/dashboard` | Can ALSO access employer dashboard (team features) |

---

## Test 6: Invite — Duplicate Email

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Try adding the SAME email from Test 4 again | — |
| 6.2 | Click "إضافة" | ❌ Red toast: "هذا المستخدم عضو بالفعل في الفريق" |

---

## Test 7: Remove Member

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | On the member added in Test 4, click 🗑️ trash icon | — |
| 7.2 | Wait for response | ✅ Green toast: "تمت إزالة العضو من الفريق" |
| 7.3 | Check members list | Member disappears |
| 7.4 | **Login as removed member** | `/employer/dashboard` shows "no company" or empty state |

---

## Test 8: Cannot Remove Owner

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Look at owner's row in members list | No 🗑️ trash icon visible (owner cannot be removed) |

---

## Test 9: Re-invite Removed Member

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Enter the email of the member removed in Test 7 | — |
| 9.2 | Click "إضافة" | ✅ Green toast: "تمت إعادة تفعيل العضوية" |
| 9.3 | Check members list | Member reappears |

---

## Test 10: Role Permissions

| Step | Action | Expected |
|------|--------|----------|
| 10.1 | Add a member with role "مراقب" (viewer) | — |
| 10.2 | **Login as viewer** | Can access `/employer/dashboard`, `/employer/jobs`, `/employer/applicants` |
| 10.3 | Navigate to `/employer/team` | Invite form is **hidden** (viewers cannot invite) |
| 10.4 | Navigate to `/employer/evaluate/[id]` | Should NOT be able to submit evaluation (viewer role) |

---

## Test 11: Existing Employer Pages Still Work

| Step | Action | Expected |
|------|--------|----------|
| 11.1 | Login as **owner** | — |
| 11.2 | `/employer/dashboard` | ✅ Stats load correctly |
| 11.3 | `/employer/jobs` | ✅ Jobs list loads |
| 11.4 | `/employer/jobs/new` | ✅ Can create a new job |
| 11.5 | `/employer/applicants` | ✅ Applicants pipeline loads |
| 11.6 | `/employer/analytics` | ✅ Analytics page loads |
| 11.7 | `/employer/settings` | ✅ Company settings load and save |
| 11.8 | `/employer/emiratisation` | ✅ Emiratisation gauge loads |
| 11.9 | `/employer/landing-pages` | ✅ Landing pages list loads |

---

## Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Migration | ⬜ | |
| 2. Team Page | ⬜ | |
| 3. Not Registered | ⬜ | |
| 4. Employer Invite | ⬜ | |
| 5. Candidate Invite (Warning) | ⬜ | |
| 6. Duplicate | ⬜ | |
| 7. Remove | ⬜ | |
| 8. Owner Protected | ⬜ | |
| 9. Re-invite | ⬜ | |
| 10. Role Permissions | ⬜ | |
| 11. Existing Pages | ⬜ | |
