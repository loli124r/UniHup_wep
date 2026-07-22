"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AiContentPack, aiContentPackFromMap } from "@/lib/services/aiAssistantEngine";
import { aiContentPackToMap } from "@/lib/services/localAiGenerator";
import { useAuth } from "@/lib/hooks/useAuth";

// مطابق حرفيًا لـ aiContentStream: ai_content/{fileId} بالـ Firestore.
export function useAiContentStream(fileId: string | undefined) {
  const [pack, setPack] = useState<AiContentPack | null | undefined>(undefined); // undefined = لسه يحمّل
  useEffect(() => {
    if (!fileId) {
      setPack(null);
      return;
    }
    setPack(undefined);
    const unsub = onSnapshot(doc(db, "ai_content", fileId), (snap) => {
      setPack(snap.exists() ? aiContentPackFromMap(snap.data()) : null);
    });
    return unsub;
  }, [fileId]);

  return pack;
}

// حفظ حزمة تم توليدها محليًا بالمتصفح لتصبح دائمة ومشتركة لكل الطلاب —
// نفس أثر uploadAiContent بـ app_state.dart، لكن مصدرها توليد محلي مباشر
// بدل رفع ملف JSON خارجي من سكربت بايثون. سوبر أدمن/أدمن أو ممثل الشعبة فقط.
export function useSaveAiContentForEveryone() {
  const { currentUser } = useAuth();
  return async (pack: AiContentPack) => {
    if (!currentUser?.isClassRep && currentUser?.role === "student") {
      return { ok: false, error: "هذي الميزة متاحة فقط لممثل الشعبة أو الأدمن" };
    }
    try {
      await setDoc(doc(db, "ai_content", pack.fileId), aiContentPackToMap(pack));
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "تعذّر الحفظ" };
    }
  };
}
