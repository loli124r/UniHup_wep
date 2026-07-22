"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trash2, ThumbsUp, Bookmark, Sparkles, FileIcon, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useFileComments, useDeleteFile } from "@/lib/hooks/useFiles";
import { Card, Skeleton, EmptyState, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { FileItem, fileItemFromDoc } from "@/lib/types/models";
import { fileTypeColor } from "@/lib/constants/fileType";

export default function FileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { comments, loading: commentsLoading } = useFileComments(params.id);
  const { canDelete, deleteFile } = useDeleteFile();

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const snap = await getDoc(doc(db, "files", params.id));
      if (active) {
        setFile(snap.exists() ? fileItemFromDoc(snap.id, snap.data()) : null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.id]);

  async function handleDelete() {
    if (!file) return;
    setDeleting(true);
    const res = await deleteFile(file);
    setDeleting(false);
    setConfirmOpen(false);
    if (res.ok) {
      router.back();
    } else {
      setError(res.error ?? "تعذّر حذف الملف");
    }
  }

  if (loading) return <Skeleton className="h-64 w-full max-w-2xl" />;
  if (!file) return <Card hover={false}><EmptyState title="الملف غير موجود" /></Card>;

  const color = fileTypeColor(file.type);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary">
          <ChevronLeft size={16} /> رجوع
        </button>
        {canDelete(file) && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1 text-sm font-semibold text-status-danger hover:opacity-80"
          >
            <Trash2 size={16} /> حذف الملف
          </button>
        )}
      </div>

      {error && <p className="rounded-xl bg-status-danger/10 px-3 py-2 text-sm text-status-danger">{error}</p>}

      <div>
        <Badge tone="info" className="mb-3"><span style={{ color }}>{file.type}</span></Badge>
        <h2 className="text-xl font-bold text-text-primary">{file.title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{file.uploadedByName}</p>
      </div>

      <Card hover={false} className="flex h-56 flex-col items-center justify-center gap-2 text-text-secondary">
        <FileIcon size={30} />
        <p className="text-sm">معاينة الملف (PDF)</p>
      </Card>

      <Button
        variant="secondary"
        onClick={() => router.push(`/ai-assistant?fileId=${file.id}`)}
        className="w-full"
      >
        <Sparkles size={16} /> المساعد الذكي لهذا الملف
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 rounded-input border border-border bg-white py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary">
          <ThumbsUp size={16} /> مفيد ({file.rating})
        </button>
        <button className="flex items-center justify-center gap-2 rounded-input border border-border bg-white py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary">
          <Bookmark size={16} /> حفظ
        </button>
      </div>

      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <MessageCircle size={16} /> التعليقات ({comments.length})
        </p>
        {commentsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : comments.length === 0 ? (
          <p className="text-sm text-text-secondary">لا توجد تعليقات بعد</p>
        ) : (
          <div className="flex flex-col gap-2">
            {comments.map((c) => (
              <Card key={c.id} hover={false} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-primary">{c.authorName}</p>
                </div>
                <p className="mt-1 text-sm text-text-secondary">{c.text}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-dialog bg-white p-6 shadow-large"
            >
              <p className="font-bold text-text-primary">حذف الملف</p>
              <p className="mt-2 text-sm text-text-secondary">هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setConfirmOpen(false)} className="text-sm font-semibold text-text-secondary">إلغاء</button>
                <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>حذف</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
