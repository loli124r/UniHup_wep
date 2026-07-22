"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Sparkles, Send, BookOpenCheck, ListChecks, CloudUpload, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAiContentStream, useSaveAiContentForEveryone } from "@/lib/hooks/useAiContent";
import { useAuth } from "@/lib/hooks/useAuth";
import { AiAssistantEngine, ExplanationTone, AiContentPack } from "@/lib/services/aiAssistantEngine";
import { extractPdfText } from "@/lib/services/pdfText";
import { generateFromPdfText } from "@/lib/services/localAiGenerator";
import { Card, Skeleton, EmptyState, Badge, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileItem, fileItemFromDoc, isAnyAdmin } from "@/lib/types/models";

const tabs = [
  { key: "ask", label: "اسألني", icon: Sparkles },
  { key: "summary", label: "الملخص", icon: BookOpenCheck },
  { key: "questions", label: "أسئلة امتحانية", icon: ListChecks },
] as const;

type LocalState = "idle" | "loading" | "unsupported" | "empty" | "error" | "done";

// نفس منطق _generateLocally في ai_assistant_screen.dart: يولّد محليًا بالمتصفح
// فقط لو ماكو حزمة جاهزة بـ Firestore، ولملفات PDF فقط.
function useLocalGeneration(file: FileItem | null, enabled: boolean) {
  const [state, setState] = useState<LocalState>("idle");
  const [pack, setPack] = useState<AiContentPack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !file) return;
    if (!file.fileUrl || !file.fileUrl.toLowerCase().includes(".pdf")) {
      setState("unsupported");
      return;
    }
    let active = true;
    (async () => {
      setState("loading");
      try {
        const res = await fetch(file.fileUrl);
        if (!res.ok) throw new Error(`تعذّر تحميل الملف (${res.status})`);
        const bytes = await res.arrayBuffer();
        const text = await extractPdfText(bytes);
        const generated = generateFromPdfText(text, file.id, file.subjectId);
        if (!active) return;
        if (generated.chunks.length === 0) {
          setState("empty");
        } else {
          setPack(generated);
          setState("done");
        }
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? "تعذّر تحليل الملف");
        setState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled, file?.id]);

  return { state, pack, error, retry: () => setState("idle") };
}

