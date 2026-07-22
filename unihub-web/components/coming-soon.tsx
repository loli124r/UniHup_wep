"use client";

import { Construction } from "lucide-react";
import { Card } from "@/components/ui/primitives";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-extrabold text-text-primary">{title}</h2>
      <Card hover={false} className="flex flex-col items-center gap-3 py-16 text-center">
        <Construction className="text-primary/40" size={40} />
        <p className="font-semibold text-text-primary">هذه الشاشة ضمن المرحلة القادمة</p>
        <p className="max-w-sm text-sm text-text-secondary">
          سيتم بناؤها بنفس دقة الشاشات الحالية اعتمادًا على منطق Flutter الأصلي.
        </p>
      </Card>
    </div>
  );
}
