"use client";

import { useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  documentId,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Subject,
  StudentProfile,
  AttendanceSession,
  GradeSheet,
  GradeComponent,
  StudentGradeRecord,
  GradeAuditEntry,
  subjectFromDoc,
  studentProfileFromDoc,
  attendanceSessionFromDoc,
  gradeSheetFromDoc,
  studentGradeRecordFromDoc,
  gradeSheetId,
} from "@/lib/types/models";

// مطابق حرفيًا لـ instructorSignUp
export function useInstructorSignUp() {
  return useCallback(
    async (opts: {
      email: string;
      password: string;
      name: string;
      collegeId: string;
      departmentId: string;
      requestedSubjectIds: string[];
    }) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, opts.email, opts.password);
        await import("firebase/firestore").then(({ setDoc }) =>
          setDoc(doc(db, "instructors", cred.user.uid), {
            name: opts.name,
            email: opts.email,
            college_id: opts.collegeId,
            department_id: opts.departmentId,
            requested_subject_ids: opts.requestedSubjectIds,
            approved_subject_ids: [],
            status: "pending",
            created_at: Date.now(),
          })
        );
        return null;
      } catch (e: any) {
        return e?.message ?? "فشل إنشاء الحساب";
      }
    },
    []
  );
}

// ميزة جديدة (غير موجودة بتطبيق Flutter الأصلي، أُضيفت بطلب صريح): تسمح
// للدكتور المعتمد بطلب تدريس مواد إضافية لاحقًا، بدون التأثير على مواده
// المعتمدة أصلاً ولا على حالة حسابه (يبقى approved طول الوقت). المواد
// الجديدة تُضاف فقط لـ requested_subject_ids بانتظار موافقة الأدمن، الذي
// يعتمدها لاحقًا فتُدمج مع approved_subject_ids.
export function useRequestAdditionalSubjects() {
  const { currentInstructor, refreshProfile } = useAuth();
  return useCallback(
    async (subjectIds: string[]) => {
      if (!currentInstructor) return { ok: false, error: "يجب تسجيل الدخول" };
      try {
        const merged = Array.from(new Set([...currentInstructor.requestedSubjectIds, ...subjectIds]));
        await import("firebase/firestore").then(({ updateDoc, doc }) =>
          updateDoc(doc(db, "instructors", currentInstructor.id), { requested_subject_ids: merged })
        );
        await refreshProfile();
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر إرسال الطلب" };
      }
    },
    [currentInstructor, refreshProfile]
  );
}

// مطابق لـ subjectsForDepartment: مواد كلية+قسم محدد (لاختيار المواد وقت التسجيل)
export function useSubjectsForDepartment() {
  return useCallback(async (collegeId: string, departmentId: string): Promise<Subject[]> => {
    if (!collegeId || !departmentId) return [];
    const snap = await getDocs(
      query(collection(db, "subjects"), where("college_id", "==", collegeId), where("department_id", "==", departmentId))
    );
    return snap.docs.map((d) => subjectFromDoc(d.id, d.data()));
  }, []);
}

// مطابق لـ refreshInstructorStatus (يعيد تحميل مستند instructors/{uid})
export function useRefreshInstructorStatus() {
  const { firebaseUser, refreshProfile } = useAuth();
  return useCallback(async () => {
    if (!firebaseUser) return;
    await refreshProfile();
  }, [firebaseUser, refreshProfile]);
}

// مطابق لـ subjectsByIds: يجيب مواد بالدفعات (حد whereIn=10)
export async function subjectsByIds(ids: string[]): Promise<Subject[]> {
  if (ids.length === 0) return [];
  const all: Subject[] = [];
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const snap = await getDocs(query(collection(db, "subjects"), where(documentId(), "in", chunk)));
    all.push(...snap.docs.map((d) => subjectFromDoc(d.id, d.data())));
  }
  return all;
}

