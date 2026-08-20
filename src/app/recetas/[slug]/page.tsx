import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  RecipeDetailPage,
  type RecipeDetail,
} from "@/components/recipes/recipe-detail-page";
import { getCategoryLabel } from "@/i18n/category-labels";
import { getLocale } from "@/i18n/get-locale";
import { formatMessage, getMessages } from "@/i18n/get-messages";
import { prisma } from "@/server/db";

type RecipePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatNumber(value: number, locale: "es" | "en") {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-GB", {
    maximumFractionDigits: 2,
  }).format(value);
}

function buildIngredientText(
  recipeIngredient: {
  quantity: number | null;
  unit: string | null;
  note: string | null;
  ingredient: {
    nameEs: string;
  };
  },
  locale: "es" | "en",
  ingredientWithNote: string,
) {
  const name = recipeIngredient.ingredient.nameEs;

  if (recipeIngredient.note) {
    return formatMessage(ingredientWithNote, {
      note: recipeIngredient.note,
      name,
    });
  }

  const quantity = recipeIngredient.quantity;
  const unit = recipeIngredient.unit;

  if (quantity && unit) {
    return `${formatNumber(quantity, locale)}${unit === "unidad" ? " " : ""}${unit} ${name}`;
  }

  if (quantity) {
    return `${formatNumber(quantity, locale)} ${name}`;
  }

  return name;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  if (!userId) {
    redirect("/login");
  }

  const locale = await getLocale();
  const allMessages = getMessages(locale);
  const messages = allMessages.common;
  const detailMessages = allMessages.recipeDetail;

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
            {detailMessages.notFoundTitle}
          </h1>
          <p className="mt-3 text-lg text-stone-700">
            {detailMessages.notFoundDescription}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-stone-950 px-5 text-base font-semibold text-white transition hover:bg-stone-800"
          >
            {messages.back}
          </Link>
        </section>
      </main>
    );
  }

  const detailRecipe: RecipeDetail = {
    id: recipe.id,
    name: recipe.nameEs,
    category: getCategoryLabel(recipe.category, locale),
    editHref: `/recetas/${slug}/editar`,
    image: recipe.imageUrl ?? "/images/meals/pollo-curry.svg",
    description: recipe.descriptionEs ?? detailMessages.fallbackDescription,
    info: [
      recipe.caloriesPer100g === null
        ? messages.noData
        : `${recipe.caloriesPer100g} kcal / 100g`,
      recipe.proteinPer100g === null
        ? messages.noData
        : formatMessage(detailMessages.proteinPer100g, {
            value: recipe.proteinPer100g,
          }),
      recipe.prepTimeMinutes
        ? `${recipe.prepTimeMinutes} min`
        : messages.noData,
      recipe.difficulty ?? messages.noData,
    ],
    ingredients: recipe.recipeIngredients.map((ingredient) =>
      buildIngredientText(
        ingredient,
        locale,
        detailMessages.ingredientWithNote,
      ),
    ),
    steps: [...detailMessages.fallbackSteps],
  };

  return <RecipeDetailPage recipe={detailRecipe} locale={locale} />;
}
