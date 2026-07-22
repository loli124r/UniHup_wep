"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, CalendarDays, Search, GraduationCap, User, X, LogOut, Megaphone, Bell, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { navItems } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

const bottomItems = [
  { href: "/home", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/schedule", label: "الجدول", icon: CalendarDays },
  { href: "/search", label: "البحث", icon: Search },
  { href: "/results", label: "النتائج", icon: GraduationCap },
  { href: "/profile", label: "حسابي", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-bg-surface/95 px-2 py-2 backdrop-blur-xl dark:border-dark-border dark:bg-dark-surface/95 lg:hidden">
      {bottomItems.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="relative flex flex-1 flex-col items-center gap-1 py-1">
            {active && (
              <motion.span
                layoutId="mobile-nav-active"
                className="absolute -top-2 h-1 w-8 rounded-full brand-gradient"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              />
            )}
            <Icon size={20} className={active ? "text-primary" : "text-text-secondary dark:text-dark-textSecondary"} />
            <span className={cn("text-[10px] font-semibold", active ? "text-primary" : "text-text-secondary dark:text-dark-textSecondary")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const extraItems = navItems.filter((i) => !["/home", "/schedule", "/search", "/results", "/profile"].includes(i.href));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-bg-surface p-5 shadow-large dark:bg-dark-surface lg:hidden"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl brand-gradient text-sm font-extrabold text-white">U</div>
                <span className="text-lg font-extrabold text-text-primary dark:text-dark-textPrimary">UniHub</span>
              </div>
              <button onClick={onClose} className="text-text-secondary dark:text-dark-textSecondary"><X size={20} /></button>
            </div>

            <Link href="/profile" onClick={onClose} className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-white p-3 dark:border-dark-border dark:bg-dark-secondary">
              <div className="flex h-10 w-10 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
                {currentUser?.name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary dark:text-dark-textPrimary">{currentUser?.name}</p>
                <p className="text-xs text-text-secondary dark:text-dark-textSecondary">عرض الحساب</p>
              </div>
            </Link>

            <nav className="flex flex-1 flex-col gap-1">
              {extraItems.map((item) => {
                const active = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold",
                      active ? "brand-gradient text-white" : "text-text-secondary hover:bg-bg-secondary dark:text-dark-textSecondary dark:hover:bg-dark-secondary"
                    )}
                  >
                    <Icon size={19} /> {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={async () => { await logout(); onClose(); router.push("/login"); }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-status-danger hover:bg-status-danger/5"
            >
              <LogOut size={19} /> تسجيل الخروج
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
