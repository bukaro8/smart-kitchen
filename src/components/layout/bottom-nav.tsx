import {
  BookOpen,
  History,
  Home,
} from "lucide-react";
import Link from "next/link";

import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/get-messages";

const navItems = [
  { id: "home", labelKey: "home", icon: Home, href: "/" },
  { id: "recipes", labelKey: "recipes", icon: BookOpen, href: "/recetas" },
  {
    id: "history",
    labelKey: "history",
    icon: History,
    href: "/historial",
  },
] as const;

type BottomNavProps = {
  activeItem: (typeof navItems)[number]["id"];
};

export async function BottomNav({ activeItem }: BottomNavProps) {
  const locale = await getLocale();
  const messages = getMessages(locale).common;

  return (
    <nav
      aria-label={messages.mainNavigation}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-orange-100 bg-white/95 px-3 py-3 shadow-[0_-12px_30px_rgba(120,53,15,0.08)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeItem;
          const className = `flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-semibold transition ${
            isActive
              ? "bg-emerald-700 text-white"
              : "text-stone-600 hover:bg-orange-50 hover:text-stone-950"
          }`;

          return (
            <Link key={item.id} href={item.href} className={className}>
              <Icon size={24} aria-hidden="true" />
              <span>{messages[item.labelKey]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
