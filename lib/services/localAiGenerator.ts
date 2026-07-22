// مطابق حرفيًا لـ services/local_ai_generator.dart: نفس خوارزميات التقسيم
// لفقرات + TF-IDF + تلخيص استخراجي بالـ centroid + أسئلة بقواعد نصية.
// يشتغل بالكامل بالمتصفح، بدون أي API خارجي.

import { AiChunk, AiContentPack, AiQuestion } from "./aiAssistantEngine";

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g;
const MULTI_SPACE = /[ \t]+/g;
const MULTI_NEWLINE = /\n{2,}/g;
const SENTENCE_SPLIT = /(?<=[.!?؟؛])\s+/;
const TOKEN_RE = /[\u0600-\u06FFa-zA-Z0-9]+/g;
const NUMBER_RE = /\d+[.,]?\d*/;
const DEFINITION_HINTS = ["تعريف", "يعرف", "يُعرَّف", "هو عبارة عن", "يقصد به", "المقصود"];

function cleanText(text: string): string {
  return text
    .replace(ARABIC_DIACRITICS, "")
    .replace(/\r/g, "\n")
    .replace(MULTI_SPACE, " ")
    .replace(MULTI_NEWLINE, "\n\n")
    .trim();
}

function splitSentences(paragraph: string): string[] {
  return paragraph
    .trim()
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);
}

function splitIntoChunks(text: string, minLen = 40, maxLen = 550): string[] {
  const rawParagraphs = text.split("\n\n").map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buffer = "";

  for (const para of rawParagraphs) {
    const candidate = buffer ? `${buffer} ${para}`.trim() : para;
    if (candidate.length < minLen) {
      buffer = candidate;
      continue;
    }
    if (candidate.length <= maxLen) {
      chunks.push(candidate);
      buffer = "";
    } else {
      const sentences = splitSentences(candidate);
      let current = "";
      for (const s of sentences) {
        const next = current ? `${current} ${s}`.trim() : s;
        if (next.length > maxLen && current) {
          chunks.push(current);
          current = s;
        } else {
          current = next;
        }
      }
      if (current) chunks.push(current);
      buffer = "";
    }
  }
  if (buffer.length >= minLen) chunks.push(buffer);
  return chunks;
}

// فهرس TF-IDF على مستوى الفقرات — مطابق لـ _TfidfIndex في Dart.
class TfidfIndex {
  private vectors: Record<string, number>[] = [];
  private docCount: number;

  constructor(chunks: string[]) {
    this.docCount = chunks.length;
    const df: Record<string, number> = {};
    const termCounts: Record<string, number>[] = [];

    for (const chunk of chunks) {
      const tokens = (chunk.match(TOKEN_RE) ?? []).map((t) => t.toLowerCase());
      const counts: Record<string, number> = {};
      for (const t of tokens) {
        if (t.length <= 1) continue;
        counts[t] = (counts[t] ?? 0) + 1;
      }
      termCounts.push(counts);
      for (const t of Object.keys(counts)) df[t] = (df[t] ?? 0) + 1;
    }

    for (const counts of termCounts) {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const vec: Record<string, number> = {};
      for (const [term, count] of Object.entries(counts)) {
        const tf = total === 0 ? 0 : count / total;
        const idf = Math.log(this.docCount / (df[term] ?? 1)) + 1.0;
        const w = tf * idf;
        if (w > 0) vec[term] = w;
      }
      this.vectors.push(vec);
    }
  }

  topKeywords(chunkIndex: number, topK = 14): Record<string, number> {
    const entries = Object.entries(this.vectors[chunkIndex]).sort((a, b) => b[1] - a[1]);
    const out: Record<string, number> = {};
    for (const [k, v] of entries.slice(0, topK)) out[k] = Math.round(v * 10000) / 10000;
    return out;
  }

  topKeyword(chunkIndex: number): string | null {
    const entries = Object.entries(this.vectors[chunkIndex]);
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => (b[1] >= a[1] ? b : a))[0];
  }

  allTopKeywords(): string[] {
    const set = new Set<string>();
    for (let i = 0; i < this.vectors.length; i++) {
      const k = this.topKeyword(i);
      if (k) set.add(k);
    }
    return Array.from(set);
  }

  centroid(): Record<string, number> {
    const sum: Record<string, number> = {};
    for (const vec of this.vectors) {
      for (const [k, v] of Object.entries(vec)) sum[k] = (sum[k] ?? 0) + v;
    }
    const n = this.vectors.length || 1;
    for (const k of Object.keys(sum)) sum[k] /= n;
    return sum;
  }

  cosineBetween(i: number, j: number): number {
    return cosine(this.vectors[i], this.vectors[j]);
  }
  cosineToVector(i: number, other: Record<string, number>): number {
    return cosine(this.vectors[i], other);
  }
}

