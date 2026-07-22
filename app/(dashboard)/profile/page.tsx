"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  Award,
  Bookmark,
  UserRound,
  BellRing,
  BookOpen,
  Info,
  LogOut,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card } from "@/components/ui/primitives";
import { isSuperAdmin, isDeptAdmin, isAnyAdmin } from "@/lib/types/models";

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const stats = [
    { icon: Upload, label: "ملفات رفعتها", value: currentUser?.uploadsCount ?? 0 },
    { icon: Award, label: "نقاط المساهمة", value: currentUser?.points ?? 0 },
    { icon: Bookmark, label: "ملفات محفوظة", value: currentUser?.savedCount ?? 0 },
  ];

  const tiles: { label: string; icon: any; href?: string; danger?: boolean; onClick?: () => void }[] = [
    { label: "تعديل بيانات الحساب", icon: UserRound, href: "/profile/edit" },
    { label: "إعدادات الإشعارات", icon: BellRing, href: "/profile/notifications" },
    { label: "المواد التي أتابعها", icon: BookOpen, href: "/profile/followed" },
    { label: "عن الموقع", icon: Info, href: "/about" },
  ];

  if (isAnyAdmin(currentUser)) {
    tiles.push({ label: "إدارة المواد", icon: BookOpen, href: "/admin/subjects" });
    tiles.push({ label: "نشر إعلان / تبليغ / امتحان", icon: BellRing, href: "/admin/broadcast" });
  }
  if (isSuperAdmin(currentUser)) {
    tiles.push({ label: "إدارة الأدمن وممثلي الشعب", icon: ShieldCheck, href: "/admin/management" });
    tiles.push({ label: "إدارة الصور الإعلانية", icon: BookOpen, href: "/admin/banners" });
  }

  tiles.push({
    label: "تسجيل الخروج",
    icon: LogOut,
    danger: true,
    onClick: async () => {
      await logout();
      router.replace("/login");
    },
  });

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h2 className="text-2xl font-extrabold text-text-primary">حسابي</h2>

      <Card className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full brand-gradient text-2xl font-bold text-white shadow-soft">
          {currentUser?.name?.charAt(0) || "?"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-text-primary">{currentUser?.name}</p>
            {currentUser?.isClassRep && (
              <span className="rounded-badge bg-status-warning px-2 py-0.5 text-[10px] font-bold text-white">ممثل الشعبة</span>
            )}
            {isSuperAdmin(currentUser) && (
              <span className="rounded-badge bg-primary px-2 py-0.5 text-[10px] font-bold text-white">سوبر أدمن</span>
            )}
            {isDeptAdmin(currentUser) && (
              <span className="rounded-badge bg-status-success px-2 py-0.5 text-[10px] font-bold text-white">أدمن قسم</span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {currentUser?.departmentId} · المرحلة {currentUser?.stage} · شعبة {currentUser?.section}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.2 }}>
            <Card hover={false} className="flex flex-col items-center gap-2 p-4 text-center">
              <s.icon size={20} className="text-primary" />
              <p className="text-lg font-extrabold text-text-primary">{s.value}</p>
              <p className="text-[11px] text-text-secondary">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {currentUser?.isClassRep && (
        <div className="rounded-card border border-status-warning/30 bg-status-warning/10 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-text-primary">
            <ShieldCheck size={16} className="text-status-warning" /> أنت ممثل الشعبة
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            تقدر تنشر إعلانات رسمية لشعبتك. هذا التعيين تم من سوبر أدمن ولا يمكنك إلغاؤه بنفسك.
          </p>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-secondary">إعدادات الحساب</p>
        <Card hover={false} className="divide-y divide-border p-0">
          {tiles.map((t) => (
            <button
              key={t.label}
              onClick={t.onClick ?? (() => router.push(t.href!))}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-right hover:bg-bg-secondary first:rounded-t-card last:rounded-b-card transition"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.danger ? "bg-status-danger/10" : "bg-primary/10"}`}>
                <t.icon size={17} className={t.danger ? "text-status-danger" : "text-primary"} />
              </div>
              <span className={`flex-1 text-sm font-semibold ${t.danger ? "text-status-danger" : "text-text-primary"}`}>{t.label}</span>
              {!t.danger && <ChevronLeft size={18} className="text-text-disabled" />}
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}
