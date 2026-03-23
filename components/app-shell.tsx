"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, Dog, Menu, Salad, ShieldPlus, X } from "lucide-react";
import { useMemo, useState } from "react";

const navItems = [
  { href: "/pets", label: "Profil", icon: Dog },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
  { href: "/symptoms", label: "Sağlık Günlüğü", icon: ClipboardList },
  { href: "/nutrition", label: "Beslenme", icon: Salad },
];

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const activePath = useMemo(() => (pathname === "/" ? "/pets" : pathname), [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white p-6 md:flex md:flex-col">
        <SidebarContent activePath={activePath} onNavigate={() => undefined} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 md:hidden">
          <button
            type="button"
            aria-label="Menüyü aç"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-teal-700" />
            <span className="text-sm font-semibold text-slate-900">Vet-Health</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-100 px-4 py-4 md:px-8 md:py-8">{children}</main>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Menüyü kapat" className="absolute inset-0 bg-black/35" onClick={() => setIsOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-slate-200 bg-white p-6">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                aria-label="Menüyü kapat"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent activePath={activePath} onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}

type SidebarContentProps = {
  activePath: string;
  onNavigate: () => void;
};

function SidebarContent({ activePath, onNavigate }: SidebarContentProps) {
  return (
    <>
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-xl bg-teal-100 p-2 text-teal-700">
          <ShieldPlus size={22} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pet Care</p>
          <h1 className="text-lg font-semibold text-slate-900">Vet-Health</h1>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = activePath === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Pati Dostu</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">Günlük takip ve akıllı öneriler için her zaman yanında.</p>
      </div>
    </>
  );
}
