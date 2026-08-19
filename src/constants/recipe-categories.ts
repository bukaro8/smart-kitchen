export const RECIPE_CATEGORIES = [
  "Arroz",
  "Pasta",
  "Pollo",
  "Carne",
  "Pescado",
  "Legumbres",
  "Sopa/Guiso",
  "Ensalada",
  "Otro",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export function isRecipeCategory(value: string): value is RecipeCategory {
  return (RECIPE_CATEGORIES as readonly string[]).includes(value);
}
