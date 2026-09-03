import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const TEMPLATE_HEADERS = [
  "الرقم الوظيفي",
  "الاسم",
  "الجنسية",
  "رقم الهوية / الإقامة",
  "تاريخ انتهاء الإقامة",
  "رقم الجواز",
  "المسمى الوظيفي",
  "القسم",
  "تاريخ المباشرة",
  "نوع العقد",
  "تاريخ بداية العقد",
  "تاريخ نهاية العقد",
  "الراتب الأساسي",
  "بدل السكن",
  "بدل النقل",
  "بدلات أخرى",
  "الجوال",
  "البريد الإلكتروني",
  "على كفالة الشركة",
  "ملاحظات",
];

const EXAMPLE_ROWS = [
  [
    "1001",
    "أحمد محمد العتيبي",
    "سعودي",
    "1087654321",
    "",
    "",
    "مهندس موقع",
    "العمليات",
    "2021-03-15",
    "غير محدد المدة",
    "2021-03-15",
    "",
    "9000",
    "2250",
    "600",
    "0",
    "0501234567",
    "a.alotaibi@example.com",
    "لا",
    "مثال — سعودي لا يحتاج إقامة",
  ],
  [
    "1002",
    "محمد حسن علي",
    "مصري",
    "2456789012",
    "2026-08-20",
    "A12345678",
    "محاسب",
    "المالية",
    "2023-01-02",
    "محدد المدة",
    "2023-01-02",
    "2027-01-01",
    "5500",
    "1375",
    "500",
    "0",
    "0559876543",
    "m.hassan@example.com",
    "نعم",
    "مثال — التواريخ بصيغة سنة-شهر-يوم",
  ],
];

export async function GET() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...EXAMPLE_ROWS]);
  ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(16, h.length + 6) }));
  ws["!rtl"] = true;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "الموظفون");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="employees-import-template.xlsx"',
    },
  });
}
