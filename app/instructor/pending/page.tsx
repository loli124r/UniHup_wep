"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hourglass } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRefreshInstructorStatus } from "@/lib/hooks/useInstructor";
import { isInstructorApproved } from "@/lib/types/models";
import { Button } from "@/components/ui/button";

export default function InstructorPendingPage() {
  const router = useRouter();
  const { currentInstructor, logout } = useAuth();
  const refresh = useRefreshInstructorStatus();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function check() {
    setChecking(true);
    await refresh();
    setChecking(false);
    if (!currentInstructor) return;
    if (isInstructorApproved(currentInstructor)) {
      router.replace("/instructor/home");
    } else if (currentInstructor.status === "rejected") {
      setMessage("للأسف تم رفض طلبك. تواصل مع إدارة النظام لمزيد من التفاصيل");
    } else {
      setMessage("طلبك لسه بانتظار المراجعة");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#1A1147] px-8 text-center">
      <Hourglass className="text-status-warning" size={56} />
      <h1 className="text-xl font-extrabold text-white">حسابك بانتظار موافقة سوبر أدمن</h1>
      {currentInstructor && (
        <p className="max-w-sm text-sm leading-relaxed text-white/70">
          مرحبًا {currentInstructor.name}، طلبك بمادة/مواد {currentInstructor.requestedSubjectIds.length} بانتظار المراجعة من إدارة{" "}
          {currentInstructor.collegeId || "الجامعة"}
        </p>
      )}
      {message && <p className="text-sm text-status-warning">{message}</p>}
      <Button onClick={check} loading={checking}>تحقق الآن</Button>
      <button
        onClick={async () => {
          await logout();
          router.replace("/login");
        }}
        className="text-sm text-white/60 hover:text-white"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
