import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { LoadStarterRecipesButton } from "@/components/recipes/load-starter-recipes-button";
import { RecipeCardImage } from "@/components/recipes/recipe-card-image";
import { getCategoryLabel } from "@/i18n/category-labels";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/get-messages";
import {
  buttonPrimary,
  buttonSecondary,
  pageHeader,
  recipePreviewCard,
} from "@/lib/ui-styles";
import { prisma } from "@/server/db";

export default async function RecipesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const allMessages = getMessages(locale);
  const messages = allMessages.common;
  const recipeMessages = allMessages.recipes;

  const recipes = await prisma.recipe.findMany({
    where: { userId: session.user.id },
    orderBy: { nameEs: "asc" },
    select: {
      nameEs: true,
      slug: true,
      imageUrl: true,
      category: true,
    },
  });

  return (
    <main className="min-h-dvh bg-[#fff8ef] pb-28 text-stone-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <header className={pageHeader}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
                {recipeMessages.title}
              </h1>
              <p className="mt-3 text-lg text-stone-700">
                {recipeMessages.subtitle}
              </p>
            </div>
            <Link
              href="/recetas/nueva"
              className={`${buttonPrimary} w-fit text-lg`}
            >
              {messages.addRecipe}
            </Link>
          </div>
        </header>

        {recipes.length > 0 ? (
          <section
            aria-label={recipeMessages.recipeListLabel}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {recipes.map((recipe, index) => (
              <article key={recipe.slug} className={recipePreviewCard}>
                <RecipeCardImage
                  src={recipe.imageUrl ?? "/images/meals/pollo-curry.svg"}
                  alt={recipe.nameEs}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  priority={index === 0}
                />

                <div className="flex flex-1 flex-col p-5">
                  <div>
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      {getCategoryLabel(recipe.category, locale)}
                    </span>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-stone-950">
                      {recipe.nameEs}
                    </h2>
                  </div>

                  <div className="mt-auto pt-6">
                    <Link
                      href={`/recetas/${recipe.slug}`}
                      className={`${buttonSecondary} w-full`}
                    >
                      {messages.viewRecipe}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-[2rem] bg-white/70 px-5 py-8 text-center ring-1 ring-orange-100">
            <p className="text-xl font-semibold text-stone-800">
              {recipeMessages.noRecipes}
            </p>
            <LoadStarterRecipesButton locale={locale} />
          </section>
        )}
      </div>

      <BottomNav activeItem="recipes" />
    </main>
  );
}
