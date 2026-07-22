"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSubjects } from "@/lib/hooks/useHomeData";
import {
  GradeSheet,
  StudentGradeRecord,
  gradeSheetFromDoc,
  studentGradeRecordFromDoc,
  gradeSheetId,
} from "@/lib/types/models";

export interface SubjectGradeResult {
  subjectId: string;
  subjectName: string;
  sheet: GradeSheet | null;
  record: StudentGradeRecord | null;
}

// مطابق حرفيًا لـ myGradeFor في app_state.dart: id = subjectId_section_studyType،
// يرجع null لو ما فيه ورقة درجات مرفوعة بعد لهذه المادة.
async function fetchGradeFor(subjectId: string, section: string, studyType: string, studentId: string) {
  const id = gradeSheetId(subjectId, section, studyType);
  const sheetSnap = await getDoc(doc(db, "grade_sheets", id));
  if (!sheetSnap.exists()) return null;
  const recordSnap = await getDoc(doc(db, "grade_sheets", id, "records", studentId));
  const sheet = gradeSheetFromDoc(sheetSnap.id, sheetSnap.data());
  const record = recordSnap.exists()
    ? studentGradeRecordFromDoc(studentId, recordSnap.data())
    : { studentId, scores: {} };
  return { sheet, record };
}

export function useMyGrades() {
  const { currentUser } = useAuth();
  const { subjects } = useSubjects();
  const [results, setResults] = useState<SubjectGradeResult[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentUser || subjects.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const all = await Promise.all(
      subjects.map(async (s) => {
        const g = await fetchGradeFor(s.id, currentUser.section, currentUser.studyType, currentUser.id);
        return { subjectId: s.id, subjectName: s.name, sheet: g?.sheet ?? null, record: g?.record ?? null };
      })
    );
    setResults(all);
    setLoading(false);
  }, [currentUser, subjects]);

  useEffect(() => {
    load();
  }, [load]);

  return { results, loading, refresh: load };
}
