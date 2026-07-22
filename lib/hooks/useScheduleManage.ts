"use client";

import { useCallback } from "react";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { scheduleItemToMap, ScheduleItem, isAnyAdmin } from "@/lib/types/models";

function canManageSchedule(user: ReturnType<typeof useAuth>["currentUser"]) {
  return !!user && (user.isClassRep || isAnyAdmin(user));
}

export function useCanManageSchedule() {
  const { currentUser } = useAuth();
  return canManageSchedule(currentUser);
}

// نفس منطق _resolveScope في schedule_screen.dart: ممثل الشعبة أو أدمن قسم
// بنطاق كامل التحديد ياخذ نطاقه تلقائيًا؛ غير هيك المستدعي (الصفحة) لازم
// يعرض اختيار يدوي (قسم/مرحلة/شعبة/نوع دراسة).
export function useResolveScope() {
  const { currentUser } = useAuth();
  return useCallback(() => {
    if (!currentUser) return null;
    if (!isAnyAdmin(currentUser)) {
      return { departmentId: currentUser.departmentId, stage: currentUser.stage, section: currentUser.section, studyType: currentUser.studyType };
    }
    const fullySpecific =
      currentUser.adminDepartmentId && currentUser.adminStage !== 0 && currentUser.adminSection && currentUser.adminStudyType;
    if (currentUser.role === "dept_admin" && fullySpecific) {
      return {
        departmentId: currentUser.adminDepartmentId,
        stage: currentUser.adminStage,
        section: currentUser.adminSection,
        studyType: currentUser.adminStudyType,
      };
    }
    return null; // يحتاج اختيار يدوي بالواجهة
  }, [currentUser]);
}

export function useAddScheduleItem() {
  return useCallback(async (item: Omit<ScheduleItem, "id">) => {
    try {
      await addDoc(collection(db, "schedule_items"), scheduleItemToMap(item));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر إضافة المحاضرة" };
    }
  }, []);
}

export function useAddHomeworkItem() {
  return useCallback(
    async (item: { subjectName: string; title: string; departmentId: string; stage: number; section: string; studyType: string; dueDate: Date }) => {
      try {
        await addDoc(collection(db, "homework_items"), {
          subject_name: item.subjectName,
          title: item.title,
          department_id: item.departmentId,
          stage: item.stage,
          section: item.section,
          study_type: item.studyType,
          due_date: item.dueDate.toISOString(),
        });
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر إضافة الواجب" };
      }
    },
    []
  );
}

export function useDeleteScheduleItem() {
  return useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "schedule_items", id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر حذف المحاضرة" };
    }
  }, []);
}

export function useDeleteHomeworkItem() {
  return useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "homework_items", id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر حذف الواجب" };
    }
  }, []);
}

export function useDeleteExamItem() {
  return useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "exam_items", id));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر حذف الامتحان" };
    }
  }, []);
}
