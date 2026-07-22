"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import {
  useFindStudentByEmail,
  useListAllAdmins,
  useListClassReps,
  usePromoteToDeptAdmin,
  useDemoteToStudent,
  useSetClassRep,
  useListPendingInstructors,
  useApproveInstructor,
  useRejectInstructor,
  useListInstructorsWithPendingSubjectRequests,
  useApproveAdditionalSubjects,
  useDeclineAdditionalSubjects,
} from "@/lib/hooks/useAdmin";
import { colleges, departmentsFor, defaultSections, studyTypes, stagesForDepartment } from "@/lib/constants/academic";
import { Card, Input, Skeleton, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { StudentProfile, InstructorProfile } from "@/lib/types/models";
import { cn } from "@/lib/utils";

const tabs = ["admins", "reps", "instructors"] as const;
type Tab = (typeof tabs)[number];
const tabLabels: Record<Tab, string> = { admins: "الأدمن", reps: "ممثلو الشعب", instructors: "طلبات الدكاترة" };

function PromoteForm({ student, onDone }: { student: StudentProfile; onDone: () => void }) {
  const promote = usePromoteToDeptAdmin();
  const [college, setCollege] = useState(student.collegeId || "");
  const [department, setDepartment] = useState(student.departmentId || "");
  const [stage, setStage] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [studyType, setStudyType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const maxStage = stagesForDepartment(department, college);

  async function submit() {
    if (!college || !department || !stage || !section || !studyType) return;
    setLoading(true);
    await promote(student.id, { collegeId: college, departmentId: department, stage, section, studyType });
    setLoading(false);
    onDone();
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl bg-bg-secondary p-3">
      <div className="grid grid-cols-2 gap-2">
        <select value={college} onChange={(e) => { setCollege(e.target.value); setDepartment(""); }} className="h-10 rounded-lg border border-border bg-white px-2 text-xs">
          <option value="">الكلية</option>
          {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 rounded-lg border border-border bg-white px-2 text-xs">
          <option value="">القسم</option>
          {departmentsFor(college).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={stage ?? ""} onChange={(e) => setStage(Number(e.target.value) || null)} className="h-10 rounded-lg border border-border bg-white px-2 text-xs">
          <option value="">مرحلة</option>
          {Array.from({ length: maxStage }, (_, i) => i + 1).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={section ?? ""} onChange={(e) => setSection(e.target.value || null)} className="h-10 rounded-lg border border-border bg-white px-2 text-xs">
          <option value="">شعبة</option>
          {defaultSections.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={studyType ?? ""} onChange={(e) => setStudyType(e.target.value || null)} className="h-10 rounded-lg border border-border bg-white px-2 text-xs">
          <option value="">النوع</option>
          {studyTypes.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Button size="sm" onClick={submit} loading={loading} disabled={!college || !department || !stage || !section || !studyType}>
        ترقية لأدمن قسم بهذا النطاق
      </Button>
    </div>
  );
}

export default function AdminManagementPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("admins");

  // بحث الطلاب
  const findByEmail = useFindStudentByEmail();
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<StudentProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const listAllAdmins = useListAllAdmins();
  const listClassReps = useListClassReps();
  const demoteToStudent = useDemoteToStudent();
  const setClassRep = useSetClassRep();
  const listPendingInstructors = useListPendingInstructors();
  const approveInstructor = useApproveInstructor();
  const rejectInstructor = useRejectInstructor();
  const listInstructorsWithSubjectRequests = useListInstructorsWithPendingSubjectRequests();
  const approveAdditionalSubjects = useApproveAdditionalSubjects();
  const declineAdditionalSubjects = useDeclineAdditionalSubjects();

  const [admins, setAdmins] = useState<StudentProfile[] | null>(null);
  const [reps, setReps] = useState<StudentProfile[] | null>(null);
  const [pendingInstructors, setPendingInstructors] = useState<InstructorProfile[] | null>(null);
  const [subjectRequests, setSubjectRequests] = useState<InstructorProfile[] | null>(null);

  async function loadAdmins() { setAdmins(await listAllAdmins()); }
  async function loadReps() { setReps(await listClassReps()); }
  async function loadInstructors() { setPendingInstructors(await listPendingInstructors()); }
  async function loadSubjectRequests() { setSubjectRequests(await listInstructorsWithSubjectRequests()); }

  useEffect(() => { loadAdmins(); loadReps(); loadInstructors(); loadSubjectRequests(); }, []);

  async function search() {
    if (!email.trim()) return;
    setSearching(true);
    setSearchError(null);
    setFound(null);
    const s = await findByEmail(email);
    setSearching(false);
    setFound(s);
    if (!s) setSearchError("ما لقيت طالب بهذا الإيميل");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h1 className="text-2xl font-extrabold text-text-primary">إدارة الأدمن وممثلي الشعب</h1>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-badge border px-4 py-1.5 text-sm font-semibold", tab === t ? "brand-gradient text-white border-transparent" : "border-border bg-white text-text-secondary")}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "admins" && (
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <p className="text-sm font-bold text-text-primary">ترقية طالب لأدمن قسم</p>
            <div className="flex gap-2">
              <Input placeholder="بريد الطالب الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button size="sm" onClick={search} loading={searching}><Search size={16} /></Button>
            </div>
            {searchError && <p className="text-sm text-status-danger">{searchError}</p>}
            {found && (
              <div className="rounded-xl bg-bg-secondary p-3">
                <p className="text-sm font-semibold text-text-primary">{found.name}</p>
                <p className="text-xs text-text-secondary">{found.email}</p>
                <PromoteForm student={found} onDone={() => { setFound(null); setEmail(""); loadAdmins(); }} />
              </div>
            )}
          </Card>

          <div>
            <p className="mb-3 text-sm font-bold text-text-primary">الأدمن الحاليون ({admins?.length ?? "…"})</p>
            {admins === null ? (
              <Skeleton className="h-24 w-full" />
            ) : admins.length === 0 ? (
              <Card hover={false}><EmptyState title="ماكو أدمن غير السوبر أدمن حاليًا" /></Card>
            ) : (
              <div className="flex flex-col gap-2">
                {admins.map((a) => (
                  <Card key={a.id} hover={false} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{a.name}</p>
                      <p className="text-xs text-text-secondary">
                        {a.role === "super_admin" ? "سوبر أدمن" : `أدمن قسم: ${a.adminDepartmentId} · مرحلة ${a.adminStage} · شعبة ${a.adminSection}`}
                      </p>
                    </div>
                    {a.role === "dept_admin" && (
                      <button onClick={async () => { await demoteToStudent(a.id); loadAdmins(); }} className="flex items-center gap-1 text-xs font-semibold text-status-danger">
                        <ShieldOff size={14} /> إلغاء
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "reps" && (
        <div>
          <p className="mb-3 text-sm text-text-secondary">استخدم تبويب "الأدمن" للبحث عن الطالب أولًا، أو ابحث هنا مباشرة:</p>
          <Card className="mb-4 flex gap-2 p-3">
            <Input placeholder="بريد الطالب الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button size="sm" onClick={search} loading={searching}><Search size={16} /></Button>
          </Card>
          {found && (
            <Card hover={false} className="mb-4 flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{found.name}</p>
                <p className="text-xs text-text-secondary">{found.departmentId} · مرحلة {found.stage} · شعبة {found.section}</p>
              </div>
              <Button
                size="sm"
                onClick={async () => { await setClassRep(found.id, !found.isClassRep); setFound(null); setEmail(""); loadReps(); }}
              >
                {found.isClassRep ? "إلغاء تمثيل الشعبة" : "تعيين ممثل شعبة"}
              </Button>
            </Card>
          )}

          <p className="mb-3 text-sm font-bold text-text-primary">ممثلو الشعب الحاليون ({reps?.length ?? "…"})</p>
          {reps === null ? (
            <Skeleton className="h-24 w-full" />
          ) : reps.length === 0 ? (
            <Card hover={false}><EmptyState title="ماكو ممثلي شعب معيّنين بعد" /></Card>
          ) : (
            <div className="flex flex-col gap-2">
              {reps.map((r) => (
                <Card key={r.id} hover={false} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                    <p className="text-xs text-text-secondary">{r.departmentId} · مرحلة {r.stage} · شعبة {r.section}</p>
                  </div>
                  <button onClick={async () => { await setClassRep(r.id, false); loadReps(); }} className="flex items-center gap-1 text-xs font-semibold text-status-danger">
                    <UserX size={14} /> إلغاء
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "instructors" && (
        <div className="flex flex-col gap-8">
          <div>
            <p className="mb-3 text-sm font-bold text-text-primary">طلبات مواد إضافية من دكاترة معتمدين ({subjectRequests?.length ?? "…"})</p>
            {subjectRequests === null ? (
              <Skeleton className="h-24 w-full" />
            ) : subjectRequests.length === 0 ? (
              <Card hover={false}><EmptyState title="ماكو طلبات مواد إضافية حاليًا" /></Card>
            ) : (
              <div className="flex flex-col gap-3">
                {subjectRequests.map((inst) => {
                  const newIds = inst.requestedSubjectIds.filter((id) => !inst.approvedSubjectIds.includes(id));
                  return (
                    <Card key={inst.id} hover={false} className="p-4">
                      <p className="text-sm font-bold text-text-primary">{inst.name}</p>
                      <p className="text-xs text-text-secondary">{inst.email} · {inst.collegeId} - {inst.departmentId}</p>
                      <p className="mt-2 text-xs text-text-secondary">عدد المواد الإضافية المطلوبة: {newIds.length}</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={async () => { await approveAdditionalSubjects(inst); loadSubjectRequests(); }}>
                          <UserCheck size={14} /> اعتماد المواد الجديدة
                        </Button>
                        <button
                          onClick={async () => { await declineAdditionalSubjects(inst); loadSubjectRequests(); }}
                          className="flex items-center gap-1 rounded-btn border border-status-danger px-4 text-xs font-semibold text-status-danger"
                        >
                          رفض
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-text-primary">طلبات تسجيل الدكاترة الجدد ({pendingInstructors?.length ?? "…"})</p>
            {pendingInstructors === null ? (
              <Skeleton className="h-24 w-full" />
            ) : pendingInstructors.length === 0 ? (
              <Card hover={false}><EmptyState title="ماكو طلبات بانتظار المراجعة" /></Card>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingInstructors.map((inst) => (
                  <Card key={inst.id} hover={false} className="p-4">
                    <p className="text-sm font-bold text-text-primary">{inst.name}</p>
                    <p className="text-xs text-text-secondary">{inst.email} · {inst.collegeId} - {inst.departmentId}</p>
                    <p className="mt-2 text-xs text-text-secondary">عدد المواد المطلوبة: {inst.requestedSubjectIds.length}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => { await approveInstructor(inst.id, inst.requestedSubjectIds); loadInstructors(); }}
                      >
                        <UserCheck size={14} /> اعتماد
                      </Button>
                      <button
                        onClick={async () => { await rejectInstructor(inst.id); loadInstructors(); }}
                        className="flex items-center gap-1 rounded-btn border border-status-danger px-4 text-xs font-semibold text-status-danger"
                      >
                        رفض
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
