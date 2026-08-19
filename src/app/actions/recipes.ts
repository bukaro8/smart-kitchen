"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isRecipeCategory } from "@/constants/recipe-categories";
import { uploadRecipeImageFromFormData } from "@/server/cloudinary";
import { prisma } from "@/server/db";
import { callOpenAINutritionEstimateJson } from "@/server/openai";

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

function getOptionalFloat(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsed = Number.parseFloat(value.trim().replace(",", "."));

  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value.trim().replace(",", "."));

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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

function getIngredientRows(formData: FormData) {
  const names = formData.getAll("ingredientName");
  const quantities = formData.getAll("ingredientQuantity");
  const units = formData.getAll("ingredientUnit");
  const structuredIngredients: ParsedIngredient[] = [];

  for (const [index, name] of names.entries()) {
    if (typeof name !== "string" || !name.trim()) {
      continue;
    }

    const unit = units[index];

    structuredIngredients.push({
      nameEs: name.trim().replace(/\s+/g, " "),
      quantity: getOptionalFloat(quantities[index] ?? null),
      unit: typeof unit === "string" && unit.trim() ? unit.trim() : undefined,
    });
  }

  if (structuredIngredients.length > 0) {
    return structuredIngredients;
  }

  return getString(formData, "ingredients")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIngredientLine);
}

async function replaceRecipeIngredients({
  recipeId,
  userId,
  ingredients,
}: {
  recipeId: string;
  userId: string;
  ingredients: ParsedIngredient[];
}) {
  await prisma.recipeIngredient.deleteMany({
    where: { recipeId },
  });

  for (const [index, ingredientSeed] of ingredients.entries()) {
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
        recipeId,
        ingredientId: ingredient.id,
        quantity: ingredientSeed.quantity,
        unit: ingredientSeed.unit,
        note: ingredientSeed.note,
        sortOrder: index + 1,
      },
    });
  }
}

async function estimateCaloriesPer100g({
  nameEs,
  descriptionEs,
  ingredients,
}: {
  nameEs: string;
  descriptionEs: string;
  ingredients: ParsedIngredient[];
}) {
  try {
    const result = await callOpenAINutritionEstimateJson([
      {
        role: "system",
        content:
          "Eres un asistente de nutrición para MesaMate. Responde solo JSON válido. Estima caloriesPer100g como número. Usa los ingredientes finales, cantidades y unidades. Considera calorías ocultas probables: aceite usado para freír o sofreír, mantequilla, vino, salsas, caldo, azúcar, queso, ingredientes cremosos y el método de cocción implícito por el nombre de la receta. Prefiere una sobreestimación cautelosa antes que subestimar.",
      },
      {
        role: "user",
        content: JSON.stringify({
          recipe: {
            name: nameEs,
            description: descriptionEs,
            ingredients: ingredients.map((ingredient) => ({
              name: ingredient.nameEs,
              quantity: ingredient.quantity ?? null,
              unit: ingredient.unit ?? null,
            })),
          },
          expectedShape: {
            caloriesPer100g: "number",
          },
        }),
      },
    ]);

    if (!result.value || typeof result.value !== "object") {
      return null;
    }

    const calories = optionalNumber(
      (result.value as Record<string, unknown>).caloriesPer100g,
    );

    return calories === null ? null : Math.round(calories);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.info("AI NUTRITION FALLBACK", {
        message:
          error instanceof Error
            ? error.message
            : "Could not estimate calories",
      });
    }

    return null;
  }
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
  const descriptionEs = getString(formData, "descriptionEs");
  const category = getString(formData, "category");
  const ingredients = getIngredientRows(formData);

  if (!nameEs) {
    return { error: "El nombre de la receta es obligatorio." };
  }

  if (!isRecipeCategory(category)) {
    return { error: "Selecciona una categoría válida." };
  }

  if (ingredients.length === 0) {
    return { error: "Añade al menos un ingrediente." };
  }

  const imageUpload = await uploadRecipeImageFromFormData(formData);

  if (imageUpload.error) {
    return { error: imageUpload.error };
  }

  const slug = await createUniqueSlug(userId, nameEs);
  const caloriesPer100g = await estimateCaloriesPer100g({
    nameEs,
    descriptionEs,
    ingredients,
  });
  const recipe = await prisma.recipe.create({
    data: {
      userId,
      slug,
      nameEs,
      nameEn: getString(formData, "nameEn") || undefined,
      descriptionEs: descriptionEs || undefined,
      imageUrl: imageUpload.url,
      caloriesPer100g,
      proteinPer100g: getOptionalInteger(formData, "proteinPer100g"),
      carbsPer100g: getOptionalInteger(formData, "carbsPer100g"),
      fatPer100g: getOptionalInteger(formData, "fatPer100g"),
      prepTimeMinutes: getOptionalInteger(formData, "prepTimeMinutes"),
      difficulty: getString(formData, "difficulty") || undefined,
      category,
    },
  });

  await replaceRecipeIngredients({
    recipeId: recipe.id,
    userId,
    ingredients,
  });

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
  const descriptionEs = getString(formData, "descriptionEs");
  const category = getString(formData, "category");
  const ingredients = getIngredientRows(formData);

  if (!nameEs) {
    return { error: "El nombre de la receta es obligatorio." };
  }

  if (!isRecipeCategory(category)) {
    return { error: "Selecciona una categoría válida." };
  }

  if (ingredients.length === 0) {
    return { error: "Añade al menos un ingrediente." };
  }

  const imageUpload = await uploadRecipeImageFromFormData(formData);

  if (imageUpload.error) {
    return { error: imageUpload.error };
  }

  const slug = await createUniqueSlug(userId, nameEs, existingRecipe.id);
  const caloriesPer100g = await estimateCaloriesPer100g({
    nameEs,
    descriptionEs,
    ingredients,
  });

  await prisma.recipe.update({
    where: {
      id: existingRecipe.id,
    },
    data: {
      slug,
      nameEs,
      nameEn: getString(formData, "nameEn") || null,
      descriptionEs: descriptionEs || null,
      ...(imageUpload.url ? { imageUrl: imageUpload.url } : {}),
      caloriesPer100g,
      proteinPer100g: getOptionalInteger(formData, "proteinPer100g") ?? null,
      carbsPer100g: getOptionalInteger(formData, "carbsPer100g") ?? null,
      fatPer100g: getOptionalInteger(formData, "fatPer100g") ?? null,
      prepTimeMinutes: getOptionalInteger(formData, "prepTimeMinutes") ?? null,
      difficulty: getString(formData, "difficulty") || null,
      category,
    },
  });

  await replaceRecipeIngredients({
    recipeId: existingRecipe.id,
    userId,
    ingredients,
  });

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
  revalidatePath("/historial");
  revalidatePath(`/recetas/${recipe.slug}`);
  redirect("/recetas");
}
