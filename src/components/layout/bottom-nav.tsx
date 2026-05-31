import {
  BookOpen,
  History,
  Home,
  ShoppingBasket,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { label: "Inicio", icon: Home, href: "/" },
  { label: "Recetas", icon: BookOpen, href: "/recetas" },
  { label: "Compra", icon: ShoppingBasket },
  { label: "Despensa", icon: Warehouse },
  { label: "Historial", icon: History },
];

type BottomNavProps = {
  activeItem: "Inicio" | "Recetas" | "Compra" | "Despensa" | "Historial";
};

export function BottomNav({ activeItem }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-orange-100 bg-white/95 px-3 py-3 shadow-[0_-12px_30px_rgba(120,53,15,0.08)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-4xl grid-cols-5 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === activeItem;
          const className = `flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-semibold transition ${
            isActive
              ? "bg-stone-950 text-white"
              : "text-stone-600 hover:bg-orange-50 hover:text-stone-950"
          }`;

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={className}>
                <Icon size={24} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <button key={item.label} type="button" className={className}>
              <Icon size={24} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
