"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { subjectsByIds, rosterFor, fetchAttendanceSession, useSaveAttendanceSession } from "@/lib/hooks/useInstructor";
import { defaultSections, studyTypes } from "@/lib/constants/academic";
import { Subject, StudentProfile } from "@/lib/types/models";
import { Card, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

type Status = "present" | "absent" | "excused";

export default function TakeAttendancePage() {
  const router = useRouter();
  const { currentInstructor } = useAuth();
  const saveAttendanceSession = useSaveAttendanceSession();

  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [section, setSection] = useState("");
  const [studyType, setStudyType] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [loadingRoster, setLoadingRoster] = useState(false);
  const [roster, setRoster] = useState<StudentProfile[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedSubject = mySubjects.find((s) => s.id === subjectId) ?? null;

  useEffect(() => {
    if (!currentInstructor) return;
    subjectsByIds(currentInstructor.approvedSubjectIds).then((s) => {
      setMySubjects(s);
      setLoadingSubjects(false);
    });
  }, [currentInstructor?.id]);

  async function loadRoster() {
    if (!selectedSubject || !section || !studyType) return;
    setLoadingRoster(true);
    setRoster([]);
    const list = await rosterFor({ departmentId: selectedSubject.departmentId, stage: selectedSubject.stage, section, studyType });
    const existing = await fetchAttendanceSession({ subjectId: selectedSubject.id, date: new Date(date), section });
    const next: Record<string, Status> = {};
    for (const s of list) next[s.id] = (existing?.records[s.id] as Status) ?? "present";
    setStatuses(next);
    setRoster(list);
    setLoadingRoster(false);
  }

  async function save() {
    if (!selectedSubject) return;
    setSaving(true);
    const res = await saveAttendanceSession({
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      collegeId: selectedSubject.collegeId,
      departmentId: selectedSubject.departmentId,
      stage: selectedSubject.stage,
      section,
      studyType,
      instructorId: "",
      date: new Date(date),
      records: statuses,
    });
    setSaving(false);
    setMessage(res.ok ? "تم حفظ الحضور بنجاح ✅" : res.error ?? "تعذّر الحفظ");
  }

  const statusOptions: { value: Status; label: string; color: string }[] = [
    { value: "present", label: "حاضر", color: "status-success" },
    { value: "absent", label: "غايب", color: "status-danger" },
    { value: "excused", label: "مبرر", color: "status-warning" },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <button onClick={() => router.push("/instructor/home")} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h1 className="text-2xl font-extrabold text-text-primary">أخذ الحضور</h1>

      {loadingSubjects ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <Card className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">المادة</label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setRoster([]);
              }}
              className="h-12 w-full rounded-input border border-border bg-white px-4 text-sm"
            >
              <option value="">اختر المادة</option>
              {mySubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-text-secondary">الشعبة</label>
              <select value={section} onChange={(e) => setSection(e.target.value)} className="h-12 w-full rounded-input border border-border bg-white px-4 text-sm">
                <option value="">الشعبة</option>
                {defaultSections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-text-secondary">نوع الدراسة</label>
              <select value={studyType} onChange={(e) => setStudyType(e.target.value)} className="h-12 w-full rounded-input border border-border bg-white px-4 text-sm">
                <option value="">النوع</option>
                {studyTypes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">تاريخ المحاضرة</label>
            <div className="flex items-center gap-2 rounded-input border border-border bg-white px-4 h-12">
              <CalendarDays size={16} className="text-text-secondary" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" max={new Date().toISOString().slice(0, 10)} />
            </div>
          </div>

          <Button disabled={!subjectId || !section || !studyType} onClick={loadRoster} loading={loadingRoster} className="w-full">
            عرض قائمة الطلاب
          </Button>
        </Card>
      )}

      {roster.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">عدد الطلاب: {roster.length}</p>
            <button
              onClick={() => setStatuses(Object.fromEntries(roster.map((s) => [s.id, "present" as Status])))}
              className="text-sm font-semibold text-primary"
            >
              تعليم الكل حاضر
            </button>
          </div>

          {roster.map((s) => (
            <Card key={s.id} hover={false} className="flex items-center justify-between p-3">
              <span className="text-sm text-text-primary">{s.name}</span>
              <div className="flex gap-1.5">
                {statusOptions.map((opt) => {
                  const selected = statuses[s.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt.value }))}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
                      style={
                        selected
                          ? { backgroundColor: opt.value === "present" ? "#22C55E" : opt.value === "absent" ? "#EF4444" : "#F59E0B", color: "#fff" }
                          : { backgroundColor: opt.value === "present" ? "#22C55E1a" : opt.value === "absent" ? "#EF44441a" : "#F59E0B1a", color: opt.value === "present" ? "#22C55E" : opt.value === "absent" ? "#EF4444" : "#F59E0B" }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}

          {message && <p className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary">{message}</p>}

          <button
            onClick={save}
            disabled={saving}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-btn bg-status-success text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:opacity-50"
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            حفظ الحضور
          </button>
        </div>
      )}
    </div>
  );
}
