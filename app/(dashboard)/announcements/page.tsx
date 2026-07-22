"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Plus } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAnnouncements } from "@/lib/hooks/useHomeData";
import { usePostAnnouncement } from "@/lib/hooks/useProfileData";
import { Card, Skeleton, EmptyState, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

function formatDate(d: Date) {
  return d.toLocaleDateString("ar-IQ", { year: "numeric", month: "2-digit", day: "2-digit" }) +
    " - " +
    d.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
}

export default function AnnouncementsPage() {
  const { currentUser } = useAuth();
  const { announcements } = useAnnouncements();
  const postAnnouncement = usePostAnnouncement();
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"section" | "stage">("section");
  const [posting, setPosting] = useState(false);

  const isRep = currentUser?.isClassRep ?? false;

  async function submit() {
    if (!title.trim() || !message.trim()) return;
    setPosting(true);
    await postAnnouncement(title.trim(), message.trim(), scope);
    setPosting(false);
    setTitle("");
    setMessage("");
    setComposeOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-text-primary">الإعلانات الرسمية</h2>
        {isRep && (
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Plus size={16} /> إعلان جديد
          </Button>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card hover={false}>
          <EmptyState icon={<Megaphone size={40} />} title="ما فيه إعلانات رسمية حاليًا" />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.02, ease: "easeInOut" }}
            >
              <Card hover={false} className="p-4">
                <div className="flex items-center gap-2">
                  <Megaphone size={16} className="text-primary" />
                  <p className="font-semibold text-text-primary">{a.title}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{a.message}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    {a.section ? `الشعبة ${a.section}` : "لكل المرحلة"}
                  </span>
                  <span className="text-xs text-text-disabled">{formatDate(a.createdAt)}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {composeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setComposeOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-dialog bg-white p-6 shadow-large"
            >
              <p className="font-bold text-text-primary">نشر إعلان رسمي</p>
              <div className="mt-4 flex flex-col gap-3">
                <Input placeholder="عنوان الإعلان" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea
                  placeholder="نص الإعلان"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-input border border-border bg-white p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div>
                  <p className="mb-2 text-xs text-text-secondary">نطاق الوصول</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={scope === "section"} onChange={() => setScope("section")} />
                      شعبتي فقط
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={scope === "stage"} onChange={() => setScope("stage")} />
                      كل المرحلة
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setComposeOpen(false)} className="text-sm font-semibold text-text-secondary">إلغاء</button>
                <Button size="sm" onClick={submit} loading={posting}>نشر</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
