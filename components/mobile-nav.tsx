"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, Dog, Salad } from "lucide-react";

const mobileItems = [
  { href: "/pets", label: "Profil", icon: Dog },
  { href: "/calendar", label: "Takvim", icon: CalendarDays },
  { href: "/symptoms", label: "Belirti", icon: ClipboardList },
  { href: "/nutrition", label: "Beslenme", icon: Salad },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {mobileItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 px-2 py-2 text-[11px] ${
                  isActive ? "text-sky-700" : "text-slate-500"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
