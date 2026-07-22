"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, ChevronDown, LogOut, Settings, Menu } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotifications } from "@/lib/hooks/useProfileData";
import { MobileDrawer } from "@/components/layout/mobile-nav";

const pageTitles: Record<string, string> = {
  "/home": "الرئيسية",
  "/schedule": "الجدول الذكي",
  "/results": "النتائج",
  "/search": "البحث",
  "/announcements": "الإعلانات",
  "/notifications": "الإشعارات",
  "/profile": "حسابي",
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { notifications } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = (pathname && pageTitles[pathname]) || "UniHub";
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/80 px-4 backdrop-blur-xl dark:border-dark-border dark:bg-dark-bg/80 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-text-secondary lg:hidden dark:border-dark-border dark:bg-dark-secondary"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="hidden text-xs text-text-secondary dark:text-dark-textSecondary sm:block">UniHub / {title}</p>
            <h1 className="text-base font-bold text-text-primary dark:text-dark-textPrimary sm:text-lg">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-input border border-border bg-white px-3 h-10 w-64 dark:border-dark-border dark:bg-dark-secondary lg:w-80">
            <Search size={16} className="text-text-disabled" />
            <input
              placeholder="ابحث عن مادة أو ملف..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled dark:text-dark-textPrimary"
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
              }}
            />
          </div>

          <button
            onClick={() => router.push("/notifications")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white transition hover:shadow-soft dark:border-dark-border dark:bg-dark-secondary"
          >
            <Bell size={18} className="text-text-secondary dark:text-dark-textSecondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-danger px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-2 py-1.5 transition hover:shadow-soft dark:border-dark-border dark:bg-dark-secondary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full brand-gradient text-white text-sm font-bold">
                {currentUser?.name?.charAt(0) || "?"}
              </div>
              <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate dark:text-dark-textPrimary">{currentUser?.name || "..."}</span>
              <ChevronDown size={14} className="hidden text-text-secondary dark:text-dark-textSecondary sm:block" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute left-0 mt-2 w-52 rounded-2xl border border-border bg-white p-2 shadow-large dark:border-dark-border dark:bg-dark-surface"
                >
                  <button
                    onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-primary hover:bg-bg-secondary dark:text-dark-textPrimary dark:hover:bg-dark-secondary"
                  >
                    <Settings size={16} /> الملف الشخصي
                  </button>
                  <button
                    onClick={async () => {
                      await logout();
                      router.push("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-status-danger hover:bg-status-danger/5"
                  >
                    <LogOut size={16} /> تسجيل الخروج
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
