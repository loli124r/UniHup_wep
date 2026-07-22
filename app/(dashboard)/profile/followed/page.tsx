"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Bookmark } from "lucide-react";
import { useFollowedSubjects, useProfileActions } from "@/lib/hooks/useProfileData";
import { Card, Skeleton, EmptyState } from "@/components/ui/primitives";

export default function FollowedSubjectsPage() {
  const router = useRouter();
  const { subjects, refresh } = useFollowedSubjects();
  const { toggleFollowSubject } = useProfileActions();

  async function unfollow(id: string) {
    await toggleFollowSubject(id);
    await refresh();
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <button onClick={() => router.back()} className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ChevronLeft size={16} /> رجوع
      </button>
      <h2 className="text-2xl font-extrabold text-text-primary">المواد التي أتابعها</h2>

      {subjects === null ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : subjects.length === 0 ? (
        <Card hover={false}>
          <EmptyState
            icon={<Bookmark size={40} />}
            title="ما تابعت أي مادة بعد"
            description="اضغط أيقونة العلامة بصفحة أي مادة عشان تضيفها هنا."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {subjects.map((s) => (
            <Card key={s.id} hover={false} className="flex items-center justify-between p-4">
              <button className="text-right" onClick={() => router.push(`/subjects/${s.id}`)}>
                <p className="text-sm font-semibold text-text-primary">{s.name}</p>
                <p className="text-xs text-text-secondary">المرحلة {s.stage} · {s.filesCount} ملف</p>
              </button>
              <button onClick={() => unfollow(s.id)} className="text-status-warning">
                <Bookmark size={20} fill="currentColor" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
