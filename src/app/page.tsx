import {
  ChefHat,
  Soup,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/auth-actions";
import { UserAvatar } from "@/components/auth/user-avatar";
import { RecommendationCard } from "@/components/home/recommendation-card";
import { UndoMealHistoryButton } from "@/components/home/undo-meal-history-button";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadStarterRecipesButton } from "@/components/recipes/load-starter-recipes-button";
import { prisma } from "@/server/db";

const filters = [
  "Rápido",
  "Saludable",
  "Pollo",
  "Pasta",
  "Arroz",
  "Bajo calorías",
];

function getDaysSince(cookedAt: Date) {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfCookedDay = new Date(
    cookedAt.getFullYear(),
    cookedAt.getMonth(),
    cookedAt.getDate(),
  );
  const diffInDays = Math.round(
    (startOfToday.getTime() - startOfCookedDay.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return diffInDays;
}

function getRelativeCookedAtLabel(cookedAt: Date) {
  const diffInDays = getDaysSince(cookedAt);

  if (diffInDays <= 0) {
    return "Hoy";
  }

  if (diffInDays === 1) {
    return "Ayer";
  }

  return `Hace ${diffInDays} días`;
}

function getRecommendationReason(lastCookedAt?: Date) {
  if (!lastCookedAt) {
    return "Nueva en tu cocina";
  }

  const diffInDays = getDaysSince(lastCookedAt);

  if (diffInDays <= 0) {
    return "Cocinada hoy";
  }

  if (diffInDays === 1) {
    return "La cocinaste ayer";
  }

  return `Hace ${diffInDays} días que no la cocinas`;
}

function getVarietySortValue(lastCookedAt?: Date) {
  return lastCookedAt?.getTime() ?? 0;
}

function getUrlHostname(url?: string | null) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname;
  } catch {
    return "invalid-url";
  }
}

export default async function HomeScreen() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const recipes = await prisma.recipe.findMany({
    where: { userId: session.user.id },
    orderBy: { nameEs: "asc" },
    select: {
      id: true,
      slug: true,
      nameEs: true,
      imageUrl: true,
      caloriesPer100g: true,
      proteinPer100g: true,
      prepTimeMinutes: true,
      difficulty: true,
    },
  });

  const recipeIds = recipes.map((recipe) => recipe.id);
  const recipeMealHistory =
    recipeIds.length > 0
      ? await prisma.mealHistory.findMany({
          where: {
            userId: session.user.id,
            recipeId: { in: recipeIds },
          },
          orderBy: { cookedAt: "desc" },
          select: {
            recipeId: true,
            cookedAt: true,
          },
        })
      : [];
  const lastCookedByRecipeId = new Map<string, Date>();

  for (const meal of recipeMealHistory) {
    if (!lastCookedByRecipeId.has(meal.recipeId)) {
      lastCookedByRecipeId.set(meal.recipeId, meal.cookedAt);
    }
  }

  const recentMealHistory = await prisma.mealHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { cookedAt: "desc" },
    take: 20,
    select: {
      id: true,
      cookedAt: true,
      recipe: {
        select: {
          id: true,
          nameEs: true,
        },
      },
    },
  });

  const recentRecipes = new Set<string>();
  const recentMeals = [];

  for (const meal of recentMealHistory) {
    if (recentRecipes.has(meal.recipe.id)) {
      continue;
    }

    recentRecipes.add(meal.recipe.id);
    recentMeals.push({
      id: meal.id,
      when: getRelativeCookedAtLabel(meal.cookedAt),
      name: meal.recipe.nameEs,
    });

    if (recentMeals.length === 3) {
      break;
    }
  }

  const recommendations = recipes
    .map((recipe) => ({
      id: recipe.id,
      name: recipe.nameEs,
      image: recipe.imageUrl ?? "/images/meals/pollo-curry.svg",
      caloriesPer100g: recipe.caloriesPer100g ?? 0,
      proteinPer100g: recipe.proteinPer100g ?? 0,
      lastCookedAt: lastCookedByRecipeId.get(recipe.id),
      href: `/recetas/${recipe.slug}`,
    }))
    .sort(
      (firstRecipe, secondRecipe) =>
        getVarietySortValue(firstRecipe.lastCookedAt) -
        getVarietySortValue(secondRecipe.lastCookedAt),
    )
    .slice(0, 3)
    .map((recipe) => ({
      ...recipe,
      reason: getRecommendationReason(recipe.lastCookedAt),
    }));

  const firstName = session.user.name?.trim().split(/\s+/)[0];
  const title = firstName
    ? `Hola ${firstName[0].toUpperCase()}${firstName.slice(1)}, ¿qué cocinamos hoy?`
    : "Hola, ¿qué cocinamos hoy?";
  const avatarUrl = session.user.image;

  if (process.env.NODE_ENV === "production") {
    console.info("MesaMate avatar image", {
      hasImage: Boolean(avatarUrl),
      imageHostname: getUrlHostname(avatarUrl),
    });
  }

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

        <section aria-label="Recomendaciones">
          {recommendations.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {recommendations.map((meal, index) => (
                <RecommendationCard
                  key={meal.id}
                  meal={meal}
                  priority={index === 0}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] bg-white/70 px-5 py-8 text-center ring-1 ring-orange-100">
              <p className="text-xl font-semibold text-stone-800">
                No tienes recetas todavía.
              </p>
              <LoadStarterRecipesButton />
            </div>
          )}
        </section>

        <section className="rounded-[2rem] bg-white/55 px-5 py-4 ring-1 ring-orange-100/80 sm:px-6">
          <div className="mb-3 flex items-center gap-2.5">
            <Soup size={22} className="text-orange-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-stone-700">
              Cocinado recientemente
            </h2>
          </div>

          {recentMeals.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-3">
              {recentMeals.map((meal, index) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white/55 px-4 py-2.5"
                >
                  <div>
                    <p className="text-xs font-semibold text-stone-500">
                      {meal.when}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-stone-700">
                      {meal.name}
                    </p>
                  </div>
                  {index === 0 ? (
                    <UndoMealHistoryButton mealHistoryId={meal.id} />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-white/55 px-4 py-3 text-sm font-semibold text-stone-600">
              Aún no has cocinado nada.
            </p>
          )}
        </section>
      </div>

      <BottomNav activeItem="Inicio" />
    </main>
  );
}
