"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, GraduationCap } from "lucide-react";
import { useInstructorSignUp, useSubjectsForDepartment } from "@/lib/hooks/useInstructor";
import { colleges, departmentsFor } from "@/lib/constants/academic";
import { Card, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Subject } from "@/lib/types/models";

export default function InstructorSignupPage() {
  const router = useRouter();
  const instructorSignUp = useInstructorSignUp();
  const fetchSubjects = useSubjectsForDepartment();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [stage, setStage] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableStages = Array.from(new Set(subjects.map((s) => s.stage))).sort((a, b) => a - b);
  const visibleSubjects = stage === null ? subjects : subjects.filter((s) => s.stage === stage);

  async function onDepartmentChange(dept: string) {
    setDepartment(dept);
    setSelectedIds(new Set());
    setStage(null);
    if (!college) return;
    setLoadingSubjects(true);
    const list = await fetchSubjects(college, dept);
    setSubjects(list);
    const stages = Array.from(new Set(list.map((s) => s.stage))).sort((a, b) => a - b);
    setStage(stages[0] ?? null);
    setLoadingSubjects(false);
  }

  function toggleSubject(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    setError(null);
    if (!name.trim() || !email.trim() || !password) return setError("عبّي الاسم والبريد وكلمة المرور");
    if (!college || !department) return setError("اختر الكلية والقسم");
    if (selectedIds.size === 0) return setError("اختر مادة وحدة على الأقل تدرّسها");

    setLoading(true);
    const err = await instructorSignUp({
      email: email.trim(),
      password,
      name: name.trim(),
      collegeId: college,
      departmentId: department,
      requestedSubjectIds: Array.from(selectedIds),
    });
    setLoading(false);
    if (err) return setError(err);
    router.replace("/instructor/pending");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient">
          <GraduationCap className="text-white" size={22} />
        </div>
        <p className="text-xl font-extrabold text-text-primary">تسجيل حساب دكتور</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-primary-blue/10 p-4 text-sm text-text-primary">
        <Info size={20} className="mt-0.5 shrink-0 text-primary-blue" />
        حسابك يحتاج موافقة سوبر أدمن قبل ما تكدر تستخدم الحضور والدرجات. اختر موادك بدقة.
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">الاسم الكامل</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="د. اسمك الثلاثي" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">البريد الإلكتروني</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@uni.edu.iq" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">كلمة المرور</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة مرور قوية" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">الكلية</label>
          <select
            value={college ?? ""}
            onChange={(e) => {
              setCollege(e.target.value || null);
              setDepartment(null);
              setSubjects([]);
              setSelectedIds(new Set());
            }}
            className="h-12 w-full rounded-input border border-border bg-white px-4 text-sm"
          >
            <option value="">اختر الكلية</option>
            {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">القسم</label>
          <select
            value={department ?? ""}
            onChange={(e) => e.target.value && onDepartmentChange(e.target.value)}
            disabled={!college}
            className="h-12 w-full rounded-input border border-border bg-white px-4 text-sm disabled:opacity-50"
          >
            <option value="">اختر القسم</option>
            {departmentsFor(college).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {availableStages.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-text-secondary">المرحلة</label>
            <div className="flex flex-wrap gap-2">
              {availableStages.map((st) => {
                const count = subjects.filter((s) => s.stage === st && selectedIds.has(s.id)).length;
                return (
                  <button
                    key={st}
                    onClick={() => setStage(st)}
                    className={`flex items-center gap-1.5 rounded-badge border px-3 py-1.5 text-xs font-bold ${stage === st ? "bg-primary-blue text-white border-transparent" : "border-border bg-white text-text-primary"}`}
                  >
                    مرحلة {st}
                    {count > 0 && <span className="rounded-full bg-white/20 px-1.5">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-text-secondary">المواد اللي تدرّسها</label>
            {selectedIds.size > 0 && <span className="text-xs text-text-secondary">{selectedIds.size} مادة مختارة</span>}
          </div>
          {loadingSubjects ? (
            <p className="text-sm text-text-secondary">جاري التحميل...</p>
          ) : !department ? (
            <p className="rounded-xl bg-bg-secondary p-3 text-xs text-text-secondary">اختر القسم أول عشان تطلع لك مواده</p>
          ) : visibleSubjects.length === 0 ? (
            <p className="rounded-xl bg-bg-secondary p-3 text-xs text-text-secondary">ما فيه مواد بهذي المرحلة</p>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {visibleSubjects.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                  <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSubject(s.id)} />
                  <div>
                    <p className="text-sm text-text-primary">{s.name}</p>
                    <p className="text-xs text-text-secondary">مرحلة {s.stage}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="rounded-xl bg-status-danger/10 px-3 py-2 text-sm text-status-danger">{error}</p>}

        <Button onClick={submit} loading={loading} className="w-full">إرسال طلب التسجيل</Button>
      </Card>
    </div>
  );
}
