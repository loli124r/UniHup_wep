"use client";

import { useCallback } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { supabase, PROMO_BANNERS_BUCKET, safeStoragePathSegment, pathFromPublicUrl } from "@/lib/firebase/storage";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Subject,
  StudentProfile,
  InstructorProfile,
  PromoBanner,
  subjectFromDoc,
  studentProfileFromDoc,
  instructorProfileFromDoc,
  promoBannerFromDoc,
} from "@/lib/types/models";

// ---------------- إدارة المواد ----------------

export function useSubjectsForDepartmentAdmin() {
  return useCallback(async (collegeId: string, departmentId: string): Promise<Subject[]> => {
    if (!collegeId || !departmentId) return [];
    const snap = await getDocs(
      query(collection(db, "subjects"), where("college_id", "==", collegeId), where("department_id", "==", departmentId))
    );
    return snap.docs.map((d) => subjectFromDoc(d.id, d.data()));
  }, []);
}

export function useCreateSubject() {
  const { currentUser } = useAuth();
  return useCallback(
    async (opts: { name: string; stage: number; collegeId?: string; departmentId?: string; primaryType: string }) => {
      if (!currentUser) return { ok: false, error: "غير مصرح" };
      const isSuper = currentUser.role === "super_admin";
      const college = isSuper ? opts.collegeId ?? "" : currentUser.adminCollegeId;
      const department = isSuper ? opts.departmentId ?? "" : currentUser.adminDepartmentId;
      if (!college || !department) return { ok: false, error: "حدد الكلية والقسم أولًا" };
      try {
        await addDoc(collection(db, "subjects"), {
          name: opts.name,
          stage: opts.stage,
          college_id: college,
          department_id: department,
          files_count: 0,
          primary_type: opts.primaryType,
        });
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر إضافة المادة" };
      }
    },
    [currentUser]
  );
}

