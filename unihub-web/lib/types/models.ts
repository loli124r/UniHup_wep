// مطابق حرفيًا لـ lib/models/models.dart في مشروع Flutter.
// أي تعديل هنا يجب أن يبقى متزامنًا مع نفس أسماء حقول Firestore (snake_case).

export interface Subject {
  id: string;
  name: string;
  stage: number; // 1-4
  collegeId: string;
  departmentId: string;
  filesCount: number;
  primaryType: string; // ملخصات / أسئلة / محاضرات
}

export function subjectFromDoc(id: string, map: any): Subject {
  return {
    id,
    name: map.name ?? "",
    stage: map.stage ?? 1,
    collegeId: map.college_id ?? "",
    departmentId: map.department_id ?? "",
    filesCount: map.files_count ?? 0,
    primaryType: map.primary_type ?? "ملخصات",
  };
}

export interface FileItem {
  id: string;
  title: string;
  type: string; // ملخص / أسئلة / محاضرة
  subjectId: string;
  departmentId: string;
  uploadedByName: string;
  uploadedById: string;
  fileUrl: string;
  rating: number;
  commentsCount: number;
  approved: boolean;
  createdAt: Date;
}

export function fileItemFromDoc(id: string, map: any): FileItem {
  return {
    id,
    title: map.title ?? "",
    type: map.type ?? "ملخص",
    subjectId: map.subject_id ?? "",
    departmentId: map.department_id ?? "",
    uploadedByName: map.uploaded_by_name ?? "",
    uploadedById: map.uploaded_by ?? "",
    fileUrl: map.file_url ?? "",
    rating: Number(map.rating ?? 0),
    commentsCount: map.comments_count ?? 0,
    approved: map.approved ?? false,
    createdAt: map.created_at ? new Date(map.created_at) : new Date(),
  };
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  provinceId: string;
  universityId: string;
  collegeId: string;
  departmentId: string;
  stage: number;
  section: string;
  studyType: string; // 'صباحي' | 'مسائي' | 'استضافة'
  isClassRep: boolean;
  role: "student" | "dept_admin" | "super_admin";
  adminCollegeId: string;
  adminDepartmentId: string;
  adminStage: number;
  adminSection: string;
  adminStudyType: string;
  uploadsCount: number;
  points: number;
  savedCount: number;
  notifyNewContent: boolean;
  notifyAnnouncements: boolean;
  notifyComments: boolean;
  followedSubjectIds: string[];
}

export function studentProfileFromDoc(id: string, map: any): StudentProfile {
  return {
    id,
    name: map.name ?? "",
    email: map.email ?? "",
    provinceId: map.province_id ?? "",
    universityId: map.university_id ?? "",
    collegeId: map.college_id ?? "",
    departmentId: map.department_id ?? "",
    stage: map.stage ?? 1,
    section: map.section ?? "أ",
    studyType: map.study_type ?? "",
    isClassRep: map.is_class_rep ?? false,
    role: map.role ?? "student",
    adminCollegeId: map.admin_college_id ?? "",
    adminDepartmentId: map.admin_department_id ?? "",
    adminStage: map.admin_stage ?? 0,
    adminSection: map.admin_section ?? "",
    adminStudyType: map.admin_study_type ?? "",
    uploadsCount: map.uploads_count ?? 0,
    points: map.points ?? 0,
    savedCount: map.saved_count ?? 0,
    notifyNewContent: map.notify_new_content ?? true,
    notifyAnnouncements: map.notify_announcements ?? true,
    notifyComments: map.notify_comments ?? true,
    followedSubjectIds: map.followed_subject_ids ?? [],
  };
}

export function studentProfileToMap(p: StudentProfile) {
  return {
    name: p.name,
    email: p.email,
    province_id: p.provinceId,
    university_id: p.universityId,
    college_id: p.collegeId,
    department_id: p.departmentId,
    stage: p.stage,
    section: p.section,
    study_type: p.studyType,
    is_class_rep: p.isClassRep,
    role: p.role,
    admin_college_id: p.adminCollegeId,
    admin_department_id: p.adminDepartmentId,
    admin_stage: p.adminStage,
    admin_section: p.adminSection,
    admin_study_type: p.adminStudyType,
    uploads_count: p.uploadsCount,
    points: p.points,
    saved_count: p.savedCount,
    notify_new_content: p.notifyNewContent,
    notify_announcements: p.notifyAnnouncements,
    notify_comments: p.notifyComments,
    followed_subject_ids: p.followedSubjectIds,
  };
}

