"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfileActions } from "@/lib/hooks/useProfileData";
import { Card, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default function EditAccountPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { updateAccountName } = useProfileActions();
  const [name, setName] = useState(currentUser?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await updateAccountName(name);
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError(res.error ?? "تعذّر تحديث الاسم");
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h2 className="text-2xl font-extrabold text-text-primary">تعديل بيانات الحساب</h2>

      <Card className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">الاسم</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">البريد الإلكتروني</label>
          <Input value={currentUser?.email ?? ""} disabled className="opacity-60" />
        </div>

        {error && <p className="rounded-xl bg-status-danger/10 px-3 py-2 text-sm text-status-danger">{error}</p>}
        {saved && <p className="rounded-xl bg-status-success/10 px-3 py-2 text-sm text-status-success">تم الحفظ بنجاح</p>}

        <Button onClick={save} loading={saving} className="w-full">حفظ التغييرات</Button>
      </Card>
    </div>
  );
}
