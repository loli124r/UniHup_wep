"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  BookOpen,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  CalendarDays,
  Clock,
  MapPin,
  ClipboardList,
  AlarmClock,
  ArrowLeft,
  GraduationCap,
  Plus,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSubjects, useAnnouncements, usePromoBanners } from "@/lib/hooks/useHomeData";
import { useScheduleStream, useHomeworkStream, useExamStream } from "@/lib/hooks/useSchedule";
import { useCanManageSchedule } from "@/lib/hooks/useScheduleManage";
import { Card, Skeleton, EmptyState, Badge, ErrorState } from "@/components/ui/primitives";
import { dayNames } from "@/lib/constants/academic";

function formatShort(d: Date) {
  return d.toLocaleDateString("ar-IQ", { day: "numeric", month: "short" });
}

export default function HomePage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { subjects: allSubjects, loading: subjectsLoading } = useSubjects();
  // مطابق لـ subjectsForStage في app_state.dart: كل مواد القسم مُحمّلة، لكن
  // الشاشة تعرض فقط مواد مرحلة الطالب الحالية.
  const subjects = allSubjects.filter((s) => s.stage === (currentUser?.stage ?? 1));
  const { announcements } = useAnnouncements();
  const { banners } = usePromoBanners();
  const { schedule, loading: scheduleLoading, error: scheduleError } = useScheduleStream();
  const { homework, loading: hwLoading, error: hwError } = useHomeworkStream();
  const { exams, loading: examLoading, error: examError } = useExamStream();
  const canManage = useCanManageSchedule();
  const [bannerIndex, setBannerIndex] = useState(0);

  const todayDay = (() => {
    const d = new Date().getDay() + 1;
    return d > 7 ? 1 : d;
  })();
  const todayItems = schedule.filter((s) => s.dayOfWeek === todayDay).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcomingHomework = homework.filter((h) => h.dueDate.getTime() > Date.now() - 86400000).slice(0, 3);
  const upcomingExams = exams.filter((e) => e.examDate.getTime() > Date.now() - 86400000).slice(0, 3);

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
        <h2 className="text-2xl font-extrabold text-text-primary dark:text-dark-textPrimary">
          أهلاً، {currentUser?.name || "طالب"} 👋
        </h2>
        <p className="text-text-secondary dark:text-dark-textSecondary">
          {currentUser?.departmentId} · المرحلة {currentUser?.stage} · شعبة {currentUser?.section}
        </p>
      </motion.div>

      {/* البانرات الإعلانية */}
      {banners.length > 0 && (
        <div className="relative h-44 overflow-hidden rounded-card shadow-soft sm:h-52">
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

      {/* الصف الرئيسي: جدول اليوم + الواجبات/الامتحانات القادمة */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* بطاقة اليوم الكبيرة */}
        <div className="xl:col-span-2">
          <Card className="relative flex h-full flex-col overflow-hidden !p-0">
            <div className="flex items-center justify-between border-b border-border p-5 dark:border-dark-border sm:p-6">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-badge bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <CalendarDays size={13} /> اليوم — {dayNames[todayDay]}
                </span>
              </div>
              <button
                onClick={() => router.push("/schedule")}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                الجدول الكامل <ArrowLeft size={13} />
              </button>
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              {scheduleError ? (
                <ErrorState message={scheduleError} />
              ) : scheduleLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : todayItems.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl brand-gradient text-white shadow-soft">
                    <GraduationCap size={30} />
                  </div>
                  <p className="font-bold text-text-primary dark:text-dark-textPrimary">لا توجد محاضرات مسجّلة بهذا اليوم</p>
                  <p className="max-w-xs text-sm text-text-secondary dark:text-dark-textSecondary">
                    استمتع بيومك! يمكنك استعراض الواجبات والامتحانات القادمة بالجانب.
                  </p>
                  {canManage && (
                    <button
                      onClick={() => router.push("/schedule")}
                      className="mt-2 flex items-center gap-1.5 rounded-btn brand-gradient px-4 py-2 text-xs font-bold text-white shadow-soft"
                    >
                      <Plus size={14} /> إضافة محاضرة
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {todayItems.map((item, idx) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.04 }}>
                      <div className="flex items-center gap-4 rounded-2xl border border-border p-4 transition hover:shadow-soft dark:border-dark-border">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl brand-gradient text-white shadow-soft">
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-text-primary dark:text-dark-textPrimary">{item.subjectName}</p>
                          <p className="truncate text-xs text-text-secondary dark:text-dark-textSecondary">{item.professorName}</p>
                        </div>
                        <div className="shrink-0 text-left">
                          <p className="flex items-center gap-1 text-xs font-bold text-text-primary dark:text-dark-textPrimary">
                            <Clock size={12} /> {item.startTime}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-text-secondary dark:text-dark-textSecondary">
                            <MapPin size={11} /> {item.room || "—"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* الواجبات والامتحانات القادمة */}
        <div className="flex flex-col gap-6">
          <Card className="!p-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <ClipboardList size={17} className="text-primary" />
                <p className="text-sm font-bold text-text-primary dark:text-dark-textPrimary">الواجبات القادمة</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 px-4 pb-2">
              {hwError ? (
                <ErrorState message={hwError} />
              ) : hwLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : upcomingHomework.length === 0 ? (
                <p className="py-4 text-center text-xs text-text-secondary dark:text-dark-textSecondary">لا توجد واجبات قادمة</p>
              ) : (
                upcomingHomework.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-2 rounded-xl bg-bg-secondary/70 p-3 dark:bg-dark-secondary/70">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-text-primary dark:text-dark-textPrimary">{h.title}</p>
                      <p className="truncate text-[11px] text-text-secondary dark:text-dark-textSecondary">{h.subjectName}</p>
                    </div>
                    <Badge tone="warning" className="shrink-0">{formatShort(h.dueDate)}</Badge>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => router.push("/schedule")}
              className="flex w-full items-center justify-center gap-1 border-t border-border py-3 text-xs font-semibold text-primary dark:border-dark-border"
            >
              عرض جميع الواجبات <ChevronRight size={13} />
            </button>
          </Card>

          <Card className="!p-0">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <AlarmClock size={17} className="text-primary" />
                <p className="text-sm font-bold text-text-primary dark:text-dark-textPrimary">الامتحانات القادمة</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 px-4 pb-2">
              {examError ? (
                <ErrorState message={examError} />
              ) : examLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : upcomingExams.length === 0 ? (
                <p className="py-4 text-center text-xs text-text-secondary dark:text-dark-textSecondary">لا توجد امتحانات قادمة</p>
              ) : (
                upcomingExams.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 rounded-xl bg-bg-secondary/70 p-3 dark:bg-dark-secondary/70">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-text-primary dark:text-dark-textPrimary">{e.title}</p>
                      <p className="truncate text-[11px] text-text-secondary dark:text-dark-textSecondary">قاعة {e.room || "—"}</p>
                    </div>
                    <Badge tone={e.postponed ? "warning" : "danger"} className="shrink-0">{formatShort(e.examDate)}</Badge>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => router.push("/schedule")}
              className="flex w-full items-center justify-center gap-1 border-t border-border py-3 text-xs font-semibold text-primary dark:border-dark-border"
            >
              عرض جميع الامتحانات <ChevronRight size={13} />
            </button>
          </Card>
        </div>
      </div>

      {/* المواد والإعلانات */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            <h3 className="text-lg font-bold text-text-primary dark:text-dark-textPrimary">موادي</h3>
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
                  <p className="mt-4 font-bold text-text-primary dark:text-dark-textPrimary">{s.name}</p>
                  <p className="text-xs text-text-secondary dark:text-dark-textSecondary">{s.primaryType}</p>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Megaphone size={20} className="text-primary" />
            <h3 className="text-lg font-bold text-text-primary dark:text-dark-textPrimary">الإعلانات</h3>
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
                    <p className="font-semibold text-text-primary dark:text-dark-textPrimary">{a.title}</p>
                    {a.urgent && <Badge tone="danger">عاجل</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary line-clamp-2 dark:text-dark-textSecondary">{a.message}</p>
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
