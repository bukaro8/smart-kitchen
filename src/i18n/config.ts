export const APP_LOCALES = ["es", "en"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_APP_LOCALE: AppLocale = "es";

export const LOCALE_COOKIE_NAME = "mesamate_locale";

export type MessageDictionary = {
  common: {
    home: string;
    recipes: string;
    history: string;
    mainNavigation: string;
    language: string;
    today: string;
    yesterday: string;
    viewRecipe: string;
    cookToday: string;
    cookedToday: string;
    ingredients: string;
    steps: string;
    editRecipe: string;
    deleteRecipe: string;
    deleteRecipeConfirmation: string;
    deleteRecipeWarning: string;
    delete: string;
    addRecipe: string;
    back: string;
    cancel: string;
    saving: string;
    deleting: string;
    noData: string;
    signOut: string;
  };
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}
