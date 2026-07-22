"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePostAdminAnnouncement, useAddExam, useExamsForScope, usePostponeExam } from "@/lib/hooks/useAdmin";
import { colleges, departmentsFor, defaultSections, studyTypes } from "@/lib/constants/academic";
import { Card, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/lib/types/models";
import { cn } from "@/lib/utils";

type Kind = "notice" | "announcement" | "exam";

function ScopePicker({
  isSuper,
  college,
  setCollege,
  department,
  setDepartment,
  stage,
  setStage,
  section,
  setSection,
  studyType,
  setStudyType,
  general,
  setGeneral,
}: any) {
  return (
    <div className="flex flex-col gap-3">
      {isSuper && (
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" checked={general} onChange={(e) => setGeneral(e.target.checked)} />
          بث عام لكل طلبة الموقع (سوبر أدمن فقط)
        </label>
      )}
      {!general && (
        <>
          {isSuper && (
            <div className="grid grid-cols-2 gap-2">
              <select value={college} onChange={(e) => { setCollege(e.target.value); setDepartment(""); }} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
                <option value="">الكلية</option>
                {colleges.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
                <option value="">القسم (فاضي = كل الأقسام)</option>
                {departmentsFor(college).map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <select value={stage ?? ""} onChange={(e) => setStage(e.target.value ? Number(e.target.value) : null)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
              <option value="">كل المراحل</option>
              {[1, 2, 3, 4, 5, 6].map((s) => <option key={s} value={s}>مرحلة {s}</option>)}
            </select>
            <select value={section ?? ""} onChange={(e) => setSection(e.target.value || null)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
              <option value="">كل الشعب</option>
              {defaultSections.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={studyType ?? ""} onChange={(e) => setStudyType(e.target.value || null)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
              <option value="">كل الأنواع</option>
              {studyTypes.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminBroadcastPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const isSuper = isSuperAdmin(currentUser);
  const postAnnouncement = usePostAdminAnnouncement();
  const addExam = useAddExam();
  const examsForScope = useExamsForScope();
  const postponeExam = usePostponeExam();

  const [kind, setKind] = useState<Kind>("announcement");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [college, setCollege] = useState(currentUser?.adminCollegeId ?? "");
  const [department, setDepartment] = useState(currentUser?.adminDepartmentId ?? "");
  const [stage, setStage] = useState<number | null>(currentUser?.adminStage || null);
  const [section, setSection] = useState<string | null>(currentUser?.adminSection || null);
  const [studyType, setStudyType] = useState<string | null>(currentUser?.adminStudyType || null);
  const [general, setGeneral] = useState(false);
  const [room, setRoom] = useState("");
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [existingExams, setExistingExams] = useState<any[] | null>(null);
  const [postponeNote, setPostponeNote] = useState("");
  const [postponeDate, setPostponeDate] = useState("");
  const [postponingId, setPostponingId] = useState<string | null>(null);

  async function submitAnnouncement() {
    if (!title.trim() || !message.trim()) return;
    setPosting(true);
    const res = await postAnnouncement({
      title: title.trim(),
      message: message.trim(),
      stage,
      section,
      studyType,
      urgent: kind === "notice",
      general,
      overrideCollegeId: isSuper ? college : undefined,
      overrideDepartmentId: isSuper ? department : undefined,
    });
    setPosting(false);
    setResult(res.ok ? "تم النشر بنجاح ✅" : res.error ?? "تعذّر النشر");
    if (res.ok) { setTitle(""); setMessage(""); }
  }

  async function submitExam() {
    if (!title.trim() || !department || !stage || !section || !studyType) return;
    setPosting(true);
    const res = await addExam({
      subjectName: title.trim(),
      title: title.trim(),
      departmentId: isSuper ? department : currentUser!.adminDepartmentId,
      stage,
      section,
      studyType,
      room,
      examDate: new Date(examDate),
    });
    setPosting(false);
    setResult(res.ok ? "تمت إضافة الامتحان بنجاح ✅" : res.error ?? "تعذّر الإضافة");
    if (res.ok) { setTitle(""); setRoom(""); }
  }

  async function loadExams() {
    const dept = isSuper ? department : currentUser!.adminDepartmentId;
    if (!dept || !stage) return;
    const list = await examsForScope({ departmentId: dept, stage, section: section ?? undefined, studyType: studyType ?? undefined });
    setExistingExams(list.filter((e: any) => !e.postponed));
  }

  async function doPostpone(id: string) {
    setPostponingId(id);
    const res = await postponeExam(id, { newDate: postponeDate ? new Date(postponeDate) : undefined, note: postponeNote || undefined });
    setPostponingId(null);
    setResult(res.ok ? "تم تسجيل التأجيل بنجاح ✅" : res.error ?? "تعذّر التأجيل");
    if (res.ok) loadExams();
  }

  const kinds: { value: Kind; label: string }[] = [
    { value: "notice", label: "تبليغ فوري" },
    { value: "announcement", label: "إعلان" },
    { value: "exam", label: "امتحان" },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h1 className="text-2xl font-extrabold text-text-primary">نشر جديد</h1>

      {!isSuper && (
        <div className="rounded-xl border border-border bg-white p-3 text-xs text-text-secondary">
          نطاقك: {currentUser?.adminCollegeId} - {currentUser?.adminDepartmentId} - مرحلة {currentUser?.adminStage} - شعبة {currentUser?.adminSection} - {currentUser?.adminStudyType}
        </div>
      )}

      <div className="flex gap-2">
        {kinds.map((k) => (
          <button
            key={k.value}
            onClick={() => { setKind(k.value); setResult(null); }}
            className={cn("flex-1 rounded-badge border py-2 text-sm font-semibold", kind === k.value ? "brand-gradient text-white border-transparent" : "border-border bg-white text-text-secondary")}
          >
            {k.label}
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-4">
        <Input placeholder={kind === "exam" ? "اسم المادة / عنوان الامتحان" : "عنوان الإعلان"} value={title} onChange={(e) => setTitle(e.target.value)} />

        {kind !== "exam" ? (
          <textarea
            placeholder="نص الإعلان"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-input border border-border bg-white p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <>
            <Input placeholder="القاعة" value={room} onChange={(e) => setRoom(e.target.value)} />
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="h-11 rounded-input border border-border bg-white px-3 text-sm" />
          </>
        )}

        <ScopePicker
          isSuper={isSuper}
          college={college} setCollege={setCollege}
          department={department} setDepartment={setDepartment}
          stage={stage} setStage={setStage}
          section={section} setSection={setSection}
          studyType={studyType} setStudyType={setStudyType}
          general={kind === "exam" ? false : general} setGeneral={setGeneral}
        />

        {result && <p className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary">{result}</p>}

        <Button onClick={kind === "exam" ? submitExam : submitAnnouncement} loading={posting} className="w-full">
          {kind === "exam" ? "إضافة الامتحان" : "نشر"}
        </Button>
      </Card>

      {kind === "exam" && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-bold text-text-primary">أو أجّل امتحان موجود</p>
          <button onClick={loadExams} className="w-fit text-xs font-semibold text-primary">عرض امتحانات هذا النطاق</button>

          <div className="flex gap-2">
            <Input type="date" placeholder="تاريخ جديد (اختياري)" value={postponeDate} onChange={(e) => setPostponeDate(e.target.value)} />
          </div>
          <Input placeholder="ملاحظة التأجيل (اختياري)" value={postponeNote} onChange={(e) => setPostponeNote(e.target.value)} />

          {existingExams === null ? null : existingExams.length === 0 ? (
            <p className="text-xs text-text-secondary">ماكو امتحانات غير مؤجّلة بهذا النطاق</p>
          ) : (
            <div className="flex flex-col gap-2">
              {existingExams.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl bg-bg-secondary p-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{e.title}</p>
                    <p className="text-xs text-text-secondary">{e.subjectName} · قاعة {e.room || "—"}</p>
                  </div>
                  <button
                    onClick={() => doPostpone(e.id)}
                    disabled={postponingId === e.id}
                    className="rounded-btn border border-status-warning px-3 py-1.5 text-xs font-semibold text-status-warning disabled:opacity-50"
                  >
                    {postponingId === e.id ? "..." : "تأجيل"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
