"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  IdCard,
  AlarmClockCheck,
  FileWarning,
  UserPlus,
  UploadCloud,
  ClipboardList,
  Calculator,
  ArrowLeft,
  BadgeCheck,
  FileSignature,
  UserMinus,
  Building2,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, Spinner, StatCard, cx } from "@/components/ui";
import type { Employee, TerminationRecord } from "@/lib/types";
import { daysUntil, expiryInfo, fmtDate, fmtHijri, fmtMoney } from "@/lib/format";
import { terminationLabel } from "@/lib/eos";

function expiringSoon(employees: Employee[]) {
  return employees
    .filter((e) => !e.isSaudi && e.status === "active" && e.iqamaExpiry)
    .sort((a, b) => (a.iqamaExpiry! < b.iqamaExpiry! ? -1 : 1));
}

function contractsExpiring(employees: Employee[]) {
  return employees
    .filter((e) => e.status === "active" && e.contractType !== "غير محدد المدة" && e.contractEnd)
    .filter((e) => (daysUntil(e.contractEnd) ?? 9999) <= 120)
    .sort((a, b) => (a.contractEnd! < b.contractEnd! ? -1 : 1));
}

export default function Dashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [terminations, setTerminations] = useState<TerminationRecord[]>([]);

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((d) => setEmployees(Array.isArray(d) ? d : []));
    fetch("/api/terminations").then((r) => r.json()).then((d) => setTerminations(Array.isArray(d) ? d : []));
  }, []);

  const stats = useMemo(() => {
    const list = employees ?? [];
    const active = list.filter((e) => e.status === "active");
    const critical = active.filter((e) => {
      if (e.isSaudi) return false;
      const s = expiryInfo(e.iqamaExpiry).state;
      return s === "expired" || s === "critical";
    });
    const contracts = active.filter((e) => {
      if (e.contractType === "غير محدد المدة" || !e.contractEnd) return false;
      const d = daysUntil(e.contractEnd);
      return d !== null && d <= 60;
    });
    return { total: active.length, sponsorship: active.filter((e) => e.onSponsorship && !e.isSaudi).length, critical: critical.length, contracts: contracts.length };
  }, [employees]);

  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour < 12 ? "صباح الخير" : hour < 17 ? "نهارك سعيد" : "مساء الخير";
  const todayGreg = fmtDate(new Date());

  if (employees === null) return <Spinner className="py-32" />;

  const iqamaAlerts = expiringSoon(employees).slice(0, 6);
  const contractAlerts = contractsExpiring(employees).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl bg-pine-950 px-7 py-7 text-white shadow-lg shadow-pine-950/20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 120% at 85% 0%, rgba(16,185,129,0.22), transparent 60%), radial-gradient(40% 80% at 10% 100%, rgba(184,145,47,0.14), transparent 60%)",
          }}
        />
        <svg className="pointer-events-none absolute -left-10 -bottom-12 h-56 w-56 text-white/[0.045]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1l2.8 2.8L19 2.7l1.1 4.2L24 9l-3.9 1.1L21.2 14 17 13l-2 3.9-2-3.9-4.2 1.1L9.9 10 6 8.9l3.9-2.1L8.8 2.9 13 4z" />
        </svg>
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-emerald-300/90">{greeting}،</p>
            <h2 className="mt-1 text-[26px] leading-snug font-bold">منظومة الموارد البشرية المتكاملة</h2>
            <p className="mt-2 text-[13px] text-stone-300">
              {fmtHijri(new Date())} — الموافق <span className="tnum">{todayGreg}</span> م
            </p>
          </div>
          <div className="flex items-center gap-6 sm:gap-10">
            <div className="text-center">
              <p className="tnum text-3xl font-bold text-emerald-300">{stats.total}</p>
              <p className="mt-1 text-[11px] font-medium text-stone-400">موظف على رأس العمل</p>
            </div>
            <span className="h-10 w-px bg-white/10" />
            <div className="text-center">
              <p className="tnum text-3xl font-bold text-[#e5c877]">{stats.sponsorship}</p>
              <p className="mt-1 text-[11px] font-medium text-stone-400">مقيم على كفالة الشركة</p>
            </div>
            <span className="h-10 w-px bg-white/10" />
            <div className="text-center">
              <p className={cx("tnum text-3xl font-bold", stats.critical > 0 ? "text-red-300" : "text-stone-200")}>{stats.critical}</p>
              <p className="mt-1 text-[11px] font-medium text-stone-400">إقامة تحتاج تدخل فوري</p>
            </div>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="إجمالي الموظفين النشطين" value={stats.total} icon={Users} tone="pine" sub="جميع منسوبي الشركة" onClick={() => router.push("/employees")} />
        <StatCard title="على كفالة الشركة" value={stats.sponsorship} icon={IdCard} tone="gold" sub="مقيمون مسجلون باسم المنشأة" onClick={() => router.push("/sponsorship")} />
        <StatCard title="إقامات منتهية أو حرجة" value={stats.critical} icon={AlarmClockCheck} tone="red" sub="انتهت أو تنتهي خلال 30 يوماً" onClick={() => router.push("/iqama")} />
        <StatCard title="عقود تنتهي خلال 60 يوماً" value={stats.contracts} icon={FileWarning} tone="orange" sub="تحتاج تجديداً أو إنهاءً" onClick={() => router.push("/employees")} />
      </div>

      {/* alerts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <BadgeCheck className="h-4.5 w-4.5 text-emerald-700" />
              <h3 className="text-[14px] font-bold text-stone-700">الإقامات — الأقرب انتهاءً</h3>
            </div>
            <Link href="/iqama" className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline">
              القائمة الكاملة <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
          {iqamaAlerts.length === 0 ? (
            <EmptyState icon={BadgeCheck} title="لا توجد إقامات مسجلة" desc="ستظهر هنا الإقامات مرتبة حسب الأقرب انتهاءً" />
          ) : (
            <ul className="divide-y divide-stone-100">
              {iqamaAlerts.map((e) => {
                const info = expiryInfo(e.iqamaExpiry);
                const tone = info.state === "expired" ? "red" : info.state === "critical" ? "orange" : info.state === "warning" ? "amber" : info.state === "notice" ? "sky" : "emerald";
                return (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-stone-50/60">
                    <span className={cx("h-9 w-1 shrink-0 rounded-full", tone === "red" && "bg-red-500", tone === "orange" && "bg-orange-500", tone === "amber" && "bg-amber-500", tone === "sky" && "bg-sky-500", tone === "emerald" && "bg-emerald-500")} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-stone-800">{e.name}</p>
                      <p className="tnum text-[11px] text-stone-400">إقامة {e.iqamaNumber ?? "—"} · تنتهي {fmtDate(e.iqamaExpiry)}</p>
                    </div>
                    <Badge tone={tone} dot pulse={info.state === "expired"}>{info.label}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <FileSignature className="h-4.5 w-4.5 text-[#b8912f]" />
              <h3 className="text-[14px] font-bold text-stone-700">العقود — الأقرب انتهاءً</h3>
            </div>
            <Link href="/employees" className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline">
              قائمة الموظفين <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
          {contractAlerts.length === 0 ? (
            <EmptyState icon={FileSignature} title="لا توجد عقود قريبة الانتهاء" desc="العقود المحددة المدة المنتهية خلال 120 يوماً تظهر هنا" />
          ) : (
            <ul className="divide-y divide-stone-100">
              {contractAlerts.map((e) => {
                const d = daysUntil(e.contractEnd)!;
                const tone = d < 0 ? "red" : d <= 30 ? "orange" : d <= 60 ? "amber" : "sky";
                return (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-stone-50/60">
                    <span className={cx("h-9 w-1 shrink-0 rounded-full", tone === "red" && "bg-red-500", tone === "orange" && "bg-orange-500", tone === "amber" && "bg-amber-500", tone === "sky" && "bg-sky-500")} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-stone-800">{e.name}</p>
                      <p className="tnum text-[11px] text-stone-400">{e.jobTitle} · ينتهي العقد {fmtDate(e.contractEnd)}</p>
                    </div>
                    <Badge tone={tone} dot pulse={d < 0}>{d < 0 ? `انتهى منذ ${Math.abs(d)} يوم` : `متبقي ${d} يوم`}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* quick actions + recent terminations */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <UserMinus className="h-4.5 w-4.5 text-red-500" />
              <h3 className="text-[14px] font-bold text-stone-700">آخر حالات إنهاء العلاقة التعاقدية</h3>
            </div>
            <Link href="/termination" className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline">
              السجل الكامل <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
          {terminations.length === 0 ? (
            <EmptyState icon={UserMinus} title="لا توجد حالات إنهاء موثقة" desc="عند تسجيل إنهاء علاقة تعاقدية ستظهر هنا مع مكافأة نهاية الخدمة المحتسبة" />
          ) : (
            <ul className="divide-y divide-stone-100">
              {terminations.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-stone-800">{t.employee?.name ?? "موظف محذوف"}</p>
                    <p className="text-[11px] text-stone-400">
                      {terminationLabel(t.type)} · آخر يوم عمل <span className="tnum">{fmtDate(t.lastWorkingDay)}</span>
                    </p>
                  </div>
                  <span className="tnum text-[13px] font-bold text-emerald-800">{fmtMoney(t.eosAmount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-4 xl:col-span-2">
          {[
            { href: "/employees?new=1", icon: UserPlus, title: "إضافة موظف", desc: "إدخال يدوي سريع", tone: "text-emerald-700 bg-emerald-700/10" },
            { href: "/employees?import=1", icon: UploadCloud, title: "استيراد Excel", desc: "استرداد دفعة موظفين", tone: "text-sky-700 bg-sky-600/10" },
            { href: "/forms", icon: ClipboardList, title: "النماذج الرسمية", desc: "نماذج الشركة المعتمدة", tone: "text-[#a07f28] bg-[#b8912f]/10" },
            { href: "/eos", icon: Calculator, title: "نهاية الخدمة", desc: "حاسبة المكافأة النظامية", tone: "text-red-600 bg-red-500/10" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <Card className="group flex h-full cursor-pointer flex-col justify-between p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pine-950/10">
                <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110", a.tone)}>
                  <a.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="mt-4">
                  <p className="text-[14px] font-bold text-stone-800">{a.title}</p>
                  <p className="mt-0.5 text-[11px] text-stone-400">{a.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
          <div className="col-span-2 hidden items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-5 py-4 text-stone-400 sm:flex">
            <Building2 className="h-5 w-5 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              جميع القوائم (الكفالة، الإقامات، العقود، نهاية الخدمة) تُبنى تلقائياً على سجل الموظفين — حدّث بيانات الموظف مرة واحدة وستنعكس في كل المنظومة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
