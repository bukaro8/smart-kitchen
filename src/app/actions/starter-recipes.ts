"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { createStarterRecipesForUser } from "@/server/starter-recipes";

export type LoadStarterRecipesState = {
  message?: string;
  error?: string;
};

export async function loadStarterRecipes(
  _previousState: LoadStarterRecipesState,
): Promise<LoadStarterRecipesState> {
  void _previousState;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { error: "Inicia sesión para cargar recetas." };
  }

  const result = await createStarterRecipesForUser(userId);

  revalidatePath("/");
  revalidatePath("/recetas");

  return {
    message: `${result.recipeCount} recetas iniciales cargadas.`,
  };
}
