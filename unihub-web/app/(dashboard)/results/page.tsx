"use client";

import { motion } from "framer-motion";
import { GraduationCap, FileWarning } from "lucide-react";
import { useMyGrades } from "@/lib/hooks/useGrades";
import { Card, Skeleton, EmptyState, Badge } from "@/components/ui/primitives";
import { gradeSheetMaxTotal, gradeSheetTotalFor } from "@/lib/types/models";

function scoreTone(percent: number): "success" | "warning" | "danger" {
  if (percent >= 60) return "success";
  if (percent >= 50) return "warning";
  return "danger";
}

export default function ResultsPage() {
  const { results, loading } = useMyGrades();

  const withSheet = results.filter((r) => r.sheet);
  const withoutSheet = results.filter((r) => !r.sheet);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary">النتائج</h2>
        <p className="text-text-secondary">درجاتك في كل مادة، محسوبة بنفس نظام التقييم المعتمد من الدكتور.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : results.length === 0 ? (
        <Card hover={false}>
          <EmptyState icon={<GraduationCap size={40} />} title="لا توجد مواد مسجّلة بعد" />
        </Card>
      ) : (
        <>
          {withSheet.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {withSheet.map((r, idx) => {
                const sheet = r.sheet!;
                const record = r.record!;
                const total = gradeSheetTotalFor(sheet, record);
                const maxTotal = gradeSheetMaxTotal(sheet);
                const percent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

                return (
                  <motion.div
                    key={r.subjectId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03, ease: "easeInOut" }}
                  >
                    <Card>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-text-primary">{r.subjectName}</p>
                          <p className="text-xs text-text-secondary">
                            {sheet.system === "semester" ? "نظام فصلي (متوسط الفصلين)" : "نظام كورس"}
                          </p>
                        </div>
                        <Badge tone={scoreTone(percent)}>
                          {total.toFixed(1)} / {maxTotal}
                        </Badge>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        {sheet.components.map((c) => (
                          <div key={c.key} className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">{c.label}</span>
                            <span className="font-semibold text-text-primary">
                              {(record.scores[c.key] ?? 0).toFixed(1)} / {c.maxScore}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percent, 100)}%` }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="h-full brand-gradient"
                        />
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {withoutSheet.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileWarning size={18} className="text-text-secondary" />
                <h3 className="text-sm font-bold text-text-secondary">مواد لم تُرفع درجاتها بعد</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {withoutSheet.map((r) => (
                  <Badge key={r.subjectId} tone="neutral">{r.subjectName}</Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
