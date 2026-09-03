"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  IdCard,
  BadgeCheck,
  ClipboardList,
  UserMinus,
  Calculator,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cx } from "./ui";
import { fmtHijri } from "@/lib/format";
import InstallApp from "./install-app";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "الرئيسية",
    items: [
      { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
      { href: "/employees", label: "قائمة الموظفين", icon: Users },
    ],
  },
  {
    group: "السجلات والمتابعة",
    items: [
      { href: "/sponsorship", label: "الموظفون على الكفالة", icon: IdCard },
      { href: "/iqama", label: "الإقامات وتواريخ الانتهاء", icon: BadgeCheck },
      { href: "/termination", label: "انتهاء العلاقة التعاقدية", icon: UserMinus },
    ],
  },
  {
    group: "الأدوات",
    items: [
      { href: "/forms", label: "النماذج الرسمية", icon: ClipboardList },
      { href: "/eos", label: "حاسبة نهاية الخدمة", icon: Calculator },
    ],
  },
];

const TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: "لوحة التحكم", sub: "نظرة شاملة على القوى العاملة والتنبيهات التنظيمية" },
  "/employees": { title: "قائمة الموظفين", sub: "السجل الرئيسي لجميع منسوبي الشركة" },
  "/sponsorship": { title: "الموظفون على الكفالة", sub: "متابعة المقيمين المسجلين على كفالة الشركة" },
  "/iqama": { title: "الإقامات وتواريخ الانتهاء", sub: "رصد صلاحية الإقامات ومواعيد التجديد" },
  "/forms": { title: "النماذج الرسمية", sub: "نماذج الموارد البشرية المعتمدة في الشركة" },
  "/termination": { title: "انتهاء العلاقة التعاقدية", sub: "توثيق حالات إنهاء العلاقة ومستحقاتها" },
  "/eos": { title: "حاسبة نهاية الخدمة", sub: "احتساب مكافأة نهاية الخدمة وفق نظام العمل السعودي" },
};

function BrandMark() {
  return (
    <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 shadow-lg shadow-emerald-950/40 ring-1 ring-white/15">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 2.5l2.6 2.6 3.7-1 1 3.7 2.2 3-2.2 3-1 3.7-3.7-1L12 19.5l-2.6-2.6-3.7 1-1-3.7-2.2-3 2.2-3 1-3.7 3.7 1z" strokeLinejoin="round" />
        <circle cx="12" cy="11" r="2.6" />
      </svg>
      <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full border-2 border-pine-950 bg-[#b8912f]" />
    </span>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = TITLES[pathname] ?? TITLES["/"];

  return (
    <div className="flex min-h-screen">
      {/* ---------- Sidebar ---------- */}
      <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col bg-pine-950 text-stone-300 lg:flex">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-60"
          style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(16,185,129,0.18), transparent 70%)" }}
        />
        <div className="relative flex items-center gap-3 px-5 pt-6 pb-5">
          <BrandMark />
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-bold text-white">شركة البنية الأساسية</p>
            <p className="mt-0.5 text-[11px] font-medium tracking-wide text-emerald-400/90">نظام الموارد البشرية</p>
          </div>
        </div>

        <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-stone-500">{section.group}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-l from-emerald-600/25 to-emerald-500/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "text-stone-400 hover:bg-white/[0.05] hover:text-stone-100",
                      )}
                    >
                      <span
                        className={cx(
                          "absolute inset-y-2 right-0 w-[3px] rounded-full transition-all",
                          active ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" : "bg-transparent",
                        )}
                      />
                      <item.icon
                        className={cx("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-emerald-300" : "text-stone-500 group-hover:text-stone-300")}
                        strokeWidth={2}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative border-t border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[13px] font-bold text-emerald-300 ring-1 ring-white/10">
              م ح
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-stone-200">إدارة الموارد البشرية</p>
              <p className="text-[10px] text-stone-500">صلاحية المدير</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ---------- Main ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-stone-200/80 bg-[#ecefed]/85 px-5 backdrop-blur-md lg:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-bold text-stone-800">{meta.title}</h1>
            <p className="hidden truncate text-[11.5px] text-stone-500 md:block">{meta.sub}</p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-800/15 bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-pine-800 shadow-sm md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {fmtHijri(new Date())}
          </div>
          <InstallApp />
          <button
            onClick={() => router.push("/employees?new=1")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-pine-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-pine-950"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.2} />
            <span className="hidden sm:inline">إضافة موظف</span>
          </button>
        </header>

        {/* Mobile nav */}
        <div className="sticky top-[68px] z-20 flex gap-1.5 overflow-x-auto border-b border-stone-200/80 bg-[#ecefed]/95 px-4 py-2 backdrop-blur-md lg:hidden">
          {NAV.flatMap((s) => s.items).map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition-colors",
                  active ? "bg-emerald-700 text-white shadow-sm" : "bg-white text-stone-600 ring-1 ring-stone-200",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <main key={pathname} className="animate-page min-w-0 flex-1 px-5 py-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
