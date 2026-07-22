"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, History } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  subjectsByIds,
  rosterFor,
  fetchGradeSheet,
  gradeRecordsForSheet,
  useSaveGradeSheet,
} from "@/lib/hooks/useInstructor";
import { defaultSections, studyTypes } from "@/lib/constants/academic";
import {
  Subject,
  StudentProfile,
  GradeComponent,
  defaultCourseComponents,
  defaultSemesterComponents,
  GradeSheet,
} from "@/lib/types/models";
import { Card, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

type System = "course" | "semester";

export default function EnterGradesPage() {
  const router = useRouter();
  const { currentInstructor } = useAuth();
  const saveGradeSheet = useSaveGradeSheet();

  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [section, setSection] = useState("");
  const [studyType, setStudyType] = useState("");
  const [system, setSystem] = useState<System>("course");
  const [components, setComponents] = useState<GradeComponent[]>(defaultCourseComponents);

  const [loadingRoster, setLoadingRoster] = useState(false);
  const [roster, setRoster] = useState<StudentProfile[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({});
  const [sheetExisted, setSheetExisted] = useState(false);
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

  function defaultsFor(sys: System) {
    return sys === "semester" ? defaultSemesterComponents : defaultCourseComponents;
  }

  function onSystemChange(sys: System) {
    setSystem(sys);
    const comps = defaultsFor(sys);
    setComponents(comps);
    setScores(Object.fromEntries(roster.map((s) => [s.id, Object.fromEntries(comps.map((c) => [c.key, ""]))])));
  }

  async function loadRosterAndSheet() {
    if (!selectedSubject || !section || !studyType) return;
    setLoadingRoster(true);
    setRoster([]);
    const list = await rosterFor({ departmentId: selectedSubject.departmentId, stage: selectedSubject.stage, section, studyType });
    const existingSheet = await fetchGradeSheet({ subjectId: selectedSubject.id, section, studyType });
    let existingRecords: Record<string, Record<string, number>> = {};
    if (existingSheet) {
      const recs = await gradeRecordsForSheet(existingSheet.id);
      existingRecords = Object.fromEntries(Object.entries(recs).map(([k, v]) => [k, v.scores]));
    }
    const sys: System = (existingSheet?.system as System) ?? system;
    const comps = existingSheet?.components ?? defaultsFor(sys);
    setSheetExisted(!!existingSheet);
    setSystem(sys);
    setComponents(comps);
    setScores(
      Object.fromEntries(
        list.map((s) => [s.id, Object.fromEntries(comps.map((c) => [c.key, (existingRecords[s.id]?.[c.key] ?? "").toString()]))])
      )
    );
    setRoster(list);
    setLoadingRoster(false);
  }

  function scoreOf(studentId: string, key: string): number {
    const v = parseFloat(scores[studentId]?.[key] ?? "");
    return isNaN(v) ? 0 : v;
  }

  function totalOf(studentId: string): number {
    if (system !== "semester") {
      return components.reduce((sum, c) => sum + scoreOf(studentId, c.key), 0);
    }
    const s1 = components.filter((c) => c.key.startsWith("s1_")).reduce((sum, c) => sum + scoreOf(studentId, c.key), 0);
    const s2 = components.filter((c) => c.key.startsWith("s2_")).reduce((sum, c) => sum + scoreOf(studentId, c.key), 0);
    return (s1 + s2) / 2;
  }

  const displayMax = system === "semester" ? 100 : components.reduce((s, c) => s + c.maxScore, 0);

  async function save() {
    if (!selectedSubject) return;
    setSaving(true);
    const sheet: GradeSheet = {
      id: `${selectedSubject.id}_${section}_${studyType}`,
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      collegeId: selectedSubject.collegeId,
      departmentId: selectedSubject.departmentId,
      stage: selectedSubject.stage,
      section,
      studyType,
      instructorId: currentInstructor?.id ?? "",
      system,
      components,
    };
    const records = Object.fromEntries(
      roster.map((s) => [s.id, { studentId: s.id, scores: Object.fromEntries(components.map((c) => [c.key, scoreOf(s.id, c.key)])) }])
    );
    const studentNames = Object.fromEntries(roster.map((s) => [s.id, s.name]));
    const res = await saveGradeSheet(sheet, records, studentNames);
    setSaving(false);
    setMessage(res.ok ? "تم حفظ الدرجات بنجاح ✅" : res.error ?? "تعذّر الحفظ");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/instructor/home")} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
          <ChevronLeft size={16} /> رجوع
        </button>
        {selectedSubject && section && studyType && (
          <button
            onClick={() => router.push(`/instructor/grades/audit?sheetId=${selectedSubject.id}_${section}_${studyType}&subjectName=${encodeURIComponent(selectedSubject.name)}`)}
            className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
          >
            <History size={16} /> سجل التعديلات
          </button>
        )}
      </div>
      <h1 className="text-2xl font-extrabold text-text-primary">إدخال الدرجات</h1>

      {loadingSubjects ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <Card className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">المادة</label>
            <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setRoster([]); }} className="h-12 w-full rounded-input border border-border bg-white px-4 text-sm">
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
            <label className="mb-2 block text-sm font-semibold text-text-secondary">نظام التقييم</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onSystemChange("course")}
                className={`rounded-xl border p-3 text-center text-xs font-bold ${system === "course" ? "border-primary-blue bg-primary-blue/10 text-primary-blue" : "border-border text-text-secondary"}`}
              >
                كورس (تقييم سنوي وحد)
              </button>
              <button
                onClick={() => onSystemChange("semester")}
                className={`rounded-xl border p-3 text-center text-xs font-bold ${system === "semester" ? "border-primary-blue bg-primary-blue/10 text-primary-blue" : "border-border text-text-secondary"}`}
              >
                فصلي (فصلين منفصلين)
              </button>
            </div>
          </div>

          <Button disabled={!subjectId || !section || !studyType} onClick={loadRosterAndSheet} loading={loadingRoster} className="w-full">
            عرض قائمة الطلاب
          </Button>
          {sheetExisted && (
            <p className="text-xs text-text-secondary">فيه ورقة درجات محفوظة مسبقًا لهذي المجموعة - انفتحت بنفس النظام والدرجات القديمة</p>
          )}
        </Card>
      )}

      {roster.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-text-secondary">عدد الطلاب: {roster.length} • المجموع الأعظم: {displayMax.toFixed(0)}</p>

          {roster.map((s) => (
            <Card key={s.id} hover={false} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-text-primary">{s.name}</p>
                <p className="text-sm font-extrabold text-primary-blue">{totalOf(s.id).toFixed(1)} / {displayMax.toFixed(0)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {components.map((c) => (
                  <div key={c.key} className="w-[130px]">
                    <label className="mb-1 block text-[10px] text-text-secondary">{c.label} ({c.maxScore.toFixed(0)})</label>
                    <input
                      type="number"
                      value={scores[s.id]?.[c.key] ?? ""}
                      onChange={(e) => setScores((prev) => ({ ...prev, [s.id]: { ...prev[s.id], [c.key]: e.target.value } }))}
                      className="h-9 w-full rounded-lg border border-border px-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                ))}
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
            حفظ الدرجات
          </button>
        </div>
      )}
    </div>
  );
}
