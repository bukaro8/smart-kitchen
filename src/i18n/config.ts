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
    viewRecipes: string;
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
    undo: string;
    noData: string;
    signOut: string;
  };
  home: {
    todayInYourKitchen: string;
    greetingWithName: string;
    greeting: string;
    lunchIdeas: string;
    recommendationsLabel: string;
    noRecipes: string;
    recentlyCooked: string;
    nothingCooked: string;
    daysAgo: string;
    newToYourKitchen: string;
    cookedYesterday: string;
    daysNotCooked: string;
    quickAndLight: string;
  };
  recipes: {
    title: string;
    subtitle: string;
    recipeListLabel: string;
    noRecipes: string;
    loadingStarterRecipes: string;
    loadStarterRecipes: string;
    starterRecipesLoaded: string;
    newTitle: string;
    newSubtitle: string;
    editTitle: string;
    editSubtitle: string;
  };
  history: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  recipeDetail: {
    notFoundTitle: string;
    notFoundDescription: string;
    fallbackDescription: string;
    proteinPer100g: string;
    ingredientWithNote: string;
    fallbackSteps: readonly string[];
  };
  recipeForm: {
    recipeNameEs: string;
    recipeNameEn: string;
    autofill: string;
    autofilling: string;
    autofillWait: string;
    autofillLoadingMessages: readonly string[];
    description: string;
    recipePhoto: string;
    currentPhotoAlt: string;
    imageHelp: string;
    prepTime: string;
    difficulty: string;
    category: string;
    aiSuggestion: string;
    ingredients: string;
    ingredientsHelp: string;
    ingredient: string;
    ingredientExample: string;
    ingredientPlaceholder: string;
    quantity: string;
    unit: string;
    noUnit: string;
    gramUnit: string;
    millilitreUnit: string;
    itemUnit: string;
    canUnit: string;
    tablespoonUnit: string;
    teaspoonUnit: string;
    useTypedIngredient: string;
    removeIngredient: string;
    addIngredient: string;
    saveChanges: string;
    saveRecipe: string;
  };
  login: {
    title: string;
    description: string;
    signInWithGoogle: string;
  };
  actions: {
    signInToCreateRecipe: string;
    recipeNameRequired: string;
    validCategoryRequired: string;
    ingredientRequired: string;
    signInToEditRecipe: string;
    recipeNotIdentified: string;
    recipeNotFound: string;
    signInToDeleteRecipe: string;
    imageType: string;
    imageTooLarge: string;
    imageUploadNotConfigured: string;
    imageUploadFailed: string;
    imageUrlMissing: string;
    signInToSaveMeal: string;
    signInToEditHistory: string;
    historyEntryNotIdentified: string;
    onlyLatestHistoryCanBeUndone: string;
    historyEntryRemoved: string;
    signInToLoadStarterRecipes: string;
    starterRecipesLoaded: string;
    signInToAutofill: string;
    autofillFailed: string;
  };
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}
