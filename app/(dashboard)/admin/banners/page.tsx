"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, Upload, Trash2, Eye, EyeOff } from "lucide-react";
import {
  useListAllPromoBanners,
  useUploadPromoBanner,
  useDeletePromoBanner,
  useTogglePromoBannerActive,
} from "@/lib/hooks/useAdmin";
import { colleges, departmentsFor } from "@/lib/constants/academic";
import { Card, Skeleton, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PromoBanner, isBannerUniversityWide } from "@/lib/types/models";

const allowedExt = ["jpg", "jpeg", "png"];

export default function PromoBannerManagementPage() {
  const router = useRouter();
  const list = useListAllPromoBanners();
  const upload = useUploadPromoBanner();
  const remove = useDeletePromoBanner();
  const toggle = useTogglePromoBannerActive();
  const fileRef = useRef<HTMLInputElement>(null);

  const [banners, setBanners] = useState<PromoBanner[] | null>(null);
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState(""); // فاضي = بانر على مستوى الجامعة
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() { setBanners(await list()); }
  useEffect(() => { load(); }, []);

  function pickFile(f: File | null) {
    setMessage(null);
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExt.includes(ext)) {
      setMessage("الامتدادات المسموحة فقط: jpg, jpeg, png");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit() {
    if (!college || !file) return;
    setUploading(true);
    const res = await upload({ file, universityId: college, departmentId: department });
    setUploading(false);
    if (res.ok) {
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setMessage("تم رفع الصورة الإعلانية بنجاح");
      await load();
    } else {
      setMessage(res.error ?? "تعذّر الرفع");
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h1 className="text-2xl font-extrabold text-text-primary">إدارة الصور الإعلانية</h1>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-bold text-text-primary">رفع صورة إعلانية جديدة</p>
        <div className="grid grid-cols-2 gap-3">
          <select value={college} onChange={(e) => { setCollege(e.target.value); setDepartment(""); }} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
            <option value="">الكلية / الجامعة</option>
            {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} disabled={!college} className="h-11 rounded-input border border-border bg-white px-3 text-sm disabled:opacity-50">
            <option value="">كل الجامعة (بدون قسم محدد)</option>
            {departmentsFor(college).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} className="text-sm" />

        {preview && (
          <div className="relative h-40 w-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        {message && <p className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary">{message}</p>}

        <Button disabled={!college || !file} loading={uploading} onClick={submit} className="w-full">
          <Upload size={16} /> رفع الصورة
        </Button>
      </Card>

      <div>
        <p className="mb-3 text-sm font-bold text-text-primary">الصور الحالية ({banners?.length ?? "…"})</p>
        {banners === null ? (
          <Skeleton className="h-40 w-full" />
        ) : banners.length === 0 ? (
          <Card hover={false}><EmptyState title="ماكو صور إعلانية بعد" /></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banners.map((b) => (
              <Card key={b.id} hover={false} className="overflow-hidden p-0">
                <div className="relative h-32 w-full">
                  <Image src={b.imageUrl} alt="" fill className="object-cover" />
                  {!b.active && <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-bold text-white">معطّل</div>}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-text-primary">{b.universityId}</p>
                  <p className="text-[11px] text-text-secondary">{isBannerUniversityWide(b) ? "كل الجامعة" : b.departmentId}</p>
                  <div className="mt-2 flex justify-end gap-3">
                    <button onClick={async () => { await toggle(b); load(); }} className="text-text-secondary">
                      {b.active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={async () => { if (confirm("حذف هذي الصورة؟")) { await remove(b); load(); } }} className="text-status-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
