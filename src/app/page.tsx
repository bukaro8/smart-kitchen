import {
  ChefHat,
  Soup,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/auth-actions";
import { LanguageSelector } from "@/components/auth/language-selector";
import { UserAvatar } from "@/components/auth/user-avatar";
import { HomeRecommendations } from "@/components/home/home-recommendations";
import { UndoMealHistoryButton } from "@/components/home/undo-meal-history-button";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadStarterRecipesButton } from "@/components/recipes/load-starter-recipes-button";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/get-messages";
import { pageHeader } from "@/lib/ui-styles";
import { prisma } from "@/server/db";

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

type RecommendationRecipe = {
  caloriesPer100g: number | null;
  prepTimeMinutes: number | null;
};

function getRecommendationReason(
  recipe: RecommendationRecipe,
  lastCookedAt?: Date,
  cookedTodayLabel = "Cocinada hoy",
) {
  const isFast = recipe.prepTimeMinutes !== null && recipe.prepTimeMinutes <= 35;
  const isLight =
    recipe.caloriesPer100g !== null && recipe.caloriesPer100g <= 180;

  if (!lastCookedAt) {
    return "Nueva en tu cocina";
  }

  const diffInDays = getDaysSince(lastCookedAt);

  if (diffInDays <= 0) {
    return cookedTodayLabel;
  }

  if (diffInDays === 1) {
    return "La cocinaste ayer";
  }

  if (isFast && isLight) {
    return "Rápida y ligera";
  }

  return `Hace ${diffInDays} días que no la cocinas`;
}

function getRecommendationScore(
  recipe: RecommendationRecipe,
  lastCookedAt?: Date,
) {
  let score = 0;

  if (!lastCookedAt) {
    score += 40;
  } else {
    const daysSinceCooked = getDaysSince(lastCookedAt);

    score += Math.min(Math.max(daysSinceCooked, 0), 30);

    if (daysSinceCooked === 1) {
      score -= 25;
    }
  }

  if (recipe.prepTimeMinutes !== null && recipe.prepTimeMinutes <= 35) {
    score += 10;
  }

  if (recipe.caloriesPer100g !== null && recipe.caloriesPer100g <= 180) {
    score += 5;
  }

  return score;
}

function sortRecommendationCandidates<
  Candidate extends { name: string; score: number },
>(candidates: Candidate[]) {
  return candidates.toSorted((firstRecipe, secondRecipe) => {
    if (firstRecipe.score !== secondRecipe.score) {
      return secondRecipe.score - firstRecipe.score;
    }

    return firstRecipe.name.localeCompare(secondRecipe.name, "es");
  });
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

  const locale = await getLocale();
  const messages = getMessages(locale).common;

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
      category: true,
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

  const recommendationCandidates = recipes.map((recipe) => {
    const lastCookedAt = lastCookedByRecipeId.get(recipe.id);

    return {
      id: recipe.id,
      name: recipe.nameEs,
      category: recipe.category,
      image: recipe.imageUrl ?? "/images/meals/pollo-curry.svg",
      caloriesPer100g: recipe.caloriesPer100g,
      proteinPer100g: recipe.proteinPer100g,
      prepTimeMinutes: recipe.prepTimeMinutes,
      difficulty: recipe.difficulty,
      rawCaloriesPer100g: recipe.caloriesPer100g,
      lastCookedAt,
      cookedToday: lastCookedAt ? getDaysSince(lastCookedAt) <= 0 : false,
      score: getRecommendationScore(recipe, lastCookedAt),
      href: `/recetas/${recipe.slug}`,
    };
  });
  const visibleByBaseScore = sortRecommendationCandidates(
    recommendationCandidates,
  ).slice(0, 3);
  const lowestVisibleScore = visibleByBaseScore.at(-1)?.score ?? 0;
  const recommendations = sortRecommendationCandidates(
    recommendationCandidates.map((recipe) => ({
      ...recipe,
      score: recipe.cookedToday ? lowestVisibleScore + 0.001 : recipe.score,
    })),
  )
    .slice(0, 3)
    .map((recipe) => ({
      ...recipe,
      reason: getRecommendationReason(
        {
          caloriesPer100g: recipe.rawCaloriesPer100g,
          prepTimeMinutes: recipe.prepTimeMinutes,
        },
        recipe.lastCookedAt,
        messages.cookedToday,
      ),
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
        <header className={pageHeader}>
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

            <div className="flex w-fit flex-wrap items-center gap-3 rounded-3xl bg-white/70 px-3 py-2 ring-1 ring-orange-100">
              <UserAvatar src={avatarUrl} />
              <LanguageSelector locale={locale} />
              <SignOutButton locale={locale} />
            </div>
          </div>
        </header>

        <section aria-label="Recomendaciones">
          {recommendations.length > 0 ? (
            <HomeRecommendations
              key={locale}
              meals={recommendations}
              locale={locale}
            />
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

      <BottomNav activeItem="home" />
    </main>
  );
}
