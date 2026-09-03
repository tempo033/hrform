import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employees, terminations } from "@/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const tid = Number(id);
    if (!Number.isInteger(tid)) {
      return NextResponse.json({ message: "معرّف غير صالح" }, { status: 400 });
    }
    const existing = await db.query.terminations.findFirst({ where: eq(terminations.id, tid) });
    if (!existing) return NextResponse.json({ message: "السجل غير موجود" }, { status: 404 });

    await db.delete(terminations).where(eq(terminations.id, tid));

    // إعادة الموظف إلى قائمة العاملين إن لم يعد له أي سجل إنهاء آخر
    const remaining = await db.query.terminations.findFirst({
      where: eq(terminations.employeeId, existing.employeeId),
    });
    if (!remaining) {
      await db
        .update(employees)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(employees.id, existing.employeeId));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "تعذر حذف السجل" }, { status: 500 });
  }
}
