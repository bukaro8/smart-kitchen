import type { AppLocale } from "@/i18n/config";

const categoryLabels = {
  Arroz: { es: "Arroz", en: "Rice" },
  Pasta: { es: "Pasta", en: "Pasta" },
  Pollo: { es: "Pollo", en: "Chicken" },
  Carne: { es: "Carne", en: "Meat" },
  Pescado: { es: "Pescado", en: "Fish" },
  Legumbres: { es: "Legumbres", en: "Legumes" },
  "Sopa/Guiso": { es: "Sopa/Guiso", en: "Soup/Stew" },
  Ensalada: { es: "Ensalada", en: "Salad" },
  Otro: { es: "Otro", en: "Other" },
} as const satisfies Record<string, Record<AppLocale, string>>;

type TranslatedRecipeCategory = keyof typeof categoryLabels;

export function getCategoryLabel(category: string, locale: AppLocale): string {
  const labels = categoryLabels[category as TranslatedRecipeCategory];

  return labels?.[locale] ?? category;
}
