"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  ScheduleItem,
  HomeworkItem,
  ExamItem,
  scheduleItemFromDoc,
  homeworkItemFromDoc,
  examItemFromDoc,
} from "@/lib/types/models";

// مطابق لـ _scopedQuery في app_state.dart: يفلتر بنفس الأربعة حقول
// (department_id, stage, section, study_type) الخاصة بنطاق الطالب الحالي.
function useScopedCollection<T>(
  collectionName: string,
  fromDoc: (id: string, map: any) => T,
  sortFn: (a: T, b: T) => number
) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setItems([]);
      setLoading(false);
      return;
    }
    if (!currentUser.departmentId || !currentUser.studyType) {
      // الطالب ما أكمل onboarding بعد (بدون قسم/نوع دراسة) - ما فيه نطاق نقدر نفلتر بيه
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setError(null);
    const q = query(
      collection(db, collectionName),
      where("department_id", "==", currentUser.departmentId),
      where("stage", "==", currentUser.stage),
      where("section", "==", currentUser.section),
      where("study_type", "==", currentUser.studyType)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => fromDoc(d.id, d.data()));
        list.sort(sortFn);
        setItems(list);
        setLoading(false);
      },
      (err) => {
        setError(err?.message ?? "تعذّر تحميل البيانات");
        setLoading(false);
      }
    );
    return unsub;
  }, [currentUser?.departmentId, currentUser?.stage, currentUser?.section, currentUser?.studyType]);

  return { items, loading, error };
}

export function useScheduleStream() {
  const { items, loading, error } = useScopedCollection<ScheduleItem>(
    "schedule_items",
    scheduleItemFromDoc,
    (a, b) => (a.dayOfWeek !== b.dayOfWeek ? a.dayOfWeek - b.dayOfWeek : a.startTime.localeCompare(b.startTime))
  );
  return { schedule: items, loading, error };
}

export function useHomeworkStream() {
  const { items, loading, error } = useScopedCollection<HomeworkItem>(
    "homework_items",
    homeworkItemFromDoc,
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );
  return { homework: items, loading, error };
}

export function useExamStream() {
  const { items, loading, error } = useScopedCollection<ExamItem>(
    "exam_items",
    examItemFromDoc,
    (a, b) => a.examDate.getTime() - b.examDate.getTime()
  );
  return { exams: items, loading, error };
}
