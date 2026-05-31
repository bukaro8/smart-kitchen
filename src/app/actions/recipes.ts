"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/server/db";

export type CreateRecipeState = {
  error?: string;
};

export type DeleteRecipeState = {
  error?: string;
};

type ParsedIngredient = {
  nameEs: string;
  quantity?: number;
  unit?: string;
  note?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalInteger(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function createUniqueSlug(
  userId: string,
  nameEs: string,
  ignoredRecipeId?: string,
) {
  const baseSlug = slugify(nameEs) || "receta";
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existingRecipe = await prisma.recipe.findUnique({
      where: {
        userId_slug: {
          userId,
          slug,
        },
      },
      select: { id: true },
    });

    if (!existingRecipe || existingRecipe.id === ignoredRecipeId) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function parseIngredientLine(line: string): ParsedIngredient {
  const normalized = line.trim().replace(/\s+/g, " ");
  const quantityWithUnit = normalized.match(
    /^(\d+(?:[.,]\d+)?)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+(.+)$/,
  );

  if (quantityWithUnit) {
    return {
      quantity: Number.parseFloat(quantityWithUnit[1].replace(",", ".")),
      unit: quantityWithUnit[2].toLowerCase(),
      nameEs: quantityWithUnit[3].trim(),
    };
  }

  const quantityOnly = normalized.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);

  if (quantityOnly) {
    return {
      quantity: Number.parseFloat(quantityOnly[1].replace(",", ".")),
      unit: "unidad",
      nameEs: quantityOnly[2].trim(),
    };
  }

  return {
    nameEs: normalized,
  };
}

export async function createRecipe(
  _previousState: CreateRecipeState,
  formData: FormData,
): Promise<CreateRecipeState> {
  void _previousState;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Inicia sesión para crear una receta." };
  }

  const nameEs = getString(formData, "nameEs");
  const ingredientLines = getString(formData, "ingredients")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!nameEs) {
    return { error: "El nombre de la receta es obligatorio." };
  }

  if (ingredientLines.length === 0) {
    return { error: "Añade al menos un ingrediente." };
  }

  const slug = await createUniqueSlug(userId, nameEs);
  const recipe = await prisma.recipe.create({
    data: {
      userId,
      slug,
      nameEs,
      nameEn: getString(formData, "nameEn") || undefined,
      descriptionEs: getString(formData, "descriptionEs") || undefined,
      imageUrl: "/images/meals/pollo-curry.svg",
      caloriesPer100g: getOptionalInteger(formData, "caloriesPer100g"),
      proteinPer100g: getOptionalInteger(formData, "proteinPer100g"),
      carbsPer100g: getOptionalInteger(formData, "carbsPer100g"),
      fatPer100g: getOptionalInteger(formData, "fatPer100g"),
      prepTimeMinutes: getOptionalInteger(formData, "prepTimeMinutes"),
      difficulty: getString(formData, "difficulty") || undefined,
    },
  });

  for (const [index, line] of ingredientLines.entries()) {
    const ingredientSeed = parseIngredientLine(line);
    const ingredient = await prisma.ingredient.upsert({
      where: {
        userId_nameEs: {
          userId,
          nameEs: ingredientSeed.nameEs,
        },
      },
      update: {},
      create: {
        userId,
        nameEs: ingredientSeed.nameEs,
      },
    });

    await prisma.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        quantity: ingredientSeed.quantity,
        unit: ingredientSeed.unit,
        note: ingredientSeed.note,
        sortOrder: index + 1,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/recetas");
  redirect(`/recetas/${slug}`);
}

export async function updateRecipe(
  _previousState: CreateRecipeState,
  formData: FormData,
): Promise<CreateRecipeState> {
  void _previousState;

  const session = await auth();
  const userId = session?.user?.id;
  const recipeId = getString(formData, "recipeId");

  if (!userId) {
    return { error: "Inicia sesión para editar una receta." };
  }

  if (!recipeId) {
    return { error: "No se pudo identificar la receta." };
  }

  const existingRecipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!existingRecipe) {
    return { error: "No existe esta receta en tu cocina." };
  }

  const nameEs = getString(formData, "nameEs");
  const ingredientLines = getString(formData, "ingredients")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!nameEs) {
    return { error: "El nombre de la receta es obligatorio." };
  }

  if (ingredientLines.length === 0) {
    return { error: "Añade al menos un ingrediente." };
  }

  const slug = await createUniqueSlug(userId, nameEs, existingRecipe.id);

  await prisma.recipe.update({
    where: {
      id: existingRecipe.id,
    },
    data: {
      slug,
      nameEs,
      nameEn: getString(formData, "nameEn") || null,
      descriptionEs: getString(formData, "descriptionEs") || null,
      caloriesPer100g: getOptionalInteger(formData, "caloriesPer100g") ?? null,
      proteinPer100g: getOptionalInteger(formData, "proteinPer100g") ?? null,
      carbsPer100g: getOptionalInteger(formData, "carbsPer100g") ?? null,
      fatPer100g: getOptionalInteger(formData, "fatPer100g") ?? null,
      prepTimeMinutes: getOptionalInteger(formData, "prepTimeMinutes") ?? null,
      difficulty: getString(formData, "difficulty") || null,
    },
  });

  await prisma.recipeIngredient.deleteMany({
    where: { recipeId: existingRecipe.id },
  });

  for (const [index, line] of ingredientLines.entries()) {
    const ingredientSeed = parseIngredientLine(line);
    const ingredient = await prisma.ingredient.upsert({
      where: {
        userId_nameEs: {
          userId,
          nameEs: ingredientSeed.nameEs,
        },
      },
      update: {},
      create: {
        userId,
        nameEs: ingredientSeed.nameEs,
      },
    });

    await prisma.recipeIngredient.create({
      data: {
        recipeId: existingRecipe.id,
        ingredientId: ingredient.id,
        quantity: ingredientSeed.quantity,
        unit: ingredientSeed.unit,
        note: ingredientSeed.note,
        sortOrder: index + 1,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/recetas");
  revalidatePath(`/recetas/${existingRecipe.slug}`);
  revalidatePath(`/recetas/${slug}`);
  redirect(`/recetas/${slug}`);
}

export async function deleteRecipe(
  _previousState: DeleteRecipeState,
  formData: FormData,
): Promise<DeleteRecipeState> {
  void _previousState;

  const session = await auth();
  const userId = session?.user?.id;
  const recipeId = getString(formData, "recipeId");

  if (!userId) {
    return { error: "Inicia sesión para eliminar una receta." };
  }

  if (!recipeId) {
    return { error: "No se pudo identificar la receta." };
  }

  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!recipe) {
    return { error: "No existe esta receta en tu cocina." };
  }

  await prisma.$transaction([
    prisma.recipeIngredient.deleteMany({
      where: { recipeId: recipe.id },
    }),
    prisma.mealHistory.deleteMany({
      where: {
        userId,
        recipeId: recipe.id,
      },
    }),
    prisma.recipe.delete({
      where: { id: recipe.id },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/recetas");
  revalidatePath(`/recetas/${recipe.slug}`);
  redirect("/recetas");
}
