"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/schedule", label: "الجدول", icon: CalendarDays },
  { href: "/results", label: "النتائج", icon: GraduationCap },
  { href: "/search", label: "البحث", icon: Search },
  { href: "/announcements", label: "الإعلانات", icon: Megaphone },
  { href: "/ai-assistant", label: "المساعد الذكي", icon: Sparkles },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
  { href: "/profile", label: "حسابي", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-72 shrink-0 flex-col border-l border-border bg-bg-surface/70 backdrop-blur-xl px-4 py-6">
      <div className="flex items-center gap-2 px-3 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl brand-gradient text-white font-extrabold">U</div>
        <span className="text-lg font-extrabold text-text-primary">UniHub</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative">
              <motion.div
                whileHover={{ x: -2 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                  active ? "text-white" : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl brand-gradient shadow-soft"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  />
                )}
                <Icon size={20} className="relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
