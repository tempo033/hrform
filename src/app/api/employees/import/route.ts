import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { normalizeEmployeeInput } from "@/lib/server-helpers";

interface RowError {
  row: number;
  empNo: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { rows?: Record<string, unknown>[] };
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) {
      return NextResponse.json({ message: "لا توجد سجلات للاستيراد" }, { status: 400 });
    }
    if (rows.length > 1000) {
      return NextResponse.json({ message: "الحد الأقصى 1000 سجل في كل عملية استيراد" }, { status: 400 });
    }

    const errors: RowError[] = [];
    const seen = new Set<string>();
    let inserted = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i] ?? {};
      const parsed = normalizeEmployeeInput(raw);
      const empNo = typeof raw.empNo === "string" ? raw.empNo.trim() : "";
      if (!parsed.ok) {
        errors.push({ row: i + 2, empNo: empNo || "—", message: parsed.message });
        continue;
      }
      const key = parsed.data.empNo;
      if (seen.has(key)) {
        errors.push({ row: i + 2, empNo: key, message: "رقم وظيفي مكرر داخل الملف" });
        continue;
      }
      seen.add(key);
      try {
        await db.insert(employees).values(parsed.data);
        inserted += 1;
      } catch (e) {
        const err = e as { code?: string };
        errors.push({
          row: i + 2,
          empNo: key,
          message: err.code === "23505" ? "الرقم الوظيفي مسجل مسبقاً في النظام" : "خطأ أثناء الحفظ",
        });
      }
    }

    return NextResponse.json({ inserted, failed: errors.length, errors });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "تعذر معالجة ملف الاستيراد" }, { status: 500 });
  }
}
