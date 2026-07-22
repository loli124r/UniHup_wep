"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { ChevronLeft, HistoryIcon } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { GradeAuditEntry, gradeAuditEntryFromDoc } from "@/lib/types/models";
import { Card, Skeleton, EmptyState } from "@/components/ui/primitives";

function fmt(d: Date) {
  return d.toLocaleDateString("ar-IQ") + " " + d.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
}

function AuditInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sheetId = searchParams.get("sheetId") ?? "";
  const subjectName = searchParams.get("subjectName") ?? "";
  const [entries, setEntries] = useState<GradeAuditEntry[] | null>(null);

  useEffect(() => {
    if (!sheetId) return;
    (async () => {
      const snap = await getDocs(
        query(collection(db, "grade_sheets", sheetId, "audit_log"), orderBy("changed_at", "desc"), limit(200))
      );
      setEntries(snap.docs.map((d) => gradeAuditEntryFromDoc(d.id, d.data())));
    })();
  }, [sheetId]);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h1 className="text-xl font-extrabold text-text-primary">سجل تعديلات - {subjectName}</h1>

      {entries === null ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : entries.length === 0 ? (
        <Card hover={false}><EmptyState icon={<HistoryIcon size={40} />} title="ماكو تعديلات مسجّلة بعد" /></Card>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <Card key={e.id} hover={false} className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">{e.studentName}</p>
                <span className="text-xs text-text-disabled">{fmt(e.changedAt)}</span>
              </div>
              <p className="mt-1 text-xs text-text-secondary">
                {e.componentLabel}: {e.oldValue ?? "—"} ← {e.newValue}
              </p>
              <p className="mt-1 text-[11px] text-text-disabled">بواسطة {e.instructorName}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GradeAuditLogPage() {
  return (
    <Suspense fallback={null}>
      <AuditInner />
    </Suspense>
  );
}
