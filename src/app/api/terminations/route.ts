import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { employees, terminations } from "@/db/schema";
import { serializeTermination } from "@/lib/server-helpers";
import { calculateEOS, TERMINATION_TYPES, type TerminationCode } from "@/lib/eos";
import { totalWage } from "@/lib/format";

export async function GET() {
  try {
    const rows = await db
      .select({ t: terminations, e: employees })
      .from(terminations)
      .leftJoin(employees, eq(terminations.employeeId, employees.id))
      .orderBy(desc(terminations.createdAt));
    return NextResponse.json(
      rows.map(({ t, e }) =>
        serializeTermination(
          t,
          e ? { id: e.id, empNo: e.empNo, name: e.name, jobTitle: e.jobTitle, department: e.department } : null,
        ),
      ),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "تعذر تحميل سجلات الإنهاء" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      employeeId?: number;
      type?: string;
      noticeDate?: string | null;
      lastWorkingDay?: string;
      reason?: string;
      notes?: string;
    };
    const employeeId = Number(body.employeeId);
    const type = body.type ?? "";
    const lastWorkingDay = (body.lastWorkingDay ?? "").trim();
    if (!Number.isInteger(employeeId)) {
      return NextResponse.json({ message: "يجب اختيار الموظف" }, { status: 400 });
    }
    if (!TERMINATION_TYPES.some((t) => t.code === type)) {
      return NextResponse.json({ message: "نوع الإنهاء غير صالح" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastWorkingDay)) {
      return NextResponse.json({ message: "تاريخ آخر يوم عمل مطلوب" }, { status: 400 });
    }

    const emp = await db.query.employees.findFirst({ where: eq(employees.id, employeeId) });
    if (!emp) return NextResponse.json({ message: "الموظف غير موجود" }, { status: 404 });
    if (emp.status === "terminated") {
      return NextResponse.json({ message: "تم تسجيل إنهاء خدمة هذا الموظف مسبقاً" }, { status: 409 });
    }

    const wage = totalWage({
      basicSalary: Number(emp.basicSalary),
      housingAllowance: Number(emp.housingAllowance),
      transportAllowance: Number(emp.transportAllowance),
      otherAllowances: Number(emp.otherAllowances),
    });
    const hireBase = emp.hireDate ?? emp.contractStart ?? lastWorkingDay;
    const eos = calculateEOS(wage, hireBase, lastWorkingDay, type as TerminationCode);

    const [created] = await db
      .insert(terminations)
      .values({
        employeeId,
        type,
        noticeDate: body.noticeDate && /^\d{4}-\d{2}-\d{2}$/.test(body.noticeDate) ? body.noticeDate : null,
        lastWorkingDay,
        reason: body.reason?.trim() || null,
        notes: body.notes?.trim() || null,
        eosAmount: String(eos.netAmount),
        eosDetails: eos,
      })
      .returning();

    await db
      .update(employees)
      .set({ status: "terminated", updatedAt: new Date() })
      .where(eq(employees.id, employeeId));

    return NextResponse.json(
      serializeTermination(created, {
        id: emp.id,
        empNo: emp.empNo,
        name: emp.name,
        jobTitle: emp.jobTitle,
        department: emp.department,
      }),
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "تعذر تسجيل إنهاء العلاقة التعاقدية" }, { status: 500 });
  }
}