function cosine(a: Record<string, number>, b: Record<string, number>): number {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length === 0 || bKeys.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (const [k, v] of Object.entries(a)) {
    na += v * v;
    if (k in b) dot += v * b[k];
  }
  for (const v of Object.values(b)) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function extractiveSummary(chunks: string[], tfidf: TfidfIndex, maxPoints = 8, redundancyThreshold = 0.82): string[] {
  if (chunks.length === 0) return [];
  const centroid = tfidf.centroid();
  const order = chunks.map((_, i) => i).sort((a, b) => tfidf.cosineToVector(b, centroid) - tfidf.cosineToVector(a, centroid));

  const selected: number[] = [];
  for (const i of order) {
    if (selected.length >= maxPoints) break;
    const tooSimilar = selected.some((j) => tfidf.cosineBetween(i, j) > redundancyThreshold);
    if (tooSimilar) continue;
    selected.push(i);
  }
  selected.sort((a, b) => a - b);

  return selected.map((i) => {
    const sentences = splitSentences(chunks[i]);
    const picked = (sentences.length ? sentences : [chunks[i]]).slice(0, 2).join(" ");
    return picked.length > 280 ? picked.slice(0, 280) : picked;
  });
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function generateQuestions(chunks: string[], tfidf: TfidfIndex, maxQuestions = 15): AiQuestion[] {
  const questions: AiQuestion[] = [];
  const used = new Set<string>();
  let counter = 0;
  const nextId = () => `q_${counter++}`;

  // تعريفية
  for (let i = 0; i < chunks.length && questions.length < maxQuestions; i++) {
    for (const sentence of splitSentences(chunks[i])) {
      if (DEFINITION_HINTS.some((h) => sentence.includes(h)) && !used.has(sentence)) {
        const topic = tfidf.topKeyword(i);
        const q = topic ? `ما المقصود بـ «${topic}» كما ورد بالمحاضرة؟` : "عرّف المصطلح الوارد بهذه الفقرة.";
        questions.push({ id: nextId(), question: q, answer: sentence, type: "short" });
        used.add(sentence);
        break;
      }
    }
  }

  // أكمل الفراغ (رقمية)
  for (const chunk of chunks) {
    if (questions.length >= maxQuestions) break;
    for (const sentence of splitSentences(chunk)) {
      if (used.has(sentence)) continue;
      const m = NUMBER_RE.exec(sentence);
      if (m) {
        const blanked = sentence.slice(0, m.index) + "____" + sentence.slice(m.index + m[0].length);
        questions.push({ id: nextId(), question: `أكمل الفراغ: ${blanked}`, answer: m[0], type: "short" });
        used.add(sentence);
        break;
      }
    }
  }

  // اشرح المصطلح
  for (let i = 0; i < chunks.length && questions.length < maxQuestions; i++) {
    const topic = tfidf.topKeyword(i);
    if (!topic) continue;
    const sentences = splitSentences(chunks[i]);
    const first = sentences.length ? sentences[0] : chunks[i];
    if (used.has(first)) continue;
    questions.push({ id: nextId(), question: `اشرح بأسلوبك المقصود بـ «${topic}» بالاستناد لما ورد بالمحاضرة.`, answer: first, type: "short" });
    used.add(first);
  }

  // صح وخطأ
  const allKeywords = tfidf.allTopKeywords();
  for (let i = 0; i < chunks.length && questions.length < maxQuestions; i++) {
    const sentences = splitSentences(chunks[i]);
    const sentence = sentences.length ? sentences[0] : chunks[i];
    if (used.has(sentence) || sentence.length < 15) continue;
    const topic = tfidf.topKeyword(i);
    const alt = allKeywords.filter((w) => w !== topic);
    if (topic && sentence.includes(topic) && alt.length > 0) {
      const wrongWord = alt[Math.abs(hashCode(sentence)) % alt.length];
      const falseVersion = sentence.replace(topic, wrongWord);
      questions.push({ id: nextId(), question: `صح أم خطأ: «${falseVersion}»`, answer: `خطأ (المصطلح الصحيح: ${topic})`, type: "true_false" });
      used.add(sentence);
    }
  }

  return questions.slice(0, maxQuestions);
}

export function generateFromPdfText(rawText: string, fileId: string, subjectId: string): AiContentPack {
  const text = cleanText(rawText);
  const chunksText = splitIntoChunks(text);

  if (chunksText.length < 2) {
    return { fileId, subjectId, chunks: [], summaryPoints: [], questions: [], generatedAt: new Date() };
  }

  const tfidf = new TfidfIndex(chunksText);
  const chunks: AiChunk[] = chunksText.map((t, i) => ({ id: `c_${i}`, text: t, keywords: tfidf.topKeywords(i) }));
  const summaryPoints = extractiveSummary(chunksText, tfidf);
  const questions = generateQuestions(chunksText, tfidf);

  return { fileId, subjectId, chunks, summaryPoints, questions, generatedAt: new Date() };
}

export function aiContentPackToMap(pack: AiContentPack) {
  return {
    file_id: pack.fileId,
    subject_id: pack.subjectId,
    chunks: pack.chunks.map((c) => ({ id: c.id, text: c.text, keywords: c.keywords })),
    summary_points: pack.summaryPoints,
    questions: pack.questions.map((q) => ({ id: q.id, question: q.question, answer: q.answer, type: q.type, options: q.options ?? null })),
    generated_at: pack.generatedAt.getTime(),
  };
}
