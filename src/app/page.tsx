import {
  BookOpen,
  ChefHat,
  History,
  Home,
  ShoppingBasket,
  Soup,
  Warehouse,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/auth-actions";
import { UserAvatar } from "@/components/auth/user-avatar";
import { RecommendationCard } from "@/components/home/recommendation-card";

const recommendations = [
  {
    name: "Pollo al curry",
    image: "/images/meals/pollo-curry.svg",
    caloriesPer100g: 165,
    proteinPer100g: 19,
    reason: "Hace 12 días que no lo cocinas",
    href: "/recetas/pollo-al-curry",
  },
  {
    name: "Paella de pollo",
    image: "/images/meals/paella-pollo.svg",
    caloriesPer100g: 178,
    proteinPer100g: 14,
    reason: "Ingredientes disponibles",
    href: "/recetas/paella-de-pollo",
  },
  {
    name: "Lentejas con chorizo",
    image: "/images/meals/lentejas-chorizo.svg",
    caloriesPer100g: 152,
    proteinPer100g: 11,
    reason: "Alta proteína",
    href: "/recetas/lentejas-con-chorizo",
  },
];

const filters = [
  "Rápido",
  "Saludable",
  "Pollo",
  "Pasta",
  "Arroz",
  "Bajo calorías",
];

const recentMeals = [
  { when: "Hoy", name: "Paella de pollo" },
  { when: "Hace 2 días", name: "Pasta boloñesa" },
  { when: "Hace 5 días", name: "Pollo al curry" },
];

const navItems = [
  { label: "Inicio", icon: Home },
  { label: "Recetas", icon: BookOpen },
  { label: "Compra", icon: ShoppingBasket },
  { label: "Despensa", icon: Warehouse },
  { label: "Historial", icon: History },
];

export default async function HomeScreen() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const firstName = session.user.name?.trim().split(/\s+/)[0];
  const title = firstName
    ? `Hola ${firstName}, ¿qué cocinamos hoy?`
    : "Hola, ¿qué cocinamos hoy?";
  const avatarUrl = session.user.image;

  return (
    <main className="min-h-dvh bg-[#fff8ef] pb-28 text-stone-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <header className="rounded-[1.75rem] bg-white/60 px-5 py-5 ring-1 ring-orange-100 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                  <ChefHat size={18} aria-hidden="true" />
                  Hoy en tu cocina
                </div>
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-lg text-stone-700">
                Comidas sugeridas para hoy
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-3xl bg-white/70 px-3 py-2 ring-1 ring-orange-100">
              <UserAvatar src={avatarUrl} />
              <SignOutButton />
            </div>
          </div>
        </header>

        <section aria-label="Filtros rápidos" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                className="min-h-14 rounded-2xl border border-orange-100/70 bg-white/40 px-6 text-lg font-semibold text-stone-600 transition hover:bg-white/75 hover:text-stone-900"
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section aria-label="Recomendaciones" className="grid gap-6 lg:grid-cols-3">
          {recommendations.map((meal) => (
            <RecommendationCard
              key={meal.name}
              meal={meal}
              priority={meal.image === "/images/meals/paella-pollo.svg"}
            />
          ))}
        </section>

        <section className="rounded-[2rem] bg-white/55 px-5 py-4 ring-1 ring-orange-100/80 sm:px-6">
          <div className="mb-3 flex items-center gap-2.5">
            <Soup size={22} className="text-orange-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-stone-700">
              Cocinado recientemente
            </h2>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {recentMeals.map((meal) => (
              <div
                key={`${meal.when}-${meal.name}`}
                className="rounded-2xl bg-white/55 px-4 py-2.5"
              >
                <p className="text-xs font-semibold text-stone-500">
                  {meal.when}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-700">
                  {meal.name}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-orange-100 bg-white/95 px-3 py-3 shadow-[0_-12px_30px_rgba(120,53,15,0.08)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-4xl grid-cols-5 gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-semibold transition ${
                  index === 0
                    ? "bg-stone-950 text-white"
                    : "text-stone-600 hover:bg-orange-50 hover:text-stone-950"
                }`}
              >
                <Icon size={24} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
