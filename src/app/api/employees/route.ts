import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { normalizeEmployeeInput, serializeEmployee } from "@/lib/server-helpers";

export async function GET() {
  try {
    const rows = await db.select().from(employees).orderBy(asc(employees.empNo));
    return NextResponse.json(rows.map(serializeEmployee));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "تعذر تحميل بيانات الموظفين" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const parsed = normalizeEmployeeInput(body);
    if (!parsed.ok) return NextResponse.json({ message: parsed.message }, { status: 400 });
    const [row] = await db.insert(employees).values(parsed.data).returning();
    return NextResponse.json(serializeEmployee(row), { status: 201 });
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json({ message: "الرقم الوظيفي مسجل مسبقاً" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ message: "تعذر حفظ الموظف" }, { status: 500 });
  }
}
