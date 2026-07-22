// مطابق لمنطق fileTypeColor في theme/app_theme.dart، لكن بألوان Design System
// الجديد للموقع (بدل ألوان تطبيق الموبايل القديمة gold/purple/coral).
export function fileTypeColor(type: string): string {
  switch (type) {
    case "ملخص":
      return "#5B3DF5"; // primary
    case "أسئلة":
      return "#3B82F6"; // primary-blue
    case "محاضرة":
      return "#F59E0B"; // status-warning
    default:
      return "#5B3DF5";
  }
}
