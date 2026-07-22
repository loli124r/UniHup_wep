"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, BookOpen, Megaphone, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfileActions } from "@/lib/hooks/useProfileData";
import { Card } from "@/components/ui/primitives";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[-1.375rem]" : "translate-x-[-0.125rem]"} right-0`}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { updateNotificationPreferences } = useProfileActions();
  const [updating, setUpdating] = useState(false);

  async function update(patch: { notifyNewContent?: boolean; notifyAnnouncements?: boolean; notifyComments?: boolean }) {
    setUpdating(true);
    await updateNotificationPreferences(patch);
    setUpdating(false);
  }

  const items = [
    {
      key: "notifyNewContent" as const,
      icon: BookOpen,
      title: "محتوى جديد",
      subtitle: "إشعار عند إضافة ملخص أو أسئلة أو محاضرة جديدة لمواد قسمك ومرحلتك",
      value: currentUser?.notifyNewContent ?? true,
    },
    {
      key: "notifyAnnouncements" as const,
      icon: Megaphone,
      title: "الإعلانات والتبليغات",
      subtitle: "إشعار عند نشر إعلان رسمي أو تبليغ فوري يخص شعبتك",
      value: currentUser?.notifyAnnouncements ?? true,
    },
    {
      key: "notifyComments" as const,
      icon: MessageCircle,
      title: "التعليقات",
      subtitle: "إشعار عند تعليق جديد على ملف رفعته",
      value: currentUser?.notifyComments ?? true,
    },
  ];

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h2 className="text-2xl font-extrabold text-text-primary">إعدادات الإشعارات</h2>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.key} hover={false} className="flex items-center gap-4 p-4">
            <item.icon size={20} className="text-text-secondary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{item.subtitle}</p>
            </div>
            <Toggle checked={item.value} disabled={updating} onChange={(v) => update({ [item.key]: v })} />
          </Card>
        ))}
      </div>
    </div>
  );
}
