"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Search, X, BookOpen, FileText } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSubjects } from "@/lib/hooks/useHomeData";
import { Card, Skeleton } from "@/components/ui/primitives";
import { Subject, FileItem, fileItemFromDoc } from "@/lib/types/models";
import { fileTypeColor } from "@/lib/constants/fileType";

function useWarmSearchIndex(stageSubjects: Subject[]) {
  const [filesBySubject, setFilesBySubject] = useState<Record<string, FileItem[]>>({});
  const [warming, setWarming] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (stageSubjects.length === 0) {
        setWarming(false);
        return;
      }
      setWarming(true);
      const entries = await Promise.all(
        stageSubjects.map(async (s) => {
          const q = query(collection(db, "files"), where("subject_id", "==", s.id), where("approved", "==", true));
          const snap = await getDocs(q);
          return [s.id, snap.docs.map((d) => fileItemFromDoc(d.id, d.data()))] as const;
        })
      );
      if (active) {
        setFilesBySubject(Object.fromEntries(entries));
        setWarming(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [stageSubjects.map((s) => s.id).join(",")]);

  return { filesBySubject, warming };
}

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { subjects } = useSubjects();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const stageSubjects = useMemo(
    () => subjects.filter((s) => s.stage === (currentUser?.stage ?? 1)),
    [subjects, currentUser?.stage]
  );
  const { filesBySubject, warming } = useWarmSearchIndex(stageSubjects);

  const query_ = q.trim().toLowerCase();

  const matchedSubjects = query_ ? stageSubjects.filter((s) => s.name.toLowerCase().includes(query_)) : [];
  const matchedFiles = query_
    ? stageSubjects.flatMap((s) =>
        (filesBySubject[s.id] ?? []).filter(
          (f) => f.title.toLowerCase().includes(query_) || f.type.toLowerCase().includes(query_)
        )
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 rounded-input border border-border bg-white px-4 h-12 max-w-xl">
        <Search size={18} className="text-text-disabled" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن مادة، ملازمة، سؤال..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled"
        />
        {q && (
          <button onClick={() => setQ("")}>
            <X size={16} className="text-text-disabled" />
          </button>
        )}
      </div>

      {warming ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : !query_ ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-text-secondary">
          <Search size={40} className="text-text-disabled" />
          <p className="text-sm">اكتب اسم مادة أو ملازمة أو نوع ملف للبحث</p>
        </div>
      ) : matchedSubjects.length === 0 && matchedFiles.length === 0 ? (
        <div className="py-20 text-center text-sm text-text-secondary">ماكو نتائج مطابقة</div>
      ) : (
        <div className="flex flex-col gap-6">
          {matchedSubjects.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-bold text-text-secondary">المواد</p>
              <div className="flex flex-col gap-2">
                {matchedSubjects.map((s) => (
                  <Card
                    key={s.id}
                    hover={false}
                    className="flex cursor-pointer items-center gap-3 p-4"
                    onClick={() => router.push(`/subjects/${s.id}`)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-blue text-white">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-text-secondary">{s.filesCount} ملف</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {matchedFiles.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-bold text-text-secondary">الملفات</p>
              <div className="flex flex-col gap-2">
                {matchedFiles.map((f) => {
                  const color = fileTypeColor(f.type);
                  return (
                    <Card
                      key={f.id}
                      hover={false}
                      className="flex cursor-pointer items-center gap-3 p-4"
                      onClick={() => router.push(`/files/${f.id}`)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22` }}>
                        <FileText size={18} style={{ color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{f.title}</p>
                        <p className="text-xs" style={{ color }}>{f.type}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchInner />
    </Suspense>
  );
}
