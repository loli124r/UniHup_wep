"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";

export default function LoginPage() {
  const router = useRouter();
  const { login, signUp, isInstructor, currentInstructor } = useAuth();
  const [email, setEmail] = useState("student@uni.edu.iq");
  const [password, setPassword] = useState("");
  const [obscure, setObscure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const err = isSignup ? await signUp(email.trim(), password) : await login(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    // نفس منطق التوجيه في login_screen.dart بالضبط
    if (isInstructor) {
      router.replace(currentInstructor?.status === "approved" ? "/instructor/home" : "/instructor/pending");
      return;
    }
    router.replace("/home"); // التحقق من onboarding يتم داخل /home نفسها
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute -top-16 -right-12 h-64 w-64 rounded-full bg-primary-blue/15 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 lg:px-12">
        <div className="grid w-full grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* الجانب الترويجي */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden lg:flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl brand-gradient shadow-large">
                <GraduationCap className="text-white" size={28} />
              </div>
              <div>
                <p className="text-2xl font-extrabold bg-clip-text text-transparent brand-gradient">UniHub</p>
                <p className="text-sm text-text-secondary">منصة الطالب الجامعية المتكاملة</p>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-text-primary">
              كل ما يحتاجه طالبك الجامعي، <br /> بمكان واحد أنيق.
            </h1>
            <p className="max-w-md text-text-secondary">
              ملخصات، أسئلة، محاضرات، جدول أسبوعي، درجات، وحضور — متزامن لحظيًا
              مع تطبيق UniHub على الموبايل.
            </p>
          </motion.div>

          {/* بطاقة تسجيل الدخول */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="glass mx-auto w-full max-w-md rounded-card p-8 shadow-large"
          >
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl brand-gradient">
                <GraduationCap className="text-white" size={20} />
              </div>
              <p className="text-xl font-extrabold">UniHub</p>
            </div>

            <h2 className="text-xl font-bold text-text-primary">
              {isSignup ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </h2>
            <p className="mb-6 mt-1 text-sm text-text-secondary">
              {isSignup ? "أنشئ حسابك للبدء باستخدام UniHub" : "أهلاً بعودتك 👋"}
            </p>

            <div className="flex flex-col gap-4">
              <div className="relative">
                <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-disabled" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="pr-11"
                />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-disabled" />
                <Input
                  type={obscure ? "password" : "text"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="pr-11 pl-11"
                />
                <button
                  type="button"
                  onClick={() => setObscure((v) => !v)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled"
                >
                  {obscure ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl bg-status-danger/10 px-3 py-2 text-sm text-status-danger"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button onClick={submit} loading={loading} className="mt-2 w-full">
                {isSignup ? "إنشاء الحساب" : "تسجيل الدخول"}
              </Button>

              <button
                type="button"
                onClick={() =>
                  setError("الدخول بحساب Google غير مفعّل حاليًا، استخدم البريد وكلمة المرور")
                }
                className="w-full h-11 rounded-btn border border-border text-sm font-semibold text-text-secondary hover:bg-bg-secondary transition"
              >
                المتابعة بحساب Google
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <button
                onClick={() => setIsSignup((v) => !v)}
                className="font-semibold text-primary"
              >
                {isSignup ? "لديك حساب؟ سجّل الدخول" : "حساب جديد؟ أنشئ حسابًا"}
              </button>
              <button
                onClick={() => router.push("/instructor/signup")}
                className="text-text-secondary hover:text-primary"
              >
                تسجيل دكتور/تدريسي
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
