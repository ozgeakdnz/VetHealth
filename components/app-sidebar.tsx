"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Dog,
  Salad,
  ShieldPlus,
} from "lucide-react";

const navItems = [
  { href: "/pets", label: "Hayvan Profilleri", icon: Dog },
  { href: "/calendar", label: "Asi ve Randevular", icon: CalendarDays },
  { href: "/symptoms", label: "Belirti Gunlugu", icon: ClipboardList },
  { href: "/nutrition", label: "Beslenme Tablosu", icon: Salad },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white p-6 md:flex md:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-sky-100 p-2 text-sky-600">
          <ShieldPlus size={22} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Pet Care
          </p>
          <h1 className="text-lg font-semibold text-slate-900">Vet-Health</h1>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-sky-50 text-sky-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Gunluk Hatirlatma</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Asi tarihlerini kacirmamak icin takvimi her gun kontrol et.
        </p>
      </div>
    </aside>
  );
}