export function isSuperAdmin(p: StudentProfile | null) { return p?.role === "super_admin"; }
export function isDeptAdmin(p: StudentProfile | null) { return p?.role === "dept_admin"; }
export function isAnyAdmin(p: StudentProfile | null) { return isSuperAdmin(p) || isDeptAdmin(p); }

export interface InstructorProfile {
  id: string;
  name: string;
  email: string;
  collegeId: string;
  departmentId: string;
  requestedSubjectIds: string[];
  approvedSubjectIds: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export function instructorProfileFromDoc(id: string, map: any): InstructorProfile {
  return {
    id,
    name: map.name ?? "",
    email: map.email ?? "",
    collegeId: map.college_id ?? "",
    departmentId: map.department_id ?? "",
    requestedSubjectIds: map.requested_subject_ids ?? [],
    approvedSubjectIds: map.approved_subject_ids ?? [],
    status: map.status ?? "pending",
    createdAt: map.created_at ? new Date(map.created_at) : new Date(),
  };
}

export const isInstructorApproved = (i: InstructorProfile) => i.status === "approved";
export const isInstructorPending = (i: InstructorProfile) => i.status === "pending";

export interface ScheduleItem {
  id: string;
  subjectName: string;
  professorName: string;
  departmentId: string;
  stage: number;
  section: string;
  studyType: string;
  dayOfWeek: number; // 1 = الأحد ... 7 = السبت
  startTime: string; // "HH:mm"
  endTime: string;
  room: string;
}

export function scheduleItemFromDoc(id: string, map: any): ScheduleItem {
  return {
    id,
    subjectName: map.subject_name ?? "",
    professorName: map.professor_name ?? "",
    departmentId: map.department_id ?? "",
    stage: map.stage ?? 1,
    section: map.section ?? "أ",
    studyType: map.study_type ?? "",
    dayOfWeek: map.day_of_week ?? 1,
    startTime: map.start_time ?? "08:00",
    endTime: map.end_time ?? "09:00",
    room: map.room ?? "",
  };
}

export function scheduleItemToMap(s: Omit<ScheduleItem, "id">) {
  return {
    subject_name: s.subjectName,
    professor_name: s.professorName,
    department_id: s.departmentId,
    stage: s.stage,
    section: s.section,
    study_type: s.studyType,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    room: s.room,
  };
}

export interface HomeworkItem {
  id: string;
  subjectName: string;
  title: string;
  departmentId: string;
  stage: number;
  section: string;
  studyType: string;
  dueDate: Date;
}

export function homeworkItemFromDoc(id: string, map: any): HomeworkItem {
  return {
    id,
    subjectName: map.subject_name ?? "",
    title: map.title ?? "",
    departmentId: map.department_id ?? "",
    stage: map.stage ?? 1,
    section: map.section ?? "أ",
    studyType: map.study_type ?? "",
    dueDate: map.due_date ? new Date(map.due_date) : new Date(),
  };
}

export interface ExamItem {
  id: string;
  subjectName: string;
  title: string;
  departmentId: string;
  stage: number;
  section: string;
  studyType: string;
  room: string;
  examDate: Date;
  postponed: boolean;
  postponedNote?: string;
}

export function examItemFromDoc(id: string, map: any): ExamItem {
  return {
    id,
    subjectName: map.subject_name ?? "",
    title: map.title ?? "",
    departmentId: map.department_id ?? "",
    stage: map.stage ?? 1,
    section: map.section ?? "أ",
    studyType: map.study_type ?? "",
    room: map.room ?? "",
    examDate: map.exam_date ? new Date(map.exam_date) : new Date(),
    postponed: map.postponed ?? false,
    postponedNote: map.postponed_note ?? undefined,
  };
}

export type BreakStatus = "active" | "room_changed" | "cancelled" | "ended";

export interface BreakSession {
  id: string;
  departmentId: string;
  stage: number;
  section: string;
  studyType: string;
  subjectName: string;
  status: BreakStatus;
  durationMinutes: number;
  newRoom?: string;
  startedAt: Date;
  startedByName: string;
}

export function breakSessionFromDoc(id: string, map: any): BreakSession {
  return {
    id,
    departmentId: map.department_id ?? "",
    stage: map.stage ?? 1,
    section: map.section ?? "أ",
    studyType: map.study_type ?? "",
    subjectName: map.subject_name ?? "",
    status: map.status ?? "ended",
    durationMinutes: map.duration_minutes ?? 10,
    newRoom: map.new_room ?? undefined,
    startedAt: map.started_at ? new Date(map.started_at) : new Date(),
    startedByName: map.started_by_name ?? "",
  };
}
export function breakEndsAt(b: BreakSession) {
  return new Date(b.startedAt.getTime() + b.durationMinutes * 60000);
}

export interface PromoBanner {
  id: string;
  imageUrl: string;
  universityId: string;
  departmentId: string; // فاضي = بانر على مستوى الجامعة كاملة
  order: number;
  active: boolean;
  createdByName: string;
  createdAt: Date;
}

export function promoBannerFromDoc(id: string, map: any): PromoBanner {
  return {
    id,
    imageUrl: map.image_url ?? "",
    universityId: map.university_id ?? "",
    departmentId: map.department_id ?? "",
    order: map.order ?? 0,
    active: map.active ?? true,
    createdByName: map.created_by_name ?? "",
    createdAt: map.created_at ? new Date(map.created_at) : new Date(),
  };
}
export const isBannerUniversityWide = (b: PromoBanner) => b.departmentId.length === 0;

export interface Announcement {
  id: string;
  title: string;
  message: string;
  universityId: string; // فاضي = بث عام لكل الطلبة (سوبر أدمن فقط)
  departmentId: string; // فاضي = كل الأقسام بالكلية
  stage: number | null;
  section: string | null;
  studyType: string | null;
  urgent: boolean;
  authorName: string;
  createdAt: Date;
}

export function announcementFromDoc(id: string, map: any): Announcement {
  return {
    id,
    title: map.title ?? "",
    message: map.message ?? "",
    universityId: map.university_id ?? "",
    departmentId: map.department_id ?? "",
    stage: map.stage ?? null,
    section: map.section ?? null,
    studyType: map.study_type ?? null,
    urgent: map.urgent ?? false,
    authorName: map.author_name ?? "",
    createdAt: map.created_at ? new Date(map.created_at) : new Date(),
  };
}
export const isAnnouncementGeneral = (a: Announcement) => a.universityId.length === 0;

// ---------------- الدرجات ----------------

export interface GradeComponent {
  key: string;
  label: string;
  maxScore: number;
}

export const defaultCourseComponents: GradeComponent[] = [
  { key: "quiz", label: "كويز", maxScore: 15 },
  { key: "seminar", label: "سمنر", maxScore: 10 },
  { key: "practical", label: "عملي", maxScore: 15 },
  { key: "midterm", label: "نصف المدة", maxScore: 10 },
  { key: "final", label: "امتحان نهائي", maxScore: 50 },
];

export const defaultSemesterComponents: GradeComponent[] = [
  { key: "s1_quiz", label: "كويز - الفصل الأول", maxScore: 15 },
  { key: "s1_seminar", label: "سمنر - الفصل الأول", maxScore: 10 },
  { key: "s1_practical", label: "عملي - الفصل الأول", maxScore: 15 },
  { key: "s1_midterm", label: "نصف المدة - الفصل الأول", maxScore: 10 },
  { key: "s1_final", label: "امتحان نهائي - الفصل الأول", maxScore: 50 },
  { key: "s2_quiz", label: "كويز - الفصل الثاني", maxScore: 15 },
  { key: "s2_seminar", label: "سمنر - الفصل الثاني", maxScore: 10 },
  { key: "s2_practical", label: "عملي - الفصل الثاني", maxScore: 15 },
  { key: "s2_midterm", label: "نصف المدة - الفصل الثاني", maxScore: 10 },
  { key: "s2_final", label: "امتحان نهائي - الفصل الثاني", maxScore: 50 },
];

export interface GradeSheet {
  id: string;
  subjectId: string;
  subjectName: string;
  collegeId: string;
  departmentId: string;
  stage: number;
  section: string;
  studyType: string;
  instructorId: string;
  system: "course" | "semester";
  components: GradeComponent[];
}

export function gradeSheetFromDoc(id: string, map: any): GradeSheet {
  return {
    id,
    subjectId: map.subject_id ?? "",
    subjectName: map.subject_name ?? "",
    collegeId: map.college_id ?? "",
    departmentId: map.department_id ?? "",
    stage: map.stage ?? 1,
    section: map.section ?? "أ",
    studyType: map.study_type ?? "",
    instructorId: map.instructor_id ?? "",
    system: map.system ?? "course",
    components: (map.components ?? []).map((c: any) => ({
      key: c.key ?? "",
      label: c.label ?? "",
      maxScore: Number(c.max_score ?? 0),
    })),
  };
}

/// نفس منطق GradeSheet.maxTotal في Dart: 100 دائمًا بنظام الفصلي.
export function gradeSheetMaxTotal(sheet: GradeSheet): number {
  if (sheet.system === "semester") return 100;
  return sheet.components.reduce((sum, c) => sum + c.maxScore, 0);
}

/// نفس منطق GradeSheet.totalFor في Dart: بنظام الفصلي، النتيجة = متوسط الفصلين
/// (مجموع كل فصل) وليس مجموعهما، حتى تبقى النتيجة من 100.
export function gradeSheetTotalFor(sheet: GradeSheet, record: StudentGradeRecord): number {
  if (sheet.system !== "semester") {
    return sheet.components.reduce((sum, c) => sum + (record.scores[c.key] ?? 0), 0);
  }
  const s1 = sheet.components
    .filter((c) => c.key.startsWith("s1_"))
    .reduce((sum, c) => sum + (record.scores[c.key] ?? 0), 0);
  const s2 = sheet.components
    .filter((c) => c.key.startsWith("s2_"))
    .reduce((sum, c) => sum + (record.scores[c.key] ?? 0), 0);
  return (s1 + s2) / 2;
}

export interface StudentGradeRecord {
  studentId: string;
  scores: Record<string, number>;
}

export function studentGradeRecordFromDoc(studentId: string, map: any): StudentGradeRecord {
  const raw = map?.scores ?? {};
  const scores: Record<string, number> = {};
  for (const k of Object.keys(raw)) scores[k] = Number(raw[k]);
  return { studentId, scores };
}

export function gradeSheetId(subjectId: string, section: string, studyType: string) {
  return `${subjectId}_${section}_${studyType}`;
}

export interface GradeAuditEntry {
  id: string;
  sheetId: string;
  studentId: string;
  studentName: string;
  componentKey: string;
  componentLabel: string;
  oldValue: number | null;
  newValue: number;
  instructorId: string;
  instructorName: string;
  changedAt: Date;
}

export function gradeAuditEntryFromDoc(id: string, map: any): GradeAuditEntry {
  return {
    id,
    sheetId: map.sheet_id ?? "",
    studentId: map.student_id ?? "",
    studentName: map.student_name ?? "",
    componentKey: map.component_key ?? "",
    componentLabel: map.component_label ?? "",
    oldValue: map.old_value === null || map.old_value === undefined ? null : Number(map.old_value),
    newValue: Number(map.new_value ?? 0),
    instructorId: map.instructor_id ?? "",
    instructorName: map.instructor_name ?? "",
    changedAt: map.changed_at ? new Date(map.changed_at) : new Date(),
  };
}

// ---------------- الحضور ----------------

export interface AttendanceSession {
  id: string;
  subjectId: string;
  subjectName: string;
  collegeId: string;
  departmentId: string;
  stage: number;
  section: string;
  studyType: string;
  instructorId: string;
  date: Date;
  records: Record<string, "present" | "absent" | "excused">;
}

export function attendanceSessionFromDoc(id: string, map: any): AttendanceSession {
  return {
    id,
    subjectId: map.subject_id ?? "",
    subjectName: map.subject_name ?? "",
    collegeId: map.college_id ?? "",
    departmentId: map.department_id ?? "",
    stage: map.stage ?? 1,
    section: map.section ?? "أ",
    studyType: map.study_type ?? "",
    instructorId: map.instructor_id ?? "",
    date: map.date ? new Date(map.date) : new Date(),
    records: map.records ?? {},
  };
}

export interface CommentItem {
  id: string;
  fileId: string;
  authorName: string;
  text: string;
  createdAt: Date;
}

export function commentItemFromDoc(id: string, map: any): CommentItem {
  return {
    id,
    fileId: map.file_id ?? "",
    authorName: map.author_name ?? "",
    text: map.text ?? "",
    createdAt: map.created_at ? new Date(map.created_at) : new Date(),
  };
}

export interface AppNotification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  targetType: "content_new" | "department_announcement" | "comment" | "stage_alert";
  unread: boolean;
  createdAt: Date;
}
