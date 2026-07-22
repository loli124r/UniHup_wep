"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { AppNotification, Subject, subjectFromDoc } from "@/lib/types/models";

// مطابق حرفيًا لتحميل notifications في _loadContentForUser: جلب لمرة وحدة،
// limit 30، مرتبة created_at تنازليًا، مع markAllNotificationsRead بالباتش.
export function useNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "notifications"),
      where("student_id", "==", currentUser.id),
      orderBy("created_at", "desc"),
      limit(30)
    );
    const snap = await getDocs(q);
    setNotifications(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          studentId: data.student_id,
          title: data.title,
          message: data.message,
          targetType: data.target_type,
          unread: data.unread ?? true,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        } as AppNotification;
      })
    );
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = useCallback(async () => {
    if (!currentUser || notifications.length === 0) return;
    const batch = writeBatch(db);
    for (const n of notifications) {
      if (n.unread) batch.update(doc(db, "notifications", n.id), { unread: false });
    }
    await batch.commit();
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, [currentUser, notifications]);

  return { notifications, loading, markAllRead, refresh: load };
}

// مطابق لـ postAnnouncement (نطاق ممثل الشعبة: شعبته فقط أو كل المرحلة).
export function usePostAnnouncement() {
  const { currentUser } = useAuth();

  return useCallback(
    async (title: string, message: string, scope: "section" | "stage") => {
      if (!currentUser) return false;
      if (!currentUser.isClassRep) return false;
      await addDoc(collection(db, "announcements"), {
        title,
        message,
        university_id: currentUser.collegeId,
        department_id: currentUser.departmentId,
        stage: currentUser.stage,
        section: scope === "section" ? currentUser.section : null,
        study_type: null,
        urgent: false,
        author_name: currentUser.name,
        created_at: Date.now(),
      });
      return true;
    },
    [currentUser]
  );
}

// مطابق لـ updateAccountName + updateNotificationPreferences + toggleFollowSubject.
export function useProfileActions() {
  const { currentUser, refreshProfile } = useAuth();

  const updateAccountName = useCallback(
    async (name: string) => {
      if (!currentUser) return { ok: false, error: "يجب تسجيل الدخول" };
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, error: "الاسم لا يمكن أن يكون فاضي" };
      await updateDoc(doc(db, "students", currentUser.id), { name: trimmed });
      await refreshProfile();
      return { ok: true };
    },
    [currentUser, refreshProfile]
  );

  const updateNotificationPreferences = useCallback(
    async (prefs: { notifyNewContent?: boolean; notifyAnnouncements?: boolean; notifyComments?: boolean }) => {
      if (!currentUser) return false;
      const patch: Record<string, boolean> = {};
      if (prefs.notifyNewContent !== undefined) patch.notify_new_content = prefs.notifyNewContent;
      if (prefs.notifyAnnouncements !== undefined) patch.notify_announcements = prefs.notifyAnnouncements;
      if (prefs.notifyComments !== undefined) patch.notify_comments = prefs.notifyComments;
      await updateDoc(doc(db, "students", currentUser.id), patch);
      await refreshProfile();
      return true;
    },
    [currentUser, refreshProfile]
  );

  const toggleFollowSubject = useCallback(
    async (subjectId: string) => {
      if (!currentUser) return false;
      const wasFollowing = currentUser.followedSubjectIds.includes(subjectId);
      const updated = wasFollowing
        ? currentUser.followedSubjectIds.filter((id) => id !== subjectId)
        : [...currentUser.followedSubjectIds, subjectId];
      await updateDoc(doc(db, "students", currentUser.id), { followed_subject_ids: updated });
      await refreshProfile();
      return true;
    },
    [currentUser, refreshProfile]
  );

  return { updateAccountName, updateNotificationPreferences, toggleFollowSubject };
}

// مطابق لـ followedSubjects: يجيب المواد المتابَعة على دفعات من 10 (حد
// whereIn في Firestore)، تمامًا كما في app_state.dart.
// مطابق لـ completeOnboarding: يحفظ كل حقول القسم/المرحلة دفعة وحدة.
export function useCompleteOnboarding() {
  const { currentUser, refreshProfile } = useAuth();

  return useCallback(
    async (opts: { college: string; department: string; stage: number; section: string; studyType: string }) => {
      if (!currentUser) return false;
      await updateDoc(doc(db, "students", currentUser.id), {
        college_id: opts.college,
        department_id: opts.department,
        stage: opts.stage,
        section: opts.section,
        study_type: opts.studyType,
      });
      await refreshProfile();
      return true;
    },
    [currentUser, refreshProfile]
  );
}

export function useFollowedSubjects() {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  const load = useCallback(async () => {
    if (!currentUser || currentUser.followedSubjectIds.length === 0) {
      setSubjects([]);
      return;
    }
    const ids = currentUser.followedSubjectIds;
    const all: Subject[] = [];
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      const snap = await getDocs(query(collection(db, "subjects"), where(documentId(), "in", chunk)));
      all.push(...snap.docs.map((d) => subjectFromDoc(d.id, d.data())));
    }
    setSubjects(all);
  }, [currentUser?.id, currentUser?.followedSubjectIds.join(",")]);

  useEffect(() => {
    load();
  }, [load]);

  return { subjects, refresh: load };
}
