"use client";

import { motion } from "framer-motion";
import { Clock, BellOff } from "lucide-react";
import { useNotifications } from "@/lib/hooks/useProfileData";
import { Card, Skeleton, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { notifications, loading, markAllRead } = useNotifications();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-text-primary">الإشعارات</h2>
        <button onClick={markAllRead} className="text-sm font-semibold text-primary">
          تحديد الكل كمقروء
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card hover={false}>
          <EmptyState icon={<BellOff size={40} />} title="لا توجد إشعارات حاليًا" />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.02, ease: "easeInOut" }}
            >
              <Card hover={false} className={cn("flex items-start gap-3 p-4", !n.unread && "border-transparent shadow-none")}>
                {n.unread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{n.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">{n.message}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-text-disabled">
                    <Clock size={11} /> منذ قليل
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