function AiAssistantInner() {
  const searchParams = useSearchParams();
  const fileId = searchParams.get("fileId") ?? undefined;
  const { currentUser } = useAuth();
  const remotePack = useAiContentStream(fileId);
  const [file, setFile] = useState<FileItem | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("ask");
  const [tone, setTone] = useState<ExplanationTone>("academic");
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "ai"; text: string; confidence?: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const saveForEveryone = useSaveAiContentForEveryone();

  useEffect(() => {
    if (!fileId) return;
    getDoc(doc(db, "files", fileId)).then((snap) => {
      if (snap.exists()) setFile(fileItemFromDoc(snap.id, snap.data()));
    });
  }, [fileId]);

  const local = useLocalGeneration(file, remotePack === null);
  const pack = remotePack ?? (local.state === "done" ? local.pack : null);
  const canPersist = currentUser?.isClassRep || isAnyAdmin(currentUser ?? null);

  function ask() {
    if (!pack || !question.trim()) return;
    const engine = new AiAssistantEngine(pack);
    const res = engine.answer(question.trim(), tone);
    setChat((prev) => [...prev, { role: "user", text: question.trim() }, { role: "ai", text: res.text, confidence: res.confidence }]);
    setQuestion("");
  }

  async function persistForEveryone() {
    if (!pack) return;
    setSaving(true);
    const res = await saveForEveryone(pack);
    setSaving(false);
    setSaveMsg(res.ok ? "تم الحفظ لكل الطلاب بنجاح ✅" : res.error ?? "تعذّر الحفظ");
  }

  if (!fileId) {
    return (
      <Card hover={false}>
        <EmptyState
          icon={<Sparkles size={40} />}
          title="افتح المساعد الذكي من صفحة أي ملف محاضرة"
          description="اذهب إلى تفاصيل الملف واضغط زر «المساعد الذكي لهذا الملف»."
        />
      </Card>
    );
  }

  const isWaitingRemote = remotePack === undefined;
  const isWaitingLocal = remotePack === null && (local.state === "idle" || local.state === "loading");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary">المساعد الذكي</h2>
        {file && <p className="text-sm text-text-secondary">{file.title}</p>}
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-badge border px-4 py-1.5 text-sm font-semibold transition",
              tab === t.key ? "brand-gradient text-white border-transparent" : "border-border bg-white text-text-secondary"
            )}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {isWaitingRemote || isWaitingLocal ? (
        <Card hover={false} className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-text-secondary">
            {isWaitingLocal ? "جاري تحليل المحاضرة محليًا على جهازك..." : "جاري التحميل..."}
          </p>
        </Card>
      ) : !pack ? (
        <Card hover={false}>
          <EmptyState
            title={
              local.state === "unsupported"
                ? "التحليل المحلي مدعوم حاليًا لملفات PDF فقط"
                : local.state === "empty"
                ? "ما قدرنا نستخرج نص كافٍ من هذا الملف (يمكن صورة ماسحة ضوئية بدون طبقة نص)"
                : local.state === "error"
                ? `تعذّر تحليل الملف محليًا: ${local.error}`
                : "ما فيه محتوى مساعد ذكي لهذا الملف بعد"
            }
          />
          {local.state === "error" && (
            <button onClick={local.retry} className="mx-auto mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
              <RefreshCw size={14} /> إعادة المحاولة
            </button>
          )}
        </Card>
      ) : (
        <>
          {remotePack === null && canPersist && (
            <div className="flex items-center justify-between rounded-xl bg-primary-blue/10 p-3">
              <p className="text-xs text-text-primary">هذا تحليل محلي على جهازك فقط. تقدر تحفظه ليشوفه كل طلاب الشعبة.</p>
              <Button size="sm" onClick={persistForEveryone} loading={saving}>
                <CloudUpload size={14} /> حفظ للجميع
              </Button>
            </div>
          )}
          {saveMsg && <p className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary">{saveMsg}</p>}

          {tab === "ask" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">أسلوب الشرح:</span>
                <button
                  onClick={() => setTone("academic")}
                  className={cn("rounded-badge px-3 py-1 text-xs font-semibold", tone === "academic" ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary")}
                >
                  أكاديمي
                </button>
                <button
                  onClick={() => setTone("simple")}
                  className={cn("rounded-badge px-3 py-1 text-xs font-semibold", tone === "simple" ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary")}
                >
                  مبسّط
                </button>
              </div>

              <div className="flex min-h-[200px] flex-col gap-3 rounded-card border border-border bg-white p-4">
                {chat.length === 0 ? (
                  <p className="py-10 text-center text-sm text-text-secondary">اسأل عن أي شي مذكور صراحة بالمحاضرة</p>
                ) : (
                  chat.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "self-end brand-gradient text-white" : "self-start bg-bg-secondary text-text-primary")}
                    >
                      {m.text}
                      {m.role === "ai" && m.confidence !== undefined && (
                        <p className="mt-1 text-[10px] opacity-60">دقة تقريبية: {Math.round(m.confidence * 100)}%</p>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && ask()}
                  placeholder="اكتب سؤالك عن المحاضرة..."
                />
                <Button onClick={ask}><Send size={16} /></Button>
              </div>
            </div>
          ) : tab === "summary" ? (
            pack.summaryPoints.length === 0 ? (
              <Card hover={false}><EmptyState title="ماكو نقاط تلخيص متوفرة" /></Card>
            ) : (
              <div className="flex flex-col gap-2">
                {pack.summaryPoints.map((p, i) => (
                  <Card key={i} hover={false} className="p-3 text-sm text-text-primary">{p}</Card>
                ))}
              </div>
            )
          ) : pack.questions.length === 0 ? (
            <Card hover={false}><EmptyState title="ماكو أسئلة امتحانية متوفرة" /></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {pack.questions.map((q) => (
                <Card key={q.id} hover={false} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{q.question}</p>
                    <Badge tone="neutral">{q.type === "mcq" ? "اختيارات" : q.type === "true_false" ? "صح/خطأ" : "قصير"}</Badge>
                  </div>
                  {q.options && (
                    <ul className="mt-2 flex flex-col gap-1 text-xs text-text-secondary">
                      {q.options.map((o, i) => <li key={i}>• {o}</li>)}
                    </ul>
                  )}
                  <p className="mt-2 text-xs font-semibold text-status-success">الجواب: {q.answer}</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AiAssistantPage() {
  return (
    <Suspense fallback={null}>
      <AiAssistantInner />
    </Suspense>
  );
}
