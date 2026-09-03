import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { serializeEmployee } from "@/lib/server-helpers";
import { totalWage } from "@/lib/format";

export async function GET() {
  try {
    const rows = (await db.select().from(employees).orderBy(asc(employees.empNo))).map(serializeEmployee);
    const data = rows.map((e) => ({
      "الرقم الوظيفي": e.empNo,
      "الاسم": e.name,
      "الجنسية": e.nationality,
      "رقم الهوية / الإقامة": e.idNumber,
      "تاريخ انتهاء الإقامة": e.iqamaExpiry ?? "",
      "رقم الجواز": e.passportNumber ?? "",
      "المسمى الوظيفي": e.jobTitle,
      "القسم": e.department,
      "تاريخ المباشرة": e.hireDate ?? "",
      "نوع العقد": e.contractType,
      "تاريخ بداية العقد": e.contractStart ?? "",
      "تاريخ نهاية العقد": e.contractEnd ?? "",
      "الراتب الأساسي": e.basicSalary,
      "بدل السكن": e.housingAllowance,
      "بدل النقل": e.transportAllowance,
      "بدلات أخرى": e.otherAllowances,
      "إجمالي الأجر": totalWage(e),
      "الجوال": e.phone ?? "",
      "البريد الإلكتروني": e.email ?? "",
      "على كفالة الشركة": e.onSponsorship ? "نعم" : "لا",
      "الحالة": e.status === "active" ? "نشط" : "منتهية خدمته",
      "ملاحظات": e.notes ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? { x: 1 }).map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الموظفون");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="employees-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "تعذر تصدير البيانات" }, { status: 500 });
  }
}
