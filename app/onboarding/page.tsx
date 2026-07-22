"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCompleteOnboarding } from "@/lib/hooks/useProfileData";
import { Button } from "@/components/ui/button";
import { colleges, departmentsFor, stagesForDepartment, defaultSections, studyTypes } from "@/lib/constants/academic";

const steps = ["college", "department", "stage", "section", "studyType"] as const;
type Step = (typeof steps)[number];

function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-input border px-4 py-3 text-right text-sm font-semibold transition ${
        selected ? "brand-gradient border-transparent text-white shadow-soft" : "border-border bg-white text-text-primary hover:bg-bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();
  const completeOnboarding = useCompleteOnboarding();
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!loading && !firebaseUser) router.replace("/login");
  }, [loading, firebaseUser, router]);

  const [college, setCollege] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [stage, setStage] = useState<number | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [studyType, setStudyType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step: Step = steps[stepIdx];
  const maxStage = stagesForDepartment(department, college);

  const canProceed =
    (step === "college" && !!college) ||
    (step === "department" && !!department) ||
    (step === "stage" && !!stage) ||
    (step === "section" && !!section) ||
    (step === "studyType" && !!studyType);

  async function next() {
    if (stepIdx < steps.length - 1) {
      setStepIdx((i) => i + 1);
      return;
    }
    setSubmitting(true);
    await completeOnboarding({
      college: college!,
      department: department!,
      stage: stage!,
      section: section ?? "أ",
      studyType: studyType ?? "",
    });
    setSubmitting(false);
    router.replace("/home");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient">
          <GraduationCap className="text-white" size={22} />
        </div>
        <div>
          <p className="text-xl font-extrabold text-text-primary">إكمال بيانات الحساب</p>
          <p className="text-sm text-text-secondary">خطوة {stepIdx + 1} من {steps.length}</p>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-secondary">
        <motion.div
          animate={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full brand-gradient"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1"
        >
          {step === "college" && (
            <>
              <p className="mb-2 text-sm font-bold text-text-secondary">اختر كليتك</p>
              {colleges.map((c) => (
                <OptionButton
                  key={c}
                  label={c}
                  selected={college === c}
                  onClick={() => {
                    setCollege(c);
                    setDepartment(null);
                    setStage(null);
                  }}
                />
              ))}
            </>
          )}

          {step === "department" && (
            <>
              <p className="mb-2 text-sm font-bold text-text-secondary">اختر قسمك</p>
              {departmentsFor(college).map((d) => (
                <OptionButton key={d} label={d} selected={department === d} onClick={() => setDepartment(d)} />
              ))}
            </>
          )}

          {step === "stage" && (
            <>
              <p className="mb-2 text-sm font-bold text-text-secondary">اختر مرحلتك الدراسية</p>
              {Array.from({ length: maxStage }, (_, i) => i + 1).map((s) => (
                <OptionButton key={s} label={`المرحلة ${s}`} selected={stage === s} onClick={() => setStage(s)} />
              ))}
            </>
          )}

          {step === "section" && (
            <>
              <p className="mb-2 text-sm font-bold text-text-secondary">اختر شعبتك</p>
              {defaultSections.map((s) => (
                <OptionButton key={s} label={`شعبة ${s}`} selected={section === s} onClick={() => setSection(s)} />
              ))}
            </>
          )}

          {step === "studyType" && (
            <>
              <p className="mb-2 text-sm font-bold text-text-secondary">نوع الدراسة</p>
              {studyTypes.map((s) => (
                <OptionButton key={s} label={s} selected={studyType === s} onClick={() => setStudyType(s)} />
              ))}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        {stepIdx > 0 ? (
          <button onClick={() => setStepIdx((i) => i - 1)} className="flex items-center gap-1 text-sm font-semibold text-text-secondary">
            <ChevronRight size={16} /> السابق
          </button>
        ) : (
          <span />
        )}
        <Button disabled={!canProceed} loading={submitting} onClick={next}>
          {stepIdx === steps.length - 1 ? "إنهاء التسجيل" : "التالي"}
        </Button>
      </div>
    </div>
  );
}
