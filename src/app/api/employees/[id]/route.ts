import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { normalizeEmployeeInput, serializeEmployee } from "@/lib/server-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const row = await db.query.employees.findFirst({ where: eq(employees.id, Number(id)) });
  if (!row) return NextResponse.json({ message: "الموظف غير موجود" }, { status: 404 });
  return NextResponse.json(serializeEmployee(row));
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const empId = Number(id);
    if (!Number.isInteger(empId)) {
      return NextResponse.json({ message: "معرّف غير صالح" }, { status: 400 });
    }
    const body = (await req.json()) as Record<string, unknown>;

    // تحديث جزئي سريع (مثل تجديد الإقامة أو نقل الكفالة)
    if (body.partial === true) {
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      const allowed = ["iqamaExpiry", "iqamaNumber", "onSponsorship", "contractEnd", "status", "phone", "email", "notes"];
      for (const key of allowed) {
        if (key in body) patch[key] = body[key] === "" ? null : body[key];
      }
      const [row] = await db.update(employees).set(patch).where(eq(employees.id, empId)).returning();
      if (!row) return NextResponse.json({ message: "الموظف غير موجود" }, { status: 404 });
      return NextResponse.json(serializeEmployee(row));
    }

    const existing = await db.query.employees.findFirst({ where: eq(employees.id, empId) });
    if (!existing) return NextResponse.json({ message: "الموظف غير موجود" }, { status: 404 });
    const parsed = normalizeEmployeeInput({ ...existing, ...body });
    if (!parsed.ok) return NextResponse.json({ message: parsed.message }, { status: 400 });
    const [row] = await db
      .update(employees)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(employees.id, empId))
      .returning();
    return NextResponse.json(serializeEmployee(row));
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "23505") {
      return NextResponse.json({ message: "الرقم الوظيفي مسجل مسبقاً" }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ message: "تعذر تحديث بيانات الموظف" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const [row] = await db.delete(employees).where(eq(employees.id, Number(id))).returning();
    if (!row) return NextResponse.json({ message: "الموظف غير موجود" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "تعذر حذف الموظف" }, { status: 500 });
  }
}
