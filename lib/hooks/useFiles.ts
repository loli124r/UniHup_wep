"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { supabase, FILES_BUCKET, pathFromPublicUrl } from "@/lib/firebase/storage";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  FileItem,
  CommentItem,
  AttendanceSession,
  fileItemFromDoc,
  commentItemFromDoc,
  attendanceSessionFromDoc,
  isAnyAdmin,
} from "@/lib/types/models";

// مطابق حرفيًا لـ filesFor في app_state.dart: subject_id + approved==true،
// مرتبة created_at تنازليًا. (بدون طبقة الكاش المحلي SQLite الخاصة بالموبايل،
// لأن المتصفح أصلاً عنده IndexedDB cache من Firestore persistence).
export function useSubjectFiles(subjectId: string | undefined) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!subjectId) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "files"),
      where("subject_id", "==", subjectId),
      where("approved", "==", true),
      orderBy("created_at", "desc")
    );
    const snap = await getDocs(q);
    setFiles(snap.docs.map((d) => fileItemFromDoc(d.id, d.data())));
    setLoading(false);
  }, [subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  return { files, loading, refresh: load };
}

// مطابق حرفيًا لـ attendanceSessionsForSubject + myAttendanceRateFor:
// يرجع null لو ما فيه جلسات مسجّلة أو الطالب لم يظهر بأي جلسة بعد.
export function useMyAttendanceRate(subjectId: string | undefined) {
  const { currentUser } = useAuth();
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!subjectId || !currentUser) {
        setRate(null);
        return;
      }
      const snap = await getDocs(query(collection(db, "attendance"), where("subject_id", "==", subjectId)));
      const sessions: AttendanceSession[] = snap.docs.map((d) => attendanceSessionFromDoc(d.id, d.data()));
      const counted = sessions.filter((s) => currentUser.id in s.records);
      if (counted.length === 0) {
        if (active) setRate(null);
        return;
      }
      const present = counted.filter((s) => s.records[currentUser.id] !== "absent").length;
      if (active) setRate(present / counted.length);
    })();
    return () => {
      active = false;
    };
  }, [subjectId, currentUser?.id]);

  return rate;
}

// مطابق حرفيًا لـ commentsFor: files/{fileId}/comments مرتبة created_at تنازليًا.
export function useFileComments(fileId: string | undefined) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!fileId) {
        setComments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const q = query(collection(db, "files", fileId, "comments"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      if (active) {
        setComments(snap.docs.map((d) => commentItemFromDoc(d.id, d.data())));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fileId]);

  return { comments, loading };
}

// مطابق حرفيًا لـ deleteFile: صاحب الملف أو أي أدمن فقط، يحذف من Firestore
// ثم من Supabase Storage (يتجاهل فشل الحذف من الـ Storage لو الرابط تالف).
export function useDeleteFile() {
  const { currentUser } = useAuth();

  const canDelete = useCallback(
    (file: FileItem) => !!currentUser && (file.uploadedById === currentUser.id || isAnyAdmin(currentUser)),
    [currentUser]
  );

  const deleteFile = useCallback(
    async (file: FileItem): Promise<{ ok: boolean; error?: string }> => {
      if (!currentUser) return { ok: false, error: "يجب تسجيل الدخول" };
      if (!(file.uploadedById === currentUser.id || isAnyAdmin(currentUser))) {
        return { ok: false, error: "هذي الميزة متاحة فقط لصاحب الملف أو الأدمن" };
      }
      try {
        await deleteDoc(doc(db, "files", file.id));
        const path = pathFromPublicUrl(FILES_BUCKET, file.fileUrl);
        if (path) {
          await supabase.storage.from(FILES_BUCKET).remove([path]).catch(() => {});
        }
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message ?? "تعذّر حذف الملف" };
      }
    },
    [currentUser]
  );

  return { canDelete, deleteFile };
}
