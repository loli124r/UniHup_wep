"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, BookOpen, ClipboardCheck, GraduationCap, FileSpreadsheet, Info, Plus, Clock3 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subjectsByIds, useSubjectsForDepartment, useRequestAdditionalSubjects } from "@/lib/hooks/useInstructor";
import { Card, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Subject } from "@/lib/types/models";

export default function InstructorHomePage() {
  const router = useRouter();
  const { currentInstructor, logout, loading: authLoading, refreshProfile } = useAuth();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [pendingSubjects, setPendingSubjects] = useState<Subject[]>([]);

  const fetchDeptSubjects = useSubjectsForDepartment();
  const requestAdditionalSubjects = useRequestAdditionalSubjects();

  const [addOpen, setAddOpen] = useState(false);
  const [deptSubjects, setDeptSubjects] = useState<Subject[]>([]);
  const [loadingDeptSubjects, setLoadingDeptSubjects] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !currentInstructor) router.replace("/login");
  }, [authLoading, currentInstructor, router]);

  useEffect(() => {
    if (!currentInstructor) return;
    subjectsByIds(currentInstructor.approvedSubjectIds).then(setSubjects);
    const pendingIds = currentInstructor.requestedSubjectIds.filter((id) => !currentInstructor.approvedSubjectIds.includes(id));
    if (pendingIds.length > 0) subjectsByIds(pendingIds).then(setPendingSubjects);
    else setPendingSubjects([]);
  }, [currentInstructor?.id, currentInstructor?.approvedSubjectIds.join(","), currentInstructor?.requestedSubjectIds.join(",")]);

  async function openAddDialog() {
    setAddOpen(true);
    setMessage(null);
    setSelectedIds(new Set());
    if (!currentInstructor) return;
    setLoadingDeptSubjects(true);
    const list = await fetchDeptSubjects(currentInstructor.collegeId, currentInstructor.departmentId);
    // نستثني المواد المعتمدة له أصلاً أو اللي طلبها ولسه بانتظار الموافقة
    const alreadyHandled = new Set([...currentInstructor.approvedSubjectIds, ...currentInstructor.requestedSubjectIds]);
    setDeptSubjects(list.filter((s) => !alreadyHandled.has(s.id)));
    setLoadingDeptSubjects(false);
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submitRequest() {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    const res = await requestAdditionalSubjects(Array.from(selectedIds));
    setSubmitting(false);
    if (res.ok) {
      setAddOpen(false);
      await refreshProfile();
    } else {
      setMessage(res.error ?? "تعذّر إرسال الطلب");
    }
  }

  if (!currentInstructor) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">أهلاً {currentInstructor.name} 👋</h1>
          <p className="text-sm text-text-secondary">موادك المعتمدة</p>
        </div>
        <button
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-text-secondary hover:bg-bg-secondary"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text-primary">موادي</p>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-1.5 rounded-badge border border-primary bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20"
        >
          <Plus size={14} /> إضافة مادة
        </button>
      </div>

      {subjects === null ? (
        <Skeleton className="h-24 w-full" />
      ) : subjects.length === 0 ? (
        <Card hover={false} className="text-sm text-text-secondary">ما عندك مواد معتمدة بعد</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {subjects.map((s) => (
            <Card key={s.id} hover={false} className="flex items-center gap-3 p-4">
              <BookOpen size={18} className="text-primary-blue" />
              <span className="flex-1 text-sm text-text-primary">{s.name}</span>
              <span className="text-xs text-text-secondary">مرحلة {s.stage}</span>
            </Card>
          ))}
        </div>
      )}

      {pendingSubjects.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-status-warning">
            <Clock3 size={13} /> بانتظار موافقة الأدمن
          </p>
          <div className="flex flex-col gap-2">
            {pendingSubjects.map((s) => (
              <Card key={s.id} hover={false} className="flex items-center gap-3 border-status-warning/30 bg-status-warning/5 p-3">
                <BookOpen size={16} className="text-status-warning" />
                <span className="flex-1 text-sm text-text-primary">{s.name}</span>
                <span className="text-[11px] font-semibold text-status-warning">قيد المراجعة</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => router.push("/instructor/attendance")}>
        <Card className="flex items-center gap-3 brand-gradient p-4 text-white shadow-soft">
          <ClipboardCheck size={22} />
          <span className="flex-1 text-right font-bold">أخذ الحضور</span>
        </Card>
      </button>

      <button onClick={() => router.push("/instructor/grades")}>
        <Card hover={false} className="flex items-center gap-3 border-primary-blue/30 p-4">
          <GraduationCap size={22} className="text-primary-blue" />
          <span className="flex-1 text-right font-bold text-text-primary">إدخال الدرجات</span>
        </Card>
      </button>

      <button onClick={() => router.push("/instructor/export")}>
        <Card hover={false} className="flex items-center gap-3 border-primary-blue/30 p-4">
          <FileSpreadsheet size={22} className="text-primary-blue" />
          <span className="flex-1 text-right font-bold text-text-primary">تصدير تقرير Excel</span>
        </Card>
      </button>

      <div className="flex items-start gap-3 rounded-xl bg-primary-blue/10 p-4 text-sm text-text-primary">
        <Info size={18} className="mt-0.5 shrink-0 text-primary-blue" />
        الحضور والدرجات جاهزين. المزيد من الأدوات جاي بإذن الله 🚀
      </div>

      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setAddOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-dialog bg-white p-6 shadow-large"
            >
              <p className="font-bold text-text-primary">طلب تدريس مادة إضافية</p>
              <p className="mt-1 text-xs text-text-secondary">
                اختر مادة أو أكثر من قسمك ({currentInstructor.departmentId}). راح ترسل للأدمن للموافقة قبل ما تظهر بموادك المعتمدة.
              </p>

              <div className="mt-4 max-h-64 overflow-y-auto">
                {loadingDeptSubjects ? (
                  <p className="py-6 text-center text-sm text-text-secondary">جاري التحميل...</p>
                ) : deptSubjects.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-secondary">ماكو مواد إضافية متاحة بقسمك حاليًا</p>
                ) : (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
                    {deptSubjects.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                        <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggle(s.id)} />
                        <div>
                          <p className="text-sm text-text-primary">{s.name}</p>
                          <p className="text-xs text-text-secondary">مرحلة {s.stage}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {message && <p className="mt-3 rounded-xl bg-status-danger/10 px-3 py-2 text-sm text-status-danger">{message}</p>}

              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setAddOpen(false)} className="text-sm font-semibold text-text-secondary">إلغاء</button>
                <Button size="sm" disabled={selectedIds.size === 0} loading={submitting} onClick={submitRequest}>
                  إرسال الطلب ({selectedIds.size})
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
