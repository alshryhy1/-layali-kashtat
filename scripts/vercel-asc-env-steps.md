# تفعيل ASC على Vercel Production

`.env.local` وملفات `~/.appstoreconnect/` تعمل على جهازك فقط.
خادم الإنتاج (`www.layalikashtat.com`) يقرأ متغيرات بيئة Vercel فقط.

## المطلوب في Vercel → Project → Settings → Environment Variables

فعّل البيئة **Production** (و Preview إن أردت) لكل متغير:

| Name | Value |
|------|--------|
| `ASC_APP_ID` | `6771470757` |
| `ASC_KEY_ID` | Key ID من App Store Connect (مثل `4YKBA4J797`) |
| `ASC_ISSUER_ID` | Issuer UUID من Integrations → App Store Connect API |
| `ASC_PRIVATE_KEY` | **محتوى** ملف `AuthKey_….p8` كاملاً (بما فيها سطور BEGIN/END) |

لا تستخدم مسار ملف (`/Users/...` أو `~/.appstoreconnect/...`) على Vercel — القرص غير موجود هناك.

### لصق المفتاح متعدد الأسطر
1. افتح `AuthKey_XXXX.p8` في محرر نصوص.
2. انسخ الكل.
3. في Vercel اختر نوع القيمة **Sensitive** إن وُجد، والصق كما هو (أسطر متعددة).
4. إن طلب النظام سطراً واحداً: استبدل الأسطر بـ `\n` داخل علامات اقتباس.

## بعد الحفظ
1. Deployments → أحدث نشر → **⋯ → Redeploy**
2. افتح `/ar/admin/reports` وحدّث الصفحة
3. أو تحقق من `/api/admin/app-store-metrics` وأنت مسجّل كأدمن: يجب أن يكون `setup.configured: true` و`missing: []`

## CLI (اختياري إن كان `vercel` مربوطاً ومسجّلاً)
```bash
cd /path/to/Layali-Kashtat-App
npx vercel link
printf '%s' '6771470757' | npx vercel env add ASC_APP_ID production
printf '%s' 'YOUR_KEY_ID' | npx vercel env add ASC_KEY_ID production
printf '%s' 'YOUR_ISSUER_UUID' | npx vercel env add ASC_ISSUER_ID production
# للمفتاح: انسخ محتوى .p8 ثم:
npx vercel env add ASC_PRIVATE_KEY production
npx vercel --prod
```

لا تضع أسرار ASC في git.
