import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CreateRecipeForm } from "@/components/recipes/create-recipe-form";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/get-messages";
import { buttonSecondary, contentCard, pageHeader } from "@/lib/ui-styles";
import { prisma } from "@/server/db";

type EditRecipePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : String(value).replace(".", ",");
}

function buildIngredientRow(recipeIngredient: {
  quantity: number | null;
  unit: string | null;
  note: string | null;
  ingredient: {
    nameEs: string;
  };
}) {
  const quantity = recipeIngredient.quantity;

  return {
    nameEs: recipeIngredient.ingredient.nameEs,
    quantity: quantity === null ? "" : formatNumber(quantity),
    unit: recipeIngredient.unit,
  };
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  if (!userId) {
    redirect("/login");
  }

  const locale = await getLocale();
  const messages = getMessages(locale);

  const { slug } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: {
      userId_slug: {
        userId,
        slug,
      },
    },
    select: {
      id: true,
      nameEs: true,
      nameEn: true,
      descriptionEs: true,
      imageUrl: true,
      caloriesPer100g: true,
      proteinPer100g: true,
      carbsPer100g: true,
      fatPer100g: true,
      prepTimeMinutes: true,
      difficulty: true,
      category: true,
      recipeIngredients: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          quantity: true,
          unit: true,
          note: true,
          ingredient: {
            select: {
              nameEs: true,
            },
          },
        },
      },
    },
  });

  if (!recipe) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#fff8ef] px-5 py-10 text-stone-950">
        <section className="w-full max-w-md rounded-[2rem] bg-white/80 p-7 text-center shadow-sm ring-1 ring-orange-100">
          <h1 className="text-3xl font-semibold">
            {messages.recipeDetail.notFoundTitle}
          </h1>
          <p className="mt-3 text-lg text-stone-700">
            {messages.recipeDetail.notFoundDescription}
          </p>
          <Link
            href="/recetas"
            className={`${buttonSecondary} mt-6`}
          >
            {messages.common.back}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#fff8ef] pb-28 text-stone-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <header className={pageHeader}>
          <Link
            href={`/recetas/${slug}`}
            className={`${buttonSecondary} mb-4 min-h-12 px-4`}
          >
            {messages.common.back}
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            {messages.recipes.editTitle}
          </h1>
          <p className="mt-3 text-lg text-stone-700">
            {messages.recipes.editSubtitle}
          </p>
        </header>

        <section className={contentCard}>
          <CreateRecipeForm
            mode="edit"
            locale={locale}
            initialValues={{
              recipeId: recipe.id,
              nameEs: recipe.nameEs,
              nameEn: recipe.nameEn,
              descriptionEs: recipe.descriptionEs,
              imageUrl: recipe.imageUrl,
              caloriesPer100g: recipe.caloriesPer100g,
              proteinPer100g: recipe.proteinPer100g,
              carbsPer100g: recipe.carbsPer100g,
              fatPer100g: recipe.fatPer100g,
              prepTimeMinutes: recipe.prepTimeMinutes,
              difficulty: recipe.difficulty,
              category: recipe.category,
              ingredientRows: recipe.recipeIngredients.map(buildIngredientRow),
            }}
          />
        </section>
      </div>

      <BottomNav activeItem="recipes" />
    </main>
  );
}
