"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, Megaphone, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSubjects, useAnnouncements, usePromoBanners } from "@/lib/hooks/useHomeData";
import { Card, Skeleton, EmptyState, Badge } from "@/components/ui/primitives";

export default function HomePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { announcements } = useAnnouncements();
  const { banners } = usePromoBanners();
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    if (currentUser && !currentUser.departmentId) router.replace("/onboarding");
  }, [currentUser, router]);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setBannerIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  return (
    <div className="flex flex-col gap-8">
      {/* ترحيب */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <h2 className="text-2xl font-extrabold text-text-primary">
          أهلاً، {currentUser?.name || "طالب"} 👋
        </h2>
        <p className="text-text-secondary">
          {currentUser?.departmentId} · المرحلة {currentUser?.stage} · شعبة {currentUser?.section}
        </p>
      </motion.div>

      {/* البانرات الإعلانية */}
      {banners.length > 0 && (
        <div className="relative h-48 overflow-hidden rounded-card shadow-soft">
          {banners.map((b, i) => (
            <motion.div
              key={b.id}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === bannerIndex ? 1 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Image src={b.imageUrl} alt="" fill className="object-cover" sizes="100vw" priority={i === 0} />
            </motion.div>
          ))}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setBannerIndex((i) => (i - 1 + banners.length) % banners.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 hover:bg-white"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setBannerIndex((i) => (i + 1) % banners.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 hover:bg-white"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* المواد */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            <h3 className="text-lg font-bold">موادي</h3>
          </div>

          {subjectsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <Card hover={false}>
              <EmptyState
                icon={<FolderOpen size={40} />}
                title="لا توجد مواد بعد"
                description="ستظهر مواد قسمك هنا فور إضافتها من طرف الإدارة."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
              {subjects.map((s) => (
                <Card
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/subjects/${s.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl brand-gradient text-white">
                      <BookOpen size={20} />
                    </div>
                    <Badge tone="info">{s.filesCount} ملف</Badge>
                  </div>
                  <p className="mt-4 font-bold text-text-primary">{s.name}</p>
                  <p className="text-xs text-text-secondary">{s.primaryType}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* الإعلانات */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-primary" />
            <h3 className="text-lg font-bold">الإعلانات</h3>
          </div>
          {announcements.length === 0 ? (
            <Card hover={false}>
              <EmptyState title="لا توجد إعلانات حاليًا" />
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {announcements.slice(0, 8).map((a) => (
                <Card key={a.id} hover={false} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-text-primary">{a.title}</p>
                    {a.urgent && <Badge tone="danger">عاجل</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary line-clamp-2">{a.message}</p>
                  <p className="mt-2 text-xs text-text-disabled">{a.authorName}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
