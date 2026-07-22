# UniHub Web — المرحلة 1

موقع Next.js 15 / React 19 / TypeScript / Tailwind يعيد بناء واجهة تطبيق UniHub
(Flutter) على نفس مشروع Firebase الحالي (`my-university-cc6bc`) بدون أي تغيير
في الـ Collections أو الـ Security Rules أو منطق العمل.

## ✅ ما تم إنجازه في هذه المرحلة

- **البنية الأساسية**: Next.js 15 App Router + TypeScript + Tailwind، جاهزة للتشغيل والبناء (تم اختبار `npm run build` بنجاح).
- **Firebase**: نفس المشروع، نفس الإعدادات (`lib/firebase/client.ts`)، بما فيها persistence مطابق لإعدادات Flutter.
- **Supabase Storage**: نفس الـ buckets المستخدمة في تطبيق Flutter للملفات والبانرات (`lib/firebase/storage.ts`).
- **طبقة الأنواع (Types)**: `lib/types/models.ts` تطابق حرفيًا `models.dart` (نفس أسماء حقول Firestore، نفس منطق `GradeSheet.totalFor`/`maxTotal`، نفس `gradeSheetId`).
- **الثوابت الأكاديمية**: `lib/constants/academic.ts` — نفس قائمة الكليات/الأقسام/تجاوزات عدد المراحل الموجودة في `app_state.dart` حرفيًا.
- **المصادقة**: `lib/hooks/useAuth.tsx` — يطابق `login`/`signUp`/`_tryLoadInstructor`/`_loadOrCreateProfile` في `app_state.dart` (بما في ذلك التحقق من كولكشن `instructors` أولاً قبل `students`).
- **Realtime Sync**: كل الشاشات تستخدم `onSnapshot` (وليس fetch لمرة واحدة) — أي تغيير من تطبيق Flutter يظهر فورًا في الموقع والعكس صحيح، دون أي طبقة وسيطة.
- **Design System**: الألوان/التدرج/الظلال/الحواف/الخطوط (Cairo + Inter)/الحركات بالضبط كما في المواصفات (`tailwind.config.ts`, `app/globals.css`).
- **مكونات UI أساسية قابلة لإعادة الاستخدام**: `Button`, `Card`, `Input`, `Badge`, `Skeleton`, `EmptyState`, `ErrorState`.
- **Layout احترافي**: Sidebar + Top Nav + Dashboard Shell متجاوب بالكامل (`components/layout/*`).
- **شاشات مكتملة بمنطق مطابق 100% لـ Flutter**:
  - `/login` — تسجيل الدخول/إنشاء حساب، مع التوجيه الصحيح (طالب/تدريسي/onboarding).
  - `/home` — لوحة التحكم: بانرات ترويجية (نفس دمج university-wide + department)، شبكة المواد، الإعلانات (نفس دمج الـ 3 مصادر وفلترة stage/section/study_type).
  - `/schedule` — الجدول الأسبوعي (نفس فرز dayOfWeek)، الواجبات، الامتحانات (بما فيها حالة "مؤجل").
  - `/results` — الدرجات لكل مادة، بنفس معادلة `GradeSheet.totalFor` (بما فيها معادلة متوسط الفصلين في نظام "فصلي").

## 🚧 المرحلة القادمة (بحسب اختيارك: شاشات الطالب أولاً)

الشاشات التالية موجودة الآن كصفحات "Coming Soon" فقط لضمان عمل التنقل، وسأبنيها بنفس الدقة تباعًا:
`/search` (تصفح الملفات)، `/subjects/[id]` (ملفات المادة + تقييم + تعليقات)، `/announcements`، `/notifications`، `/profile`، `/onboarding`، ثم لاحقًا شاشات المحاضر والأدمن.

## التشغيل محليًا

```bash
npm install
npm run dev
```

## ملاحظة عن Supabase

قيم `.env.local` الخاصة بـ Supabase منقولة فعليًا من `supabase_config.dart` في مشروع Flutter (نفس الـ buckets: `files`, `promo_banners`) — لا حاجة لإنشاء مشروع جديد.

## ملاحظة أمنية

مفاتيح Firebase الموجودة في `.env.local` هي Web API Keys وهي ليست سرّية بطبيعتها (Firebase تعتمد على Security Rules للحماية وليس إخفاء المفتاح) — لكنها موضوعة في env vars كأفضل ممارسة. لم يتم تغيير أي Security Rule.
