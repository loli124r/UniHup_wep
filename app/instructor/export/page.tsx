"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, GraduationCap, ClipboardCheck, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  subjectsByIds,
  rosterFor,
  fetchGradeSheet,
  gradeRecordsForSheet,
  attendanceSessionsForSubject,
} from "@/lib/hooks/useInstructor";
import { defaultSections, studyTypes } from "@/lib/constants/academic";
import { Subject, gradeSheetTotalFor } from "@/lib/types/models";
import { Card, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReportType = "grades" | "attendance";

export default function ExportReportPage() {
  const router = useRouter();
  const { currentInstructor } = useAuth();

  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [section, setSection] = useState("");
  const [studyType, setStudyType] = useState("");
  const [reportType, setReportType] = useState<ReportType>("grades");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedSubject = mySubjects.find((s) => s.id === subjectId) ?? null;
  const readyToExport = !!selectedSubject && !!section && !!studyType && !generating;

  useEffect(() => {
    if (!currentInstructor) return;
    subjectsByIds(currentInstructor.approvedSubjectIds).then((s) => {
      setMySubjects(s);
      setLoadingSubjects(false);
    });
  }, [currentInstructor?.id]);

  async function exportReport() {
    if (!selectedSubject || !section || !studyType) return;
    setGenerating(true);
    setMessage(null);
    try {
      const XLSX = await import("xlsx");
      const roster = await rosterFor({ departmentId: selectedSubject.departmentId, stage: selectedSubject.stage, section, studyType });

      let fileName: string;
      let rows: any[][];

      if (reportType === "grades") {
        const sheet = await fetchGradeSheet({ subjectId: selectedSubject.id, section, studyType });
        if (!sheet) {
          setMessage("ماكو ورقة درجات محفوظة لهذي المادة/الشعبة بعد");
          setGenerating(false);
          return;
        }
        const records = await gradeRecordsForSheet(sheet.id);
        fileName = `درجات_${selectedSubject.name}_${section}`;
        rows = [["الطالب", ...sheet.components.map((c) => c.label), "المجموع"]];
        for (const s of roster) {
          const record = records[s.id] ?? { studentId: s.id, scores: {} };
          const total = gradeSheetTotalFor(sheet, record);
          rows.push([s.name, ...sheet.components.map((c) => record.scores[c.key] ?? 0), total]);
        }
      } else {
        const sessions = (await attendanceSessionsForSubject(selectedSubject.id))
          .filter((s) => s.section === section && s.studyType === studyType)
          .sort((a, b) => a.date.getTime() - b.date.getTime());
        if (sessions.length === 0) {
          setMessage("ماكو جلسات حضور مسجّلة لهذي المادة/الشعبة بعد");
          setGenerating(false);
          return;
        }
        fileName = `حضور_${selectedSubject.name}_${section}`;
        rows = [["الطالب", ...sessions.map((s) => s.date.toLocaleDateString("ar-IQ")), "نسبة الحضور %"]];
        for (const s of roster) {
          let counted = 0, present = 0;
          const row: any[] = [s.name];
          for (const session of sessions) {
            const status = session.records[s.id];
            row.push(status === undefined ? "-" : status === "absent" ? "غياب" : status === "excused" ? "معذور" : "حاضر");
            if (status !== undefined) {
              counted++;
              if (status !== "absent") present++;
            }
          }
          row.push(counted === 0 ? 0 : Math.round((present / counted) * 1000) / 10);
          rows.push(row);
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, reportType === "grades" ? "الدرجات" : "الحضور");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      setMessage("تم توليد الملف وتنزيله بنجاح ✅");
    } catch (e: any) {
      setMessage(`صار خطأ أثناء توليد التقرير: ${e?.message ?? e}`);
    }
    setGenerating(false);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-10">
      <button onClick={() => router.push("/instructor/home")} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h1 className="text-2xl font-extrabold text-text-primary">تصدير تقرير Excel</h1>

      {loadingSubjects ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">نوع التقرير</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setReportType("grades")}
                className={cn("flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-bold", reportType === "grades" ? "border-primary-blue bg-primary-blue text-white" : "border-border text-text-secondary")}
              >
                <GraduationCap size={18} /> الدرجات
              </button>
              <button
                onClick={() => setReportType("attendance")}
                className={cn("flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-bold", reportType === "attendance" ? "border-primary-blue bg-primary-blue text-white" : "border-border text-text-secondary")}
              >
                <ClipboardCheck size={18} /> الحضور
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">المادة</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-12 w-full rounded-input border border-border bg-white px-4 text-sm">
              <option value="">اختر المادة</option>
              {mySubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select value={section} onChange={(e) => setSection(e.target.value)} className="h-12 rounded-input border border-border bg-white px-4 text-sm">
              <option value="">الشعبة</option>
              {defaultSections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={studyType} onChange={(e) => setStudyType(e.target.value)} className="h-12 rounded-input border border-border bg-white px-4 text-sm">
              <option value="">نوع الدراسة</option>
              {studyTypes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {message && <p className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary">{message}</p>}

          <Button disabled={!readyToExport} loading={generating} onClick={exportReport} className="w-full">
            <FileSpreadsheet size={16} /> تصدير Excel
          </Button>
        </Card>
      )}
    </div>
  );
}
