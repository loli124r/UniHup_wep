"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

const pageTitles: Record<string, string> = {
  "/home": "الرئيسية",
  "/schedule": "الجدول",
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
  const [menuOpen, setMenuOpen] = useState(false);

  const title = (pathname && pageTitles[pathname]) || "UniHub";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/80 px-6 backdrop-blur-xl">
      <div>
        <p className="text-xs text-text-secondary">UniHub / {title}</p>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-input border border-border bg-white px-3 h-10 w-64">
          <Search size={16} className="text-text-disabled" />
          <input
            placeholder="ابحث عن مادة أو ملف..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-disabled"
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push(`/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
            }}
          />
        </div>

        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white hover:shadow-soft transition">
          <Bell size={18} className="text-text-secondary" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-border bg-white px-2 py-1.5 hover:shadow-soft transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full brand-gradient text-white text-sm font-bold">
              {currentUser?.name?.charAt(0) || "?"}
            </div>
            <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate">{currentUser?.name || "..."}</span>
            <ChevronDown size={14} className="text-text-secondary" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute left-0 mt-2 w-52 rounded-2xl border border-border bg-white p-2 shadow-large"
              >
                <button
                  onClick={() => router.push("/profile")}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-primary hover:bg-bg-secondary"
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
  );
}
