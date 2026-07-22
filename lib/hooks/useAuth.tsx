"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import {
  StudentProfile,
  InstructorProfile,
  studentProfileFromDoc,
  studentProfileToMap,
  instructorProfileFromDoc,
} from "@/lib/types/models";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  currentUser: StudentProfile | null;
  currentInstructor: InstructorProfile | null;
  isInstructor: boolean;
  loading: boolean;
  lastError: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// نفس منطق _tryLoadInstructor في app_state.dart: يتحقق أولاً هل الحساب
// موجود بكولكشن instructors (منفصل تمامًا عن students).
async function tryLoadInstructor(uid: string): Promise<InstructorProfile | null> {
  try {
    const snap = await getDoc(doc(db, "instructors", uid));
    if (snap.exists()) return instructorProfileFromDoc(snap.id, snap.data());
  } catch {
    // تجاهل: نكمل بمسار الطالب العادي
  }
  return null;
}

// نفس منطق _loadOrCreateProfile: يجيب بروفايل الطالب لو موجود، أو ينشئه
// بحد أدنى من البيانات (onboarding يُكمَّل لاحقًا باختيار القسم/المرحلة).
async function loadOrCreateProfile(uid: string, email: string | null, displayName: string | null): Promise<StudentProfile> {
  const ref = doc(db, "students", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return studentProfileFromDoc(snap.id, snap.data());
  }
  const fresh: StudentProfile = {
    id: uid,
    name: displayName || "طالب جديد",
    email: email || "",
    provinceId: "",
    universityId: "",
    collegeId: "",
    departmentId: "",
    stage: 1,
    section: "أ",
    studyType: "",
    isClassRep: false,
    role: "student",
    adminCollegeId: "",
    adminDepartmentId: "",
    adminStage: 0,
    adminSection: "",
    adminStudyType: "",
    uploadsCount: 0,
    points: 0,
    savedCount: 0,
    notifyNewContent: true,
    notifyAnnouncements: true,
    notifyComments: true,
    followedSubjectIds: [],
  };
  await setDoc(ref, studentProfileToMap(fresh));
  return fresh;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<StudentProfile | null>(null);
  const [currentInstructor, setCurrentInstructor] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const loadAll = useCallback(async (user: FirebaseUser) => {
    const instructor = await tryLoadInstructor(user.uid);
    if (instructor) {
      setCurrentInstructor(instructor);
      setCurrentUser(null);
    } else {
      const profile = await loadOrCreateProfile(user.uid, user.email, user.displayName);
      setCurrentUser(profile);
      setCurrentInstructor(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          await loadAll(user);
        } catch (e: any) {
          setLastError(e?.message ?? "تعذّر تحميل بيانات حسابك");
        }
      } else {
        setCurrentUser(null);
        setCurrentInstructor(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadAll]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await loadAll(cred.user);
      return null;
    } catch (e: any) {
      // نفس صيغة رسالة الخطأ في Flutter: "code: message"
      return `${e?.code ?? "error"}: ${e?.message ?? "فشل تسجيل الدخول"}`;
    }
  }, [loadAll]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profile = await loadOrCreateProfile(cred.user.uid, cred.user.email, cred.user.displayName);
      setCurrentUser(profile);
      return null;
    } catch (e: any) {
      return e?.message ?? "فشل إنشاء الحساب";
    }
  }, []);

  const logout = useCallback(async () => {
    await fbSignOut(auth);
    setCurrentUser(null);
    setCurrentInstructor(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await loadAll(firebaseUser);
  }, [firebaseUser, loadAll]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentUser,
        currentInstructor,
        isInstructor: currentInstructor !== null,
        loading,
        lastError,
        login,
        signUp,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
