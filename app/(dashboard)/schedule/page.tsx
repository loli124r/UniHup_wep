"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, MapPin, Trash2, Plus, ClipboardList, AlarmClock, CalendarX2, X, LayoutGrid, List } from "lucide-react";
import { useScheduleStream, useHomeworkStream, useExamStream } from "@/lib/hooks/useSchedule";
import {
  useCanManageSchedule,
  useResolveScope,
  useAddScheduleItem,
  useAddHomeworkItem,
  useDeleteScheduleItem,
  useDeleteHomeworkItem,
  useDeleteExamItem,
} from "@/lib/hooks/useScheduleManage";
import { useAddExam } from "@/lib/hooks/useAdmin";
import { useAuth } from "@/lib/hooks/useAuth";
import { colleges, departmentsFor, defaultSections, studyTypes, dayNames } from "@/lib/constants/academic";
import { Card, Skeleton, EmptyState, Badge, Input, ErrorState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatDate(d: Date) {
  return d.toLocaleDateString("ar-IQ", { weekday: "long", day: "numeric", month: "long" });
}

type ManualScope = { departmentId: string; stage: number; section: string; studyType: string };

// نفس ديلوگ اختيار الفئة المستهدفة يدويًا (سوبر أدمن / أدمن قسم بنطاق عام)
function ScopeDialog({ onDone, onCancel }: { onDone: (s: ManualScope) => void; onCancel: () => void }) {
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [stage, setStage] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [studyType, setStudyType] = useState<string | null>(null);

  const canContinue = !!department && !!stage && !!section && !!studyType;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-dialog bg-white p-6 shadow-large"
      >
        <p className="font-bold text-text-primary">حدد الفئة المستهدفة</p>
        <div className="mt-4 flex flex-col gap-3">
          <select value={college} onChange={(e) => { setCollege(e.target.value); setDepartment(""); }} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
            <option value="">الكلية</option>
            {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
            <option value="">القسم</option>
            {departmentsFor(college).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={stage ?? ""} onChange={(e) => setStage(Number(e.target.value) || null)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
            <option value="">المرحلة</option>
            {[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>المرحلة {s}</option>)}
          </select>
          <select value={section ?? ""} onChange={(e) => setSection(e.target.value || null)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
            <option value="">الشعبة</option>
            {defaultSections.map((s) => <option key={s} value={s}>شعبة {s}</option>)}
          </select>
          <select value={studyType ?? ""} onChange={(e) => setStudyType(e.target.value || null)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
            <option value="">نوع الدراسة</option>
            {studyTypes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel} className="text-sm font-semibold text-text-secondary">إلغاء</button>
          <Button size="sm" disabled={!canContinue} onClick={() => onDone({ departmentId: department, stage: stage!, section: section!, studyType: studyType! })}>
            متابعة
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SchedulePage() {
  const { schedule, loading: scheduleLoading, error: scheduleError } = useScheduleStream();
  const { homework, loading: hwLoading, error: hwError } = useHomeworkStream();
  const { exams, loading: examLoading, error: examError } = useExamStream();
  const canManage = useCanManageSchedule();
  const resolveScope = useResolveScope();
  const addScheduleItem = useAddScheduleItem();
  const addHomeworkItem = useAddHomeworkItem();
  const addExam = useAddExam();
  const deleteScheduleItem = useDeleteScheduleItem();
  const deleteHomeworkItem = useDeleteHomeworkItem();
  const deleteExamItem = useDeleteExamItem();

  const todayIsoSunday = new Date().getDay() + 1; // JS: 0=Sunday → نحولها 1=الأحد..7=السبت
  const [selectedDay, setSelectedDay] = useState(todayIsoSunday > 7 ? 1 : todayIsoSunday);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [search, setSearch] = useState("");

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [pendingKind, setPendingKind] = useState<"lecture" | "homework" | "exam" | null>(null);
  const [formOpen, setFormOpen] = useState<"lecture" | "homework" | "exam" | null>(null);
  const [scope, setScope] = useState<ManualScope | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // نماذج الإدخال
  const [subjectName, setSubjectName] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [examTitle, setExamTitle] = useState("");

  const dayItems = useMemo(() => schedule.filter((s) => s.dayOfWeek === selectedDay), [schedule, selectedDay]);
  const filteredDayItems = useMemo(
    () => (search.trim() ? dayItems.filter((i) => i.subjectName.includes(search) || i.room.includes(search) || i.professorName.includes(search)) : dayItems),
    [dayItems, search]
  );
  const filteredSchedule = useMemo(
    () => (search.trim() ? schedule.filter((i) => i.subjectName.includes(search) || i.room.includes(search) || i.professorName.includes(search)) : schedule),
    [schedule, search]
  );
  const scheduleByDay = useMemo(() => {
    const map: Record<number, typeof schedule> = {};
    for (const item of filteredSchedule) (map[item.dayOfWeek] ??= []).push(item);
    for (const d of Object.keys(map)) map[Number(d)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [filteredSchedule]);
  const upcomingHomework = useMemo(() => homework.filter((h) => h.dueDate.getTime() > Date.now() - 86400000), [homework]);
  const upcomingExams = useMemo(() => exams.filter((e) => e.examDate.getTime() > Date.now() - 86400000), [exams]);

  function startAdd(kind: "lecture" | "homework" | "exam") {
    setAddMenuOpen(false);
    setMessage(null);
    const auto = resolveScope();
    if (auto) {
      setScope(auto);
      setFormOpen(kind);
    } else {
      setPendingKind(kind);
      setScopeDialogOpen(true);
    }
  }

  function onScopeChosen(s: ManualScope) {
    setScope(s);
    setScopeDialogOpen(false);
    setFormOpen(pendingKind);
    setPendingKind(null);
  }

  function resetForms() {
    setSubjectName(""); setProfessorName(""); setStartTime("08:00"); setEndTime("09:00"); setRoom("");
    setDueDate(new Date().toISOString().slice(0, 10)); setExamTitle("");
  }

  async function submitLecture() {
    if (!scope || !subjectName.trim()) return;
    setSubmitting(true);
    const res = await addScheduleItem({
      subjectName: subjectName.trim(), professorName: professorName.trim(), departmentId: scope.departmentId,
      stage: scope.stage, section: scope.section, studyType: scope.studyType, dayOfWeek: selectedDay, startTime, endTime, room: room.trim(),
    });
    setSubmitting(false);
    setMessage(res.ok ? "تمت إضافة المحاضرة ✅" : res.error ?? "تعذّر الإضافة");
    if (res.ok) { setFormOpen(null); resetForms(); }
  }

  async function submitHomework() {
    if (!scope || !subjectName.trim()) return;
    setSubmitting(true);
    const res = await addHomeworkItem({
      subjectName: subjectName.trim(), title: professorName.trim() || subjectName.trim(), departmentId: scope.departmentId,
      stage: scope.stage, section: scope.section, studyType: scope.studyType, dueDate: new Date(dueDate),
    });
    setSubmitting(false);
    setMessage(res.ok ? "تمت إضافة الواجب ✅" : res.error ?? "تعذّر الإضافة");
    if (res.ok) { setFormOpen(null); resetForms(); }
  }

  async function submitExam() {
    if (!scope || !examTitle.trim()) return;
    setSubmitting(true);
    const res = await addExam({
      subjectName: subjectName.trim() || examTitle.trim(), title: examTitle.trim(), departmentId: scope.departmentId,
      stage: scope.stage, section: scope.section, studyType: scope.studyType, room: room.trim(), examDate: new Date(dueDate),
    });
    setSubmitting(false);
    setMessage(res.ok ? "تمت إضافة الامتحان ✅" : res.error ?? "تعذّر الإضافة");
    if (res.ok) { setFormOpen(null); resetForms(); }
  }

  return (
    <div className="relative flex flex-col gap-8">
      <div>
        <h2 className="bg-clip-text text-2xl font-extrabold text-transparent brand-gradient">الجدول الذكي</h2>
        <p className="text-text-secondary">محاضراتك الأسبوعية، واجباتك، وامتحاناتك القادمة.</p>
      </div>

      <div className="flex items-center gap-2 rounded-input border border-border bg-white px-4 h-12 max-w-lg shadow-soft">
        <Search size={18} className="text-text-disabled" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن محاضرة، مادة، أو مكان..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {viewMode === "day" &&
            [1, 2, 3, 4, 5, 6, 7].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={cn(
                  "shrink-0 rounded-badge border px-4 py-2 text-xs font-bold transition",
                  selectedDay === d ? "brand-gradient text-white border-transparent shadow-soft" : "border-border bg-white text-text-secondary"
                )}
              >
                {dayNames[d]}
              </button>
            ))}
        </div>
        <div className="flex shrink-0 gap-1 rounded-badge border border-border bg-white p-1">
          <button
            onClick={() => setViewMode("week")}
            className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition", viewMode === "week" ? "brand-gradient text-white" : "text-text-secondary")}
          >
            <LayoutGrid size={13} /> أسبوعي
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition", viewMode === "day" ? "brand-gradient text-white" : "text-text-secondary")}
          >
            <List size={13} /> يومي
          </button>
        </div>
      </div>

      {scheduleError ? (
        <ErrorState message={scheduleError} />
      ) : scheduleLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : viewMode === "week" ? (
        filteredSchedule.length === 0 ? (
          <Card hover={false}><EmptyState icon={<CalendarX2 size={40} />} title="لا توجد محاضرات بجدولك بعد" /></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const items = scheduleByDay[d] ?? [];
              const isToday = d === todayIsoSunday;
              return (
                <div key={d} className="flex flex-col gap-2">
                  <div className={cn("rounded-xl px-3 py-2 text-center text-xs font-bold", isToday ? "brand-gradient text-white shadow-soft" : "bg-bg-secondary text-text-secondary")}>
                    {dayNames[d]}
                  </div>
                  {items.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border py-6 text-center text-[11px] text-text-disabled">
                      لا محاضرات
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {items.map((item, idx) => (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.02 }}>
                          <Card hover={false} className="p-3">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-xs font-bold text-text-primary">{item.subjectName}</p>
                              {canManage && (
                                <button onClick={async () => { if (confirm("حذف هذي المحاضرة من الجدول؟")) await deleteScheduleItem(item.id); }} className="shrink-0 text-status-danger">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-text-secondary">{item.professorName}</p>
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-text-secondary">
                              <Clock size={11} /> {item.startTime}–{item.endTime}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-text-secondary">
                              <MapPin size={11} /> {item.room || "—"}
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : filteredDayItems.length === 0 ? (
        <Card hover={false}><EmptyState icon={<CalendarX2 size={40} />} title={`لا توجد محاضرات يوم ${dayNames[selectedDay]}`} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDayItems.map((item, idx) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: idx * 0.03 }}>
              <Card className="h-full">
                <div className="flex items-start justify-between">
                  <p className="font-bold text-text-primary">{item.subjectName}</p>
                  {canManage && (
                    <button onClick={async () => { if (confirm("حذف هذي المحاضرة من الجدول؟")) await deleteScheduleItem(item.id); }} className="text-status-danger">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-primary" />
            <h3 className="text-lg font-bold">الواجبات القادمة</h3>
          </div>
          {hwError ? <ErrorState message={hwError} /> : hwLoading ? <Skeleton className="h-40 w-full" /> : upcomingHomework.length === 0 ? (
            <Card hover={false}><EmptyState title="ما فيه واجبات قادمة حاليًا" /></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingHomework.map((h) => (
                <Card key={h.id} hover={false} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{h.title}</p>
                    <p className="text-sm text-text-secondary">{h.subjectName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">{formatDate(h.dueDate)}</Badge>
                    {canManage && (
                      <button onClick={async () => { if (confirm("حذف هذا الواجب؟")) await deleteHomeworkItem(h.id); }} className="text-status-danger">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlarmClock size={20} className="text-primary" />
            <h3 className="text-lg font-bold">الامتحانات القادمة</h3>
          </div>
          {examError ? <ErrorState message={examError} /> : examLoading ? <Skeleton className="h-40 w-full" /> : upcomingExams.length === 0 ? (
            <Card hover={false}><EmptyState title="ما فيه امتحانات قادمة حاليًا" /></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingExams.map((e) => (
                <Card key={e.id} hover={false} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-sm text-text-secondary">{e.subjectName} · قاعة {e.room || "—"}</p>
                    {e.postponed && <p className="mt-1 text-xs text-status-warning">مؤجل{e.postponedNote ? `: ${e.postponedNote}` : ""}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={e.postponed ? "warning" : "danger"}>{formatDate(e.examDate)}</Badge>
                    {canManage && (
                      <button onClick={async () => { if (confirm("حذف هذا الامتحان؟")) await deleteExamItem(e.id); }} className="text-status-danger">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB إضافة */}
      {canManage && (
        <button
          onClick={() => setAddMenuOpen(true)}
          className="fixed bottom-8 left-8 z-40 flex h-14 w-14 items-center justify-center rounded-full brand-gradient text-white shadow-large hover:brightness-105"
        >
          <Plus size={26} />
        </button>
      )}

      <AnimatePresence>
        {addMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
            onClick={() => setAddMenuOpen(false)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ duration: 0.2, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-dialog bg-white p-4 pb-8"
            >
              <button onClick={() => startAdd("lecture")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right hover:bg-bg-secondary">
                <Clock size={18} className="text-primary" /> <span className="text-sm font-semibold">إضافة محاضرة للجدول</span>
              </button>
              <button onClick={() => startAdd("homework")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right hover:bg-bg-secondary">
                <ClipboardList size={18} className="text-status-warning" /> <span className="text-sm font-semibold">إضافة واجب</span>
              </button>
              <button onClick={() => startAdd("exam")} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right hover:bg-bg-secondary">
                <AlarmClock size={18} className="text-primary-blue" /> <span className="text-sm font-semibold">إضافة امتحان</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scopeDialogOpen && (
          <ScopeDialog onDone={onScopeChosen} onCancel={() => { setScopeDialogOpen(false); setPendingKind(null); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setFormOpen(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-dialog bg-white p-6 shadow-large"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-bold text-text-primary">
                  {formOpen === "lecture" ? "إضافة محاضرة" : formOpen === "homework" ? "إضافة واجب" : "إضافة امتحان"}
                </p>
                <button onClick={() => setFormOpen(null)}><X size={18} className="text-text-secondary" /></button>
              </div>

              <div className="flex flex-col gap-3">
                {formOpen === "lecture" && (
                  <>
                    <Input placeholder="اسم المادة" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                    <Input placeholder="اسم الدكتور" value={professorName} onChange={(e) => setProfessorName(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11 rounded-input border border-border px-3 text-sm" />
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11 rounded-input border border-border px-3 text-sm" />
                    </div>
                    <Input placeholder="القاعة" value={room} onChange={(e) => setRoom(e.target.value)} />
                    <p className="text-xs text-text-secondary">اليوم: {dayNames[selectedDay]}</p>
                  </>
                )}
                {formOpen === "homework" && (
                  <>
                    <Input placeholder="اسم المادة" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                    <Input placeholder="عنوان الواجب" value={professorName} onChange={(e) => setProfessorName(e.target.value)} />
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 rounded-input border border-border px-3 text-sm" />
                  </>
                )}
                {formOpen === "exam" && (
                  <>
                    <Input placeholder="اسم المادة" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
                    <Input placeholder="عنوان الامتحان" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
                    <Input placeholder="القاعة" value={room} onChange={(e) => setRoom(e.target.value)} />
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 rounded-input border border-border px-3 text-sm" />
                  </>
                )}

                {message && <p className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary">{message}</p>}

                <Button
                  loading={submitting}
                  onClick={formOpen === "lecture" ? submitLecture : formOpen === "homework" ? submitHomework : submitExam}
                  className="w-full"
                >
                  إضافة
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
