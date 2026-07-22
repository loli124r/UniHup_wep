"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { ClipboardCheck, Star, MessageCircle, ChevronLeft } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useSubjectFiles, useMyAttendanceRate } from "@/lib/hooks/useFiles";
import { useMyGradeForSubject } from "@/lib/hooks/useGrades";
import { Card, Skeleton, EmptyState, Badge } from "@/components/ui/primitives";
import { Subject, subjectFromDoc, gradeSheetMaxTotal, gradeSheetTotalFor } from "@/lib/types/models";
import { fileTypeColor } from "@/lib/constants/fileType";
import { cn } from "@/lib/utils";

const filters = ["الكل", "ملخصات", "أسئلة", "محاضرات"] as const;
const filterToType: Record<string, string> = { ملخصات: "ملخص", أسئلة: "أسئلة", محاضرات: "محاضرة" };

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [subjectLoading, setSubjectLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filters)[number]>("الكل");

  const { files, loading: filesLoading } = useSubjectFiles(params.id);
  const attendanceRate = useMyAttendanceRate(params.id);
  const { result: gradeResult } = useMyGradeForSubject(params.id);

  useEffect(() => {
    let active = true;
    (async () => {
      setSubjectLoading(true);
      const snap = await getDoc(doc(db, "subjects", params.id));
      if (active) {
        setSubject(snap.exists() ? subjectFromDoc(snap.id, snap.data()) : null);
        setSubjectLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.id]);

  const visibleFiles = useMemo(() => {
    if (filter === "الكل") return files;
    return files.filter((f) => f.type === filterToType[filter]);
  }, [files, filter]);

  const gradeTotal = gradeResult?.sheet ? gradeSheetTotalFor(gradeResult.sheet, gradeResult.record!) : null;
  const gradeMax = gradeResult?.sheet ? gradeSheetMaxTotal(gradeResult.sheet) : null;

  return (
    <div className="flex flex-col gap-6">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>

      {subjectLoading ? (
        <Skeleton className="h-24 w-full max-w-md" />
      ) : !subject ? (
        <Card hover={false}><EmptyState title="المادة غير موجودة" /></Card>
      ) : (
        <>
          <div>
            <p className="text-sm text-text-secondary">المرحلة {subject.stage} · {subject.filesCount} ملف</p>
            <h2 className="text-2xl font-extrabold text-text-primary">{subject.name}</h2>
          </div>

          <div className="flex flex-col gap-3 max-w-xl">
            {attendanceRate !== null && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold",
                  attendanceRate * 100 >= 75 ? "bg-status-success/10 text-status-success" : "bg-status-danger/10 text-status-danger"
                )}
              >
                <ClipboardCheck size={16} />
                نسبة حضورك بهذي المادة: {Math.round(attendanceRate * 100)}%
              </div>
            )}

            {gradeResult?.sheet && gradeTotal !== null && gradeMax !== null && (
              <div
                className={cn(
                  "rounded-xl p-4",
                  gradeMax === 0 || gradeTotal >= gradeMax / 2 ? "bg-status-success/10" : "bg-status-danger/10"
                )}
              >
                <p
                  className={cn(
                    "flex items-center gap-2 text-sm font-extrabold",
                    gradeMax === 0 || gradeTotal >= gradeMax / 2 ? "text-status-success" : "text-status-danger"
                  )}
                >
                  <Star size={16} /> درجتك: {gradeTotal.toFixed(1)} / {gradeMax.toFixed(0)}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {gradeResult.sheet.components.map((c) => (
                    <span key={c.key} className="text-xs text-text-secondary">
                      {c.label}: {(gradeResult.record!.scores[c.key] ?? 0).toFixed(1)}/{c.maxScore.toFixed(0)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* تبويبات التصنيف */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 rounded-badge border px-4 py-1.5 text-sm font-semibold transition",
                  filter === f ? "brand-gradient text-white border-transparent" : "border-border bg-white text-text-secondary"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* قائمة الملفات */}
          {filesLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : visibleFiles.length === 0 ? (
            <Card hover={false}><EmptyState title="لا توجد ملفات بهذا التصنيف" /></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleFiles.map((f, idx) => {
                const color = fileTypeColor(f.type);
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02, ease: "easeInOut" }}
                  >
                    <Card hover={false} className="cursor-pointer p-4" onClick={() => router.push(`/files/${f.id}`)}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-text-primary">{f.title}</p>
                        <Badge tone="info" className="shrink-0" >
                          <span style={{ color }}>{f.type}</span>
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
                        <span>{f.uploadedByName}</span>
                        <span className="flex items-center gap-1"><Star size={12} className="text-status-warning" /> {f.rating}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={12} /> {f.commentsCount}</span>
                        {!f.approved && <span className="text-status-danger">قيد المراجعة</span>}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
