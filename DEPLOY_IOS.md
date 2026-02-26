# دليل رفع تطبيق "ليالي كشتات" إلى Apple App Store

هذا الدليل يشرح الخطوات المطلوبة لرفع تطبيقك من جهاز Mac باستخدام Xcode.

## 1. المتطلبات الأساسية
*   جهاز Mac مثبت عليه برنامج **Xcode** (من App Store).
*   حساب مطور أبل **Apple Developer Account** (يجب الاشتراك ودفع 99$ سنوياً عبر موقع [developer.apple.com](https://developer.apple.com)).
*   رابط الموقع الحقيقي (يجب أن يعمل الموقع على `https`).

---

## 2. تجهيز المشروع (على جهاز Mac)

بعد نقل ملفات المشروع إلى الماك، افتح الترمينال (Terminal) داخل مجلد المشروع ونفذ:

```bash
npm install
```

### أ) تحديث رابط السيرفر
افتح ملف `capacitor.config.ts` وغير الرابط إلى موقعك الحي:

```typescript
  server: {
    url: 'https://your-domain.com', // ضع رابط موقعك هنا
    cleartext: true
  }
```

ثم نفذ الأمر لتحديث إعدادات iOS:
```bash
npx cap sync
```

### ب) توليد أيقونات التطبيق (اختياري لكن مفضل)
بدلاً من تصميم الأيقونات يدوياً:
1. صمم أيقونة بمقاس `1024x1024` بكسل بصيغة PNG.
2. صمم شاشة بداية (Splash) بمقاس `2732x2732` بكسل.
3. أنشئ مجلداً باسم `assets` في رئيسية المشروع، وداخلة مجلد `resources`.
4. ضع الأيقونة باسم `icon.png` وشاشة البداية باسم `splash.png` داخل المجلد.
5. نفذ الأمر:
```bash
npx capacitor-assets generate --ios
```
سيقوم هذا بإنشاء جميع المقاسات المطلوبة للايفون والايباد تلقائياً.

---

## 3. الإعداد داخل Xcode

افتح المشروع في Xcode بالأمر:
```bash
npx cap open ios
```

### أ) ضبط التوقيع (Signing)
1. في Xcode، اضغط على **App** (أيقونة التطبيق الزرقاء في أعلى اليسار).
2. اختر **Signing & Capabilities**.
3. في خانة **Team**، اضغط **Add Account** وسجل دخول بحساب Apple Developer الخاص بك.
4. تأكد أن **Bundle Identifier** هو `com.layalikashtat.app` (أو الاسم الذي اخترته).

### ب) ضبط اسم التطبيق
1. اذهب إلى تبويب **General**.
2. في خانة **Display Name**، اكتب الاسم الذي سيظهر تحت الأيقونة (مثلاً: "ليالي" أو "Layali").
3. تأكد أن **Version** هو `1.0.0` وأن **Build** هو `1` (يجب زيادة رقم الـ Build في كل مرة ترفع تحديثاً جديداً).

### ج) الأذونات (Privacy Descriptions)
بما أن تطبيقك يستخدم الموقع والكاميرا (للمرفقات)، يجب التأكد من وجود رسائل توضيحية في ملف `Info.plist`:
*   Privacy - Location When In Use Usage Description
*   Privacy - Camera Usage Description
*   Privacy - Photo Library Usage Description
(Capacitor يضيف بعضها افتراضياً، لكن تأكد من كتابة وصف عربي واضح مثل: "نحتاج الوصول للموقع لتحديد مكان الخدمة").

---

## 4. إنشاء التطبيق في App Store Connect

1. اذهب إلى موقع [App Store Connect](https://appstoreconnect.apple.com).
2. اختر **My Apps** ثم علامة (+).
3. اختر **New App**.
4. املأ البيانات:
    *   **Platform:** iOS
    *   **Name:** Layali Kashtat
    *   **Primary Language:** Arabic
    *   **Bundle ID:** اختر `com.layalikashtat.app` من القائمة.
    *   **SKU:** اكتب أي رقم مميز (مثلاً `layali001`).

---

## 5. الرفع (Archiving & Upload)

1. في Xcode، في الشريط العلوي، اختر الجهاز **Any iOS Device (arm64)** بدلاً من المحاكي.
2. من القائمة العلوية: اختر **Product** > **Archive**.
3. انتظر حتى ينتهي البناء (قد يأخذ وقتاً).
4. ستظهر نافذة "Organizer". اختر النسخة التي ظهرت واضغط **Distribute App**.
5. اختر **App Store Connect** > **Upload** > **Next**.
6. اترك الخيارات الافتراضية واضغط **Next** حتى يبدأ الرفع.

---

## 6. النشر والمراجعة

1. بعد نجاح الرفع، عد إلى موقع **App Store Connect**.
2. اذهب لتبويب **TestFlight**. ستجد النسخة "Processing" (تأخذ 10-20 دقيقة).
3. بعد أن تصبح جاهزة، يمكنك إضافتها لتبويب **App Store** وتعبئة بيانات المتجر (صور الشاشة، الوصف، السعر "مجاني").
4. اضغط **Submit for Review**.
5. ستراجع أبل التطبيق (عادة 24-48 ساعة) ثم سيصبح متاحاً للتحميل!