// مطابق لـ rosterFor
export async function rosterFor(opts: { departmentId: string; stage: number; section: string; studyType: string }): Promise<StudentProfile[]> {
  const snap = await getDocs(
    query(
      collection(db, "students"),
      where("department_id", "==", opts.departmentId),
      where("stage", "==", opts.stage),
      where("section", "==", opts.section)
    )
  );
  let docs = snap.docs.map((d) => studentProfileFromDoc(d.id, d.data()));
  if (opts.studyType) docs = docs.filter((s) => s.studyType === opts.studyType);
  return docs;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// مطابق لـ fetchAttendanceSession / saveAttendanceSession (id ثابت: subjectId_date_section)
export async function fetchAttendanceSession(opts: { subjectId: string; date: Date; section: string }): Promise<AttendanceSession | null> {
  const id = `${opts.subjectId}_${dateKey(opts.date)}_${opts.section}`;
  const snap = await getDoc(doc(db, "attendance", id));
  return snap.exists() ? attendanceSessionFromDoc(snap.id, snap.data()) : null;
}

export function useSaveAttendanceSession() {
  const { currentInstructor } = useAuth();
  return useCallback(
    async (session: Omit<AttendanceSession, "id"> & { date: Date }) => {
      const id = `${session.subjectId}_${dateKey(session.date)}_${session.section}`;
      try {
        await import("firebase/firestore").then(({ setDoc }) =>
          setDoc(doc(db, "attendance", id), {
            subject_id: session.subjectId,
            subject_name: session.subjectName,
            college_id: session.collegeId,
            department_id: session.departmentId,
            stage: session.stage,
            section: session.section,
            study_type: session.studyType,
            instructor_id: currentInstructor?.id ?? "",
            date: session.date.toISOString(),
            records: session.records,
          })
        );
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر الحفظ" };
      }
    },
    [currentInstructor?.id]
  );
}

// مطابق لـ attendanceSessionsForSubject
export async function attendanceSessionsForSubject(subjectId: string): Promise<AttendanceSession[]> {
  const snap = await getDocs(query(collection(db, "attendance"), where("subject_id", "==", subjectId)));
  return snap.docs.map((d) => attendanceSessionFromDoc(d.id, d.data()));
}

// مطابق لـ fetchGradeSheet / gradeRecordsForSheet
export async function fetchGradeSheet(opts: { subjectId: string; section: string; studyType: string }): Promise<GradeSheet | null> {
  const id = gradeSheetId(opts.subjectId, opts.section, opts.studyType);
  const snap = await getDoc(doc(db, "grade_sheets", id));
  return snap.exists() ? gradeSheetFromDoc(snap.id, snap.data()) : null;
}

export async function gradeRecordsForSheet(sheetId: string): Promise<Record<string, StudentGradeRecord>> {
  const snap = await getDocs(collection(db, "grade_sheets", sheetId, "records"));
  const out: Record<string, StudentGradeRecord> = {};
  for (const d of snap.docs) out[d.id] = studentGradeRecordFromDoc(d.id, d.data());
  return out;
}

// مطابق لـ saveGradeSheet: batch write + مقارنة القديم بالجديد لتوليد audit log
export function useSaveGradeSheet() {
  const { currentInstructor } = useAuth();
  return useCallback(
    async (
      sheet: GradeSheet,
      studentRecords: Record<string, StudentGradeRecord>,
      studentNames: Record<string, string>
    ) => {
      try {
        const oldRecords = await gradeRecordsForSheet(sheet.id);
        const batch = writeBatch(db);
        const sheetRef = doc(db, "grade_sheets", sheet.id);
        batch.set(sheetRef, {
          subject_id: sheet.subjectId,
          subject_name: sheet.subjectName,
          college_id: sheet.collegeId,
          department_id: sheet.departmentId,
          stage: sheet.stage,
          section: sheet.section,
          study_type: sheet.studyType,
          instructor_id: currentInstructor?.id ?? "",
          system: sheet.system,
          components: sheet.components.map((c) => ({ key: c.key, label: c.label, max_score: c.maxScore })),
        });

        const auditEntries: Omit<GradeAuditEntry, "id">[] = [];
        for (const [studentId, record] of Object.entries(studentRecords)) {
          batch.set(doc(sheetRef, "records", studentId), { scores: record.scores });
          const oldScores = oldRecords[studentId]?.scores ?? {};
          for (const c of sheet.components) {
            const oldVal = oldScores[c.key];
            const newVal = record.scores[c.key] ?? 0;
            if (oldVal === newVal) continue;
            auditEntries.push({
              sheetId: sheet.id,
              studentId,
              studentName: studentNames[studentId] ?? "",
              componentKey: c.key,
              componentLabel: c.label,
              oldValue: oldVal ?? null,
              newValue: newVal,
              instructorId: currentInstructor?.id ?? "",
              instructorName: currentInstructor?.name ?? "",
              changedAt: new Date(),
            });
          }
        }
        for (const entry of auditEntries) {
          const ref = doc(collection(sheetRef, "audit_log"));
          batch.set(ref, {
            sheet_id: entry.sheetId,
            student_id: entry.studentId,
            student_name: entry.studentName,
            component_key: entry.componentKey,
            component_label: entry.componentLabel,
            old_value: entry.oldValue,
            new_value: entry.newValue,
            instructor_id: entry.instructorId,
            instructor_name: entry.instructorName,
            changed_at: entry.changedAt.toISOString(),
          });
        }
        await batch.commit();
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر الحفظ" };
      }
    },
    [currentInstructor?.id, currentInstructor?.name]
  );
}
