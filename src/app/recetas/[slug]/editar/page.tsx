import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CreateRecipeForm } from "@/components/recipes/create-recipe-form";
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

function buildIngredientLine(recipeIngredient: {
  quantity: number | null;
  unit: string | null;
  note: string | null;
  ingredient: {
    nameEs: string;
  };
}) {
  const name = recipeIngredient.ingredient.nameEs;

  if (recipeIngredient.note) {
    return recipeIngredient.note.toLowerCase().includes(name.toLowerCase())
      ? recipeIngredient.note
      : `${recipeIngredient.note} ${name}`;
  }

  const quantity = recipeIngredient.quantity;
  const unit = recipeIngredient.unit;

  if (quantity && unit) {
    return unit === "unidad"
      ? `${formatNumber(quantity)} ${name}`
      : `${formatNumber(quantity)}${unit} ${name}`;
  }

  if (quantity) {
    return `${formatNumber(quantity)} ${name}`;
  }

  return name;
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
      caloriesPer100g: true,
      proteinPer100g: true,
      carbsPer100g: true,
      fatPer100g: true,
      prepTimeMinutes: true,
      difficulty: true,
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
          <h1 className="text-3xl font-semibold">Receta no encontrada</h1>
          <p className="mt-3 text-lg text-stone-700">
            No existe esta receta en tu cocina.
          </p>
          <Link
            href="/recetas"
            className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-stone-950 px-5 text-base font-semibold text-white transition hover:bg-stone-800"
          >
            Volver
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#fff8ef] pb-28 text-stone-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <header className="rounded-[1.75rem] bg-white/60 px-5 py-5 ring-1 ring-orange-100 sm:px-7 sm:py-6">
          <Link
            href={`/recetas/${slug}`}
            className="mb-4 inline-flex min-h-11 items-center rounded-2xl border border-orange-100 bg-white/70 px-4 text-base font-semibold text-stone-700 transition hover:bg-white"
          >
            Volver
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            Editar receta
          </h1>
          <p className="mt-3 text-lg text-stone-700">
            Actualiza los datos de esta comida.
          </p>
        </header>

        <section className="rounded-[2rem] bg-white/70 p-5 ring-1 ring-orange-100 sm:p-7">
          <CreateRecipeForm
            mode="edit"
            initialValues={{
              recipeId: recipe.id,
              nameEs: recipe.nameEs,
              nameEn: recipe.nameEn,
              descriptionEs: recipe.descriptionEs,
              caloriesPer100g: recipe.caloriesPer100g,
              proteinPer100g: recipe.proteinPer100g,
              carbsPer100g: recipe.carbsPer100g,
              fatPer100g: recipe.fatPer100g,
              prepTimeMinutes: recipe.prepTimeMinutes,
              difficulty: recipe.difficulty,
              ingredients: recipe.recipeIngredients
                .map(buildIngredientLine)
                .join("\n"),
            }}
          />
        </section>
      </div>

      <BottomNav activeItem="Recetas" />
    </main>
  );
}
