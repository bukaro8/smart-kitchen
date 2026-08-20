"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { getLocale } from "@/i18n/get-locale";
import { formatMessage, getMessages } from "@/i18n/get-messages";
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
  const locale = await getLocale();
  const messages = getMessages(locale);

  if (!userId) {
    return { error: messages.actions.signInToLoadStarterRecipes };
  }

  const result = await createStarterRecipesForUser(userId);

  revalidatePath("/");
  revalidatePath("/recetas");

  return {
    message: formatMessage(messages.actions.starterRecipesLoaded, {
      count: result.recipeCount,
    }),
  };
}
