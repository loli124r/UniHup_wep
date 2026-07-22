import { createClient } from "@supabase/supabase-js";

// نفس مشروع Supabase المستخدم في تطبيق Flutter للتخزين فقط
// (Auth + Firestore تبقى بالكامل على Firebase بدون أي تغيير).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const FILES_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_FILES_BUCKET || "files";
export const PROMO_BANNERS_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_PROMO_BANNERS_BUCKET || "promo_banners";

/// يطابق _safeStoragePathSegment في app_state.dart: يستبدل المسافات/الأقواس/
/// الرموز الخاصة بـ "_" حتى يصلح كجزء من مسار Supabase Storage.
export function safeStoragePathSegment(input: string): string {
  const cleaned = input.trim().replace(/[\s()[\]{}/\\?#%&=+:;,]+/g, "_");
  return cleaned.length === 0 ? "x" : cleaned;
}

/// يستخرج مسار الملف داخل الـ bucket من رابط Supabase العلني (نفس منطق
/// _pathFromPublicUrl في app_state.dart)، يُستخدم عند الحذف.
export function pathFromPublicUrl(bucket: string, url: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.substring(i + marker.length);
}
