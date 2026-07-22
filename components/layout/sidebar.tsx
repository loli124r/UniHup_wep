"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  Bell,
  Search,
  Megaphone,
  User,
  Sparkles,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";

export const navItems = [
  { href: "/home", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/schedule", label: "الجدول الذكي", icon: CalendarDays },
  { href: "/results", label: "النتائج", icon: GraduationCap },
  { href: "/search", label: "البحث", icon: Search },
  { href: "/announcements", label: "الإعلانات", icon: Megaphone },
  { href: "/ai-assistant", label: "المساعد الذكي", icon: Sparkles },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
  { href: "/profile", label: "حسابي", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("unihub_sidebar_collapsed");
    if (stored) setCollapsed(stored === "1");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("unihub_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 88 : 280 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative hidden lg:flex shrink-0 flex-col border-l border-border bg-bg-surface/70 backdrop-blur-xl px-3 py-6 dark:border-dark-border dark:bg-dark-surface/70"
    >
      <button
        onClick={toggle}
        className="absolute -left-3 top-9 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-soft hover:text-primary dark:border-dark-border dark:bg-dark-secondary"
      >
        {collapsed ? <ChevronsLeft size={13} /> : <ChevronsRight size={13} />}
      </button>

      <div className={cn("flex items-center gap-2 pb-8", collapsed ? "justify-center px-0" : "px-3")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl brand-gradient text-white font-extrabold shadow-soft">U</div>
        {!collapsed && <span className="text-lg font-extrabold text-text-primary dark:text-dark-textPrimary">UniHub</span>}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative group" title={collapsed ? item.label : undefined}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : -2 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl py-3 text-sm font-semibold transition-colors",
                  collapsed ? "justify-center px-0" : "px-4",
                  active ? "text-white" : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary dark:text-dark-textSecondary dark:hover:bg-dark-secondary dark:hover:text-dark-textPrimary"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl brand-gradient shadow-[0_8px_24px_rgba(91,61,245,0.35)]"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  />
                )}
                <Icon size={20} className="relative z-10 shrink-0" />
                {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
              </motion.div>

              {collapsed && (
                <span className="pointer-events-none absolute right-full top-1/2 z-20 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-text-primary px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-large transition-opacity group-hover:opacity-100 dark:bg-dark-secondary">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/profile"
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-border bg-white p-2.5 shadow-soft transition hover:shadow-hover dark:border-dark-border dark:bg-dark-secondary",
          collapsed && "justify-center"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full brand-gradient text-sm font-bold text-white">
          {currentUser?.name?.charAt(0) || "?"}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-text-primary dark:text-dark-textPrimary">{currentUser?.name || "..."}</p>
            <p className="truncate text-[10px] text-text-secondary dark:text-dark-textSecondary">عرض الحساب</p>
          </div>
        )}
      </Link>
    </motion.aside>
  );
}
