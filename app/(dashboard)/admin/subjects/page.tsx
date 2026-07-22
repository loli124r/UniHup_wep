"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSubjectsForDepartmentAdmin, useCreateSubject, useDeleteSubject } from "@/lib/hooks/useAdmin";
import { colleges, departmentsFor } from "@/lib/constants/academic";
import { Card, Input, Skeleton, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Subject, isSuperAdmin } from "@/lib/types/models";

const stageOptions = [1, 2, 3, 4];
const contentTypes = ["ملخصات", "أسئلة", "محاضرات"];

export default function ManageSubjectsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const fetchSubjects = useSubjectsForDepartmentAdmin();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  const isSuper = isSuperAdmin(currentUser);
  const [college, setCollege] = useState<string | null>(isSuper ? null : currentUser?.adminCollegeId ?? null);
  const [department, setDepartment] = useState<string | null>(isSuper ? null : currentUser?.adminDepartmentId ?? null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [stage, setStage] = useState(1);
  const [primaryType, setPrimaryType] = useState("ملخصات");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load(c = college, d = department) {
    setLoading(true);
    setSubjects(await fetchSubjects(c ?? "", d ?? ""));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [college, department]);

  async function create() {
    if (!name.trim() || !department || !college) return;
    setCreating(true);
    setMessage(null);
    const res = await createSubject({ name: name.trim(), stage, collegeId: college, departmentId: department, primaryType });
    setCreating(false);
    if (res.ok) {
      setName("");
      setMessage("تمت إضافة المادة بنجاح");
      await load();
    } else {
      setMessage(res.error ?? "تعذّر الإضافة");
    }
  }

  async function remove(s: Subject) {
    if (!confirm(`متأكد تريد تحذف مادة "${s.name}"؟`)) return;
    const res = await deleteSubject(s);
    if (res.ok) await load();
    else setMessage(res.error ?? "تعذّر الحذف");
  }

  const canCreate = name.trim().length > 0 && !!department && !!college && !creating;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h1 className="text-2xl font-extrabold text-text-primary">إدارة المواد</h1>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-bold text-text-primary">إضافة مادة جديدة</p>
        <p className="text-xs text-text-secondary">
          {isSuper ? "اختر الكلية والقسم، ثم اسم المادة والمرحلة." : `ستُضاف المادة تلقائيًا لقسمك (${currentUser?.adminDepartmentId}).`}
        </p>

        {isSuper && (
          <div className="grid grid-cols-2 gap-3">
            <select value={college ?? ""} onChange={(e) => { setCollege(e.target.value || null); setDepartment(null); }} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
              <option value="">الكلية</option>
              {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={department ?? ""} onChange={(e) => setDepartment(e.target.value || null)} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
              <option value="">القسم</option>
              {departmentsFor(college).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        <Input placeholder="اسم المادة (مثال: الرياضيات 1)" value={name} onChange={(e) => setName(e.target.value)} />

        <select value={stage} onChange={(e) => setStage(Number(e.target.value))} className="h-11 rounded-input border border-border bg-white px-3 text-sm">
          {stageOptions.map((s) => <option key={s} value={s}>المرحلة {s}</option>)}
        </select>

        <div className="grid grid-cols-3 gap-2">
          {contentTypes.map((t) => (
            <button
              key={t}
              onClick={() => setPrimaryType(t)}
              className={`rounded-lg border py-2 text-xs font-semibold ${primaryType === t ? "border-primary bg-primary text-white" : "border-border text-text-secondary"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {message && <p className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary">{message}</p>}

        <Button disabled={!canCreate} loading={creating} onClick={create} className="w-full">إضافة المادة</Button>
      </Card>

      <div>
        <p className="mb-3 text-sm font-bold text-text-primary">المواد الحالية ({subjects.length})</p>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : !college || !department ? (
          <Card hover={false}><EmptyState title="اختر قسمًا أولًا لعرض مواده" /></Card>
        ) : subjects.length === 0 ? (
          <Card hover={false}><EmptyState title="لا توجد مواد بهذا القسم بعد" /></Card>
        ) : (
          <div className="flex flex-col gap-2">
            {subjects.map((s) => (
              <Card key={s.id} hover={false} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{s.name}</p>
                  <p className="text-xs text-text-secondary">مرحلة {s.stage} · {s.primaryType}</p>
                </div>
                <button onClick={() => remove(s)} className="text-status-danger"><Trash2 size={18} /></button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
