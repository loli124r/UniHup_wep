"use client";

import { HTMLAttributes, InputHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Card({ className, children, hover = true, ...props }: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      whileHover={hover ? { y: -3, boxShadow: "0 18px 45px rgba(59,130,246,.18)" } : undefined}
      className={cn(
        "rounded-card bg-bg-surface border border-border p-6 shadow-soft dark:bg-dark-surface dark:border-dark-border dark:shadow-none",
        className
      )}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-12 rounded-input border border-border bg-white px-4 text-sm text-text-primary placeholder:text-text-disabled outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-dark-secondary dark:border-dark-border dark:text-dark-textPrimary",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Badge({ className, children, tone = "info" }: { className?: string; children: React.ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  const tones: Record<string, string> = {
    success: "bg-status-success/10 text-status-success",
    warning: "bg-status-warning/10 text-status-warning",
    danger: "bg-status-danger/10 text-status-danger",
    info: "bg-status-info/10 text-status-info",
    neutral: "bg-bg-secondary text-text-secondary dark:bg-dark-secondary dark:text-dark-textSecondary",
  };
  return (
    <span className={cn("inline-flex items-center rounded-badge px-3 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton animate-shimmer rounded-xl dark:bg-dark-secondary", className)} />;
}

export function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-primary/40">{icon}</div>}
      <p className="font-semibold text-text-primary dark:text-dark-textPrimary">{title}</p>
      {description && <p className="max-w-sm text-sm text-text-secondary dark:text-dark-textSecondary">{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-status-danger/20 bg-status-danger/5 py-12 text-center">
      <p className="font-semibold text-status-danger">حدث خطأ</p>
      <p className="max-w-sm text-sm text-text-secondary">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-semibold text-primary underline underline-offset-4">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}