export function useDeleteSubject() {
  return useCallback(async (subject: Subject) => {
    try {
      await deleteDoc(doc(db, "subjects", subject.id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر حذف المادة" };
    }
  }, []);
}

// ---------------- إدارة الأدمن وممثلي الشعب ----------------

export function useFindStudentByEmail() {
  return useCallback(async (email: string): Promise<StudentProfile | null> => {
    const snap = await getDocs(query(collection(db, "students"), where("email", "==", email.trim()), fbLimit(1)));
    if (snap.empty) return null;
    return studentProfileFromDoc(snap.docs[0].id, snap.docs[0].data());
  }, []);
}

export function useListAllAdmins() {
  return useCallback(async (): Promise<StudentProfile[]> => {
    const snap = await getDocs(query(collection(db, "students"), where("role", "in", ["dept_admin", "super_admin"])));
    return snap.docs.map((d) => studentProfileFromDoc(d.id, d.data()));
  }, []);
}

export function useListClassReps() {
  return useCallback(async (): Promise<StudentProfile[]> => {
    const snap = await getDocs(query(collection(db, "students"), where("is_class_rep", "==", true)));
    return snap.docs.map((d) => studentProfileFromDoc(d.id, d.data()));
  }, []);
}

export function usePromoteToDeptAdmin() {
  return useCallback(
    async (uid: string, opts: { collegeId: string; departmentId: string; stage: number; section: string; studyType: string }) => {
      try {
        await updateDoc(doc(db, "students", uid), {
          role: "dept_admin",
          admin_college_id: opts.collegeId,
          admin_department_id: opts.departmentId,
          admin_stage: opts.stage,
          admin_section: opts.section,
          admin_study_type: opts.studyType,
        });
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر الترقية" };
      }
    },
    []
  );
}

export function useDemoteToStudent() {
  return useCallback(async (uid: string) => {
    try {
      await updateDoc(doc(db, "students", uid), {
        role: "student",
        admin_college_id: "",
        admin_department_id: "",
        admin_stage: 0,
        admin_section: "",
        admin_study_type: "",
      });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر إلغاء الصلاحيات" };
    }
  }, []);
}

export function useSetClassRep() {
  return useCallback(async (uid: string, value: boolean) => {
    try {
      await updateDoc(doc(db, "students", uid), { is_class_rep: value });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر التحديث" };
    }
  }, []);
}

// ميزة جديدة: يجيب الدكاترة المعتمدين اللي عندهم طلبات مواد إضافية لسه ما
// اتّعمدت (requested_subject_ids فيها مواد زايدة عن approved_subject_ids).
export function useListInstructorsWithPendingSubjectRequests() {
  return useCallback(async (): Promise<InstructorProfile[]> => {
    const snap = await getDocs(query(collection(db, "instructors"), where("status", "==", "approved")));
    return snap.docs
      .map((d) => instructorProfileFromDoc(d.id, d.data()))
      .filter((i) => i.requestedSubjectIds.some((id) => !i.approvedSubjectIds.includes(id)));
  }, []);
}

export function useApproveAdditionalSubjects() {
  return useCallback(async (instructor: InstructorProfile) => {
    try {
      const merged = Array.from(new Set([...instructor.approvedSubjectIds, ...instructor.requestedSubjectIds]));
      await updateDoc(doc(db, "instructors", instructor.id), { approved_subject_ids: merged });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر الاعتماد" };
    }
  }, []);
}

export function useDeclineAdditionalSubjects() {
  return useCallback(async (instructor: InstructorProfile) => {
    try {
      // رجّع requested لنفس approved الحالية (إلغاء الطلبات الزايدة فقط)
      await updateDoc(doc(db, "instructors", instructor.id), { requested_subject_ids: instructor.approvedSubjectIds });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر الرفض" };
    }
  }, []);
}

export function useListPendingInstructors() {
  return useCallback(async (): Promise<InstructorProfile[]> => {
    const snap = await getDocs(query(collection(db, "instructors"), where("status", "==", "pending")));
    return snap.docs.map((d) => instructorProfileFromDoc(d.id, d.data()));
  }, []);
}

export function useApproveInstructor() {
  return useCallback(async (instructorId: string, approvedSubjectIds: string[]) => {
    try {
      await updateDoc(doc(db, "instructors", instructorId), { status: "approved", approved_subject_ids: approvedSubjectIds });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر الاعتماد" };
    }
  }, []);
}

export function useRejectInstructor() {
  return useCallback(async (instructorId: string) => {
    try {
      await updateDoc(doc(db, "instructors", instructorId), { status: "rejected" });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر الرفض" };
    }
  }, []);
}

// ---------------- البانرات الإعلانية ----------------

export function useListAllPromoBanners() {
  return useCallback(async (): Promise<PromoBanner[]> => {
    const snap = await getDocs(query(collection(db, "promo_banners"), orderBy("created_at", "desc")));
    return snap.docs.map((d) => promoBannerFromDoc(d.id, d.data()));
  }, []);
}

export function useUploadPromoBanner() {
  const { currentUser } = useAuth();
  return useCallback(
    async (opts: { file: File; universityId: string; departmentId?: string }) => {
      try {
        const fileName = `${Date.now()}_${safeStoragePathSegment(opts.file.name)}`;
        const path = `${safeStoragePathSegment(opts.universityId)}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from(PROMO_BANNERS_BUCKET).upload(path, opts.file);
        if (uploadError) return { ok: false, error: uploadError.message };
        const { data } = supabase.storage.from(PROMO_BANNERS_BUCKET).getPublicUrl(path);
        await addDoc(collection(db, "promo_banners"), {
          image_url: data.publicUrl,
          university_id: opts.universityId,
          department_id: opts.departmentId ?? "",
          order: 0,
          active: true,
          created_by_name: currentUser?.name ?? "",
          created_at: Date.now(),
        });
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر رفع الصورة" };
      }
    },
    [currentUser]
  );
}

export function useDeletePromoBanner() {
  return useCallback(async (banner: PromoBanner) => {
    try {
      await deleteDoc(doc(db, "promo_banners", banner.id));
      const path = pathFromPublicUrl(PROMO_BANNERS_BUCKET, banner.imageUrl);
      if (path) await supabase.storage.from(PROMO_BANNERS_BUCKET).remove([path]).catch(() => {});
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر الحذف" };
    }
  }, []);
}

export function useTogglePromoBannerActive() {
  return useCallback(async (banner: PromoBanner) => {
    try {
      await updateDoc(doc(db, "promo_banners", banner.id), { active: !banner.active });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر التحديث" };
    }
  }, []);
}

// ---------------- البث الإداري ----------------

export function usePostAdminAnnouncement() {
  const { currentUser } = useAuth();
  return useCallback(
    async (opts: {
      title: string;
      message: string;
      stage?: number | null;
      section?: string | null;
      studyType?: string | null;
      urgent?: boolean;
      general?: boolean;
      overrideCollegeId?: string;
      overrideDepartmentId?: string;
    }) => {
      if (!currentUser) return { ok: false, error: "غير مصرح" };
      try {
        await addDoc(collection(db, "announcements"), {
          title: opts.title,
          message: opts.message,
          university_id: opts.general ? "" : opts.overrideCollegeId ?? currentUser.collegeId,
          department_id: opts.general ? "" : opts.overrideDepartmentId ?? currentUser.departmentId,
          stage: opts.general ? null : opts.stage ?? null,
          section: opts.general ? null : opts.section ?? null,
          study_type: opts.general ? null : opts.studyType ?? null,
          urgent: opts.urgent ?? false,
          author_name: currentUser.name,
          created_at: Date.now(),
        });
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر نشر الإعلان" };
      }
    },
    [currentUser]
  );
}

export function useExamsForScope() {
  return useCallback(
    async (opts: { departmentId: string; stage: number; section?: string; studyType?: string }) => {
      let q = query(collection(db, "exam_items"), where("department_id", "==", opts.departmentId), where("stage", "==", opts.stage));
      const snap = await getDocs(q);
      const { examItemFromDoc } = await import("@/lib/types/models");
      let docs = snap.docs.map((d) => examItemFromDoc(d.id, d.data()));
      if (opts.section) docs = docs.filter((e) => e.section === opts.section);
      if (opts.studyType) docs = docs.filter((e) => e.studyType === opts.studyType);
      return docs;
    },
    []
  );
}

export function usePostponeExam() {
  return useCallback(async (id: string, opts: { newDate?: Date; note?: string }) => {
    try {
      const patch: Record<string, any> = { postponed: true, postponed_note: opts.note ?? null };
      if (opts.newDate) patch.exam_date = opts.newDate.toISOString();
      await updateDoc(doc(db, "exam_items", id), patch);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر تسجيل التأجيل" };
    }
  }, []);
}

export function useAddExam() {
  return useCallback(
    async (opts: {
      subjectName: string;
      title: string;
      departmentId: string;
      stage: number;
      section: string;
      studyType: string;
      room: string;
      examDate: Date;
    }) => {
      try {
        await addDoc(collection(db, "exam_items"), {
          subject_name: opts.subjectName,
          title: opts.title,
          department_id: opts.departmentId,
          stage: opts.stage,
          section: opts.section,
          study_type: opts.studyType,
          room: opts.room,
          exam_date: opts.examDate.toISOString(),
          postponed: false,
        });
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر إضافة الامتحان" };
      }
    },
    []
  );
}
