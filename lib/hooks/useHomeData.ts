"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Subject,
  Announcement,
  PromoBanner,
  subjectFromDoc,
  announcementFromDoc,
  promoBannerFromDoc,
} from "@/lib/types/models";

// مطابق لأول جزء من _loadContentForUser: يجيب مواد قسم/كلية الطالب الحالي.
export function useSubjects() {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setSubjects([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "subjects"),
      where("department_id", "==", currentUser.departmentId),
      where("college_id", "==", currentUser.collegeId)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSubjects(snap.docs.map((d) => subjectFromDoc(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [currentUser?.departmentId, currentUser?.collegeId]);

  return { subjects, loading };
}

// مطابق حرفيًا لـ announcementsStream في app_state.dart: 3 streams (قسم،
// كلية كاملة، عام) تُدمج وتُفلتر بـ stage/section/study_type ثم تُرتب.
export function useAnnouncements() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setAnnouncements([]);
      return;
    }
    let latestDept: Announcement[] = [];
    let latestCollegeWide: Announcement[] = [];
    let latestGeneral: Announcement[] = [];

    const emit = () => {
      const merged = [...latestDept, ...latestCollegeWide, ...latestGeneral]
        .filter(
          (a) =>
            (a.stage === null || a.stage === currentUser.stage) &&
            (a.section === null || a.section === currentUser.section) &&
            (a.studyType === null || a.studyType === "" || a.studyType === currentUser.studyType)
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setAnnouncements(merged);
    };

    const deptQ = query(
      collection(db, "announcements"),
      where("university_id", "==", currentUser.collegeId),
      where("department_id", "==", currentUser.departmentId),
      orderBy("created_at", "desc")
    );
    const collegeWideQ = query(
      collection(db, "announcements"),
      where("university_id", "==", currentUser.collegeId),
      where("department_id", "==", ""),
      orderBy("created_at", "desc")
    );
    const generalQ = query(
      collection(db, "announcements"),
      where("university_id", "==", ""),
      orderBy("created_at", "desc")
    );

    const unsub1 = onSnapshot(deptQ, (snap) => {
      latestDept = snap.docs.map((d) => announcementFromDoc(d.id, d.data()));
      emit();
    });
    const unsub2 = onSnapshot(collegeWideQ, (snap) => {
      latestCollegeWide = snap.docs.map((d) => announcementFromDoc(d.id, d.data()));
      emit();
    });
    const unsub3 = onSnapshot(generalQ, (snap) => {
      latestGeneral = snap.docs.map((d) => announcementFromDoc(d.id, d.data()));
      emit();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [currentUser?.collegeId, currentUser?.departmentId, currentUser?.stage, currentUser?.section, currentUser?.studyType]);

  return { announcements };
}

// مطابق حرفيًا لـ promoBannersStream: بانرات الجامعة (department_id فاضي)
// + بانرات القسم تحديدًا، مدموجة ومرتبة بـ order ثم created_at تنازليًا.
export function usePromoBanners() {
  const { currentUser } = useAuth();
  const [banners, setBanners] = useState<PromoBanner[]>([]);

  useEffect(() => {
    if (!currentUser || !currentUser.collegeId) {
      setBanners([]);
      return;
    }
    let latestUniversity: PromoBanner[] = [];
    let latestDepartment: PromoBanner[] = [];

    const emit = () => {
      const merged = [...latestUniversity, ...latestDepartment].sort((a, b) => {
        const byOrder = a.order - b.order;
        return byOrder !== 0 ? byOrder : b.createdAt.getTime() - a.createdAt.getTime();
      });
      setBanners(merged);
    };

    const uniQ = query(
      collection(db, "promo_banners"),
      where("university_id", "==", currentUser.collegeId),
      where("department_id", "==", ""),
      where("active", "==", true)
    );
    const deptQ = query(
      collection(db, "promo_banners"),
      where("university_id", "==", currentUser.collegeId),
      where("department_id", "==", currentUser.departmentId),
      where("active", "==", true)
    );

    const unsub1 = onSnapshot(uniQ, (snap) => {
      latestUniversity = snap.docs.map((d) => promoBannerFromDoc(d.id, d.data()));
      emit();
    });
    const unsub2 = onSnapshot(deptQ, (snap) => {
      latestDepartment = snap.docs.map((d) => promoBannerFromDoc(d.id, d.data()));
      emit();
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [currentUser?.collegeId, currentUser?.departmentId]);

  return { banners };
}
