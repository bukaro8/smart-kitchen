"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/server/db";

export type CookTodayState = {
  message?: string;
  error?: string;
};

export type UndoLatestMealState = {
  message?: string;
  error?: string;
};

export async function cookToday(
  _previousState: CookTodayState,
  formData: FormData,
): Promise<CookTodayState> {
  const session = await auth();
  const userId = session?.user?.id;
  const recipeId = formData.get("recipeId");

  if (!userId) {
    return { error: "Inicia sesión para guardar la comida." };
  }

  if (typeof recipeId !== "string" || recipeId.length === 0) {
    return { error: "No se pudo identificar la receta." };
  }

  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!recipe) {
    return { error: "No existe esta receta en tu cocina." };
  }

  await prisma.mealHistory.create({
    data: {
      userId,
      recipeId: recipe.id,
      cookedAt: new Date(),
    },
  });

  return { message: "Comida registrada." };
}

export async function undoLatestMealHistory(
  _previousState: UndoLatestMealState,
  formData: FormData,
): Promise<UndoLatestMealState> {
  const session = await auth();
  const userId = session?.user?.id;
  const mealHistoryId = formData.get("mealHistoryId");

  if (!userId) {
    return { error: "Inicia sesión para modificar el historial." };
  }

  if (typeof mealHistoryId !== "string" || mealHistoryId.length === 0) {
    return { error: "No se pudo identificar el registro." };
  }

  const latestMealHistory = await prisma.mealHistory.findFirst({
    where: { userId },
    orderBy: { cookedAt: "desc" },
    select: { id: true },
  });

  if (!latestMealHistory || latestMealHistory.id !== mealHistoryId) {
    return { error: "Solo puedes deshacer el último registro." };
  }

  await prisma.mealHistory.delete({
    where: { id: mealHistoryId },
  });

  revalidatePath("/");

  return { message: "Registro eliminado." };
}
