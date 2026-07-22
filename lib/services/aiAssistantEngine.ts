// مطابق حرفيًا لـ services/ai_assistant_engine.dart: محرك استرجاع معلومات
// (Retrieval) وليس توليد نصوص، يجاوب فقط من محتوى مُحضَّر مسبقًا (AiContentPack)
// المرفوع بواسطة ممثل الشعبة. لا يستدعي أي API خارجي.

export interface AiChunk {
  id: string;
  text: string;
  keywords: Record<string, number>;
}

export interface AiQuestion {
  id: string;
  question: string;
  answer: string;
  type: "short" | "true_false" | "mcq";
  options?: string[];
}

export interface AiContentPack {
  fileId: string;
  subjectId: string;
  chunks: AiChunk[];
  summaryPoints: string[];
  questions: AiQuestion[];
  generatedAt: Date;
}

export function aiContentPackFromMap(map: any): AiContentPack {
  return {
    fileId: map.file_id ?? "",
    subjectId: map.subject_id ?? "",
    chunks: (map.chunks ?? []).map((c: any) => ({
      id: c.id ?? "",
      text: c.text ?? "",
      keywords: c.keywords ?? {},
    })),
    summaryPoints: map.summary_points ?? [],
    questions: (map.questions ?? []).map((q: any) => ({
      id: q.id ?? "",
      question: q.question ?? "",
      answer: q.answer ?? "",
      type: q.type ?? "short",
      options: q.options ?? undefined,
    })),
    generatedAt: map.generated_at ? new Date(map.generated_at) : new Date(),
  };
}

export type ExplanationTone = "simple" | "academic";

export interface AiAnswer {
  text: string;
  confidence: number;
  found: boolean;
}

const TOKEN_RE = /[\u0600-\u06FFa-zA-Z0-9]+/g;

function tokenize(text: string): string[] {
  const matches = text.match(TOKEN_RE) ?? [];
  return matches.map((t) => t.toLowerCase()).filter((t) => t.length > 1);
}

function simplify(text: string): string {
  const sentences = text
    .split(/(?<=[.!?؟؛])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const picked = sentences.slice(0, 2);
  if (picked.length === 0) return text;
  return `💡 بكلام مبسّط:\n${picked.map((s) => `• ${s}`).join("\n")}`;
}

function scoreChunk(chunk: AiChunk, queryTokens: string[]): number {
  let score = 0;
  for (const t of queryTokens) {
    score += chunk.keywords[t] ?? 0;
    if (!(t in chunk.keywords) && chunk.text.toLowerCase().includes(t)) {
      score += 0.05;
    }
  }
  return score;
}

export class AiAssistantEngine {
  constructor(private content: AiContentPack) {}

  answer(question: string, tone: ExplanationTone = "academic"): AiAnswer {
    if (this.content.chunks.length === 0) {
      return { text: "ما فيه محتوى مفهرس لهذا الملف بعد.", confidence: 0, found: false };
    }
    const tokens = tokenize(question);
    if (tokens.length === 0) {
      return { text: "اكتب سؤال أوضح شوي.", confidence: 0, found: false };
    }

    // 1) مطابقة مع الأسئلة الجاهزة أولاً (أدق مصدر)
    let bestQuestion: AiQuestion | null = null;
    let bestQScore = 0;
    for (const q of this.content.questions) {
      const qTokens = new Set(tokenize(q.question));
      const overlap = tokens.filter((t) => qTokens.has(t)).length;
      const denom = Math.min(999, Math.max(1, tokens.length + qTokens.size - overlap));
      const score = overlap / denom;
      if (score > bestQScore) {
        bestQScore = score;
        bestQuestion = q;
      }
    }
    if (bestQuestion && bestQScore >= 0.35) {
      return { text: bestQuestion.answer, confidence: bestQScore, found: true };
    }

    // 2) مطابقة مع فقرات المحتوى (TF-IDF)
    let best: AiChunk | null = null;
    let bestScore = 0;
    for (const c of this.content.chunks) {
      const s = scoreChunk(c, tokens);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    if (!best || bestScore <= 0) {
      return {
        text: "ما لقيت جواب دقيق بمحتوى هذا الملف. جرب تعيد صياغة سؤالك أو اسأل عن مصطلح مذكور صراحة بالمحاضرة.",
        confidence: 0,
        found: false,
      };
    }

    const normalizedConfidence = Math.min(1, Math.max(0, bestScore / (bestScore + 1)));
    const text = tone === "academic" ? best.text : simplify(best.text);
    return { text, confidence: normalizedConfidence, found: true };
  }

  summary(): string[] {
    return this.content.summaryPoints;
  }

  examQuestions(): AiQuestion[] {
    return this.content.questions;
  }
}
