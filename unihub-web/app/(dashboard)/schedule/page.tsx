"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, ClipboardList, AlarmClock, CalendarX2 } from "lucide-react";
import { useScheduleStream, useHomeworkStream, useExamStream } from "@/lib/hooks/useSchedule";
import { Card, Skeleton, EmptyState, Badge } from "@/components/ui/primitives";
import { dayNames } from "@/lib/constants/academic";

function formatDate(d: Date) {
  return d.toLocaleDateString("ar-IQ", { weekday: "long", day: "numeric", month: "long" });
}

export default function SchedulePage() {
  const { schedule, loading: scheduleLoading } = useScheduleStream();
  const { homework, loading: hwLoading } = useHomeworkStream();
  const { exams, loading: examLoading } = useExamStream();

  // تجميع الجدول حسب اليوم (1..7)، نفس ترتيب dayOfWeek في Dart
  const byDay: Record<number, typeof schedule> = {};
  for (const item of schedule) {
    (byDay[item.dayOfWeek] ??= []).push(item);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary">الجدول الأسبوعي</h2>
        <p className="text-text-secondary">محاضراتك الأسبوعية، واجباتك، وامتحاناتك القادمة.</p>
      </div>

      {/* الجدول الأسبوعي */}
      {scheduleLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : schedule.length === 0 ? (
        <Card hover={false}>
          <EmptyState icon={<CalendarX2 size={40} />} title="لا توجد محاضرات بجدولك بعد" />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {[1, 2, 3, 4, 5, 6, 7].filter((d) => byDay[d]?.length).map((day) => (
            <div key={day}>
              <h3 className="mb-3 text-sm font-bold text-text-secondary">{dayNames[day]}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {byDay[day].map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03, ease: "easeInOut" }}
                  >
                    <Card className="h-full">
                      <p className="font-bold text-text-primary">{item.subjectName}</p>
                      <p className="text-sm text-text-secondary">{item.professorName}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
                        <Clock size={14} /> {item.startTime} – {item.endTime}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                        <MapPin size={14} /> {item.room || "غير محدد"}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* الواجبات */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-primary" />
            <h3 className="text-lg font-bold">الواجبات القادمة</h3>
          </div>
          {hwLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : homework.length === 0 ? (
            <Card hover={false}><EmptyState title="لا توجد واجبات قادمة" /></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {homework.map((h) => (
                <Card key={h.id} hover={false} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{h.title}</p>
                    <p className="text-sm text-text-secondary">{h.subjectName}</p>
                  </div>
                  <Badge tone="warning">{formatDate(h.dueDate)}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* الامتحانات */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlarmClock size={20} className="text-primary" />
            <h3 className="text-lg font-bold">الامتحانات القادمة</h3>
          </div>
          {examLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : exams.length === 0 ? (
            <Card hover={false}><EmptyState title="لا توجد امتحانات قادمة" /></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {exams.map((e) => (
                <Card key={e.id} hover={false} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-sm text-text-secondary">{e.subjectName} · قاعة {e.room || "—"}</p>
                    {e.postponed && <p className="text-xs text-status-warning mt-1">مؤجل{e.postponedNote ? `: ${e.postponedNote}` : ""}</p>}
                  </div>
                  <Badge tone={e.postponed ? "warning" : "danger"}>{formatDate(e.examDate)}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
