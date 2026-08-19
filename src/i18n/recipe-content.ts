import type { AppLocale } from "@/i18n/config";

export type RecipeNameFields = {
  nameEs: string;
  nameEn?: string | null;
};

export type RecipeDescriptionFields = {
  descriptionEs?: string | null;
  descriptionEn?: string | null;
};

export type LocalizableRecipeContent = RecipeNameFields &
  RecipeDescriptionFields;

function getFirstContentValue(
  ...values: Array<string | null | undefined>
) {
  for (const value of values) {
    const normalizedValue = value?.trim();

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return undefined;
}

export function getLocalizedRecipeName(
  recipe: RecipeNameFields,
  locale: AppLocale,
) {
  if (locale === "en") {
    return getFirstContentValue(recipe.nameEn, recipe.nameEs) ?? "";
  }

  return getFirstContentValue(recipe.nameEs, recipe.nameEn) ?? "";
}

export function getLocalizedRecipeDescription(
  recipe: RecipeDescriptionFields,
  locale: AppLocale,
) {
  if (locale === "en") {
    return getFirstContentValue(
      recipe.descriptionEn,
      recipe.descriptionEs,
    );
  }

  return getFirstContentValue(recipe.descriptionEs, recipe.descriptionEn);
}

export function getLocalizedRecipeContent(
  recipe: LocalizableRecipeContent,
  locale: AppLocale,
) {
  return {
    name: getLocalizedRecipeName(recipe, locale),
    description: getLocalizedRecipeDescription(recipe, locale),
  };
}
