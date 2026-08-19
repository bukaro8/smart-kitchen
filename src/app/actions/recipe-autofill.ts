"use server";

import { auth } from "@/auth";
import { callOpenAIRecipeAutofillJson } from "@/server/openai";

const supportedUnits = [
  "g",
  "ml",
  "unidad",
  "lata",
  "cucharada",
  "cucharadita",
];

const unitAliases: Record<string, string> = {
  unidades: "unidad",
  cucharadas: "cucharada",
  cucharaditas: "cucharadita",
};

export type AutofillIngredient = {
  nameEs: string;
  quantity: number | null;
  unit: string | null;
};

export type RecipeAutofillResult = {
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  ingredients: AutofillIngredient[];
  nutritionPer100g: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
  prepTimeMinutes: number | null;
  difficulty: string | null;
};

export type RecipeAutofillState = {
  success: true;
  data: RecipeAutofillResult;
} | {
  success: false;
  error: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getCurrentIngredients(formData: FormData) {
  const names = formData.getAll("ingredientName");
  const quantities = formData.getAll("ingredientQuantity");
  const units = formData.getAll("ingredientUnit");

  return names
    .map((name, index) => {
      if (typeof name !== "string" || !name.trim()) {
        return null;
      }

      return {
        name: name.trim(),
        quantity:
          typeof quantities[index] === "string"
            ? quantities[index].trim()
            : "",
        unit: typeof units[index] === "string" ? units[index].trim() : "",
      };
    })
    .filter(Boolean);
}

function getCurrentLanguage(formData: FormData) {
  return getString(formData, "language").toLowerCase() === "en" ? "en" : "es";
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value.replace(",", "."));

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getFirstString(
  object: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = optionalString(object[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function getFirstNumber(
  object: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const value = optionalNumber(object[key]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function normalizeUnit(value: unknown) {
  const unit = optionalString(value).toLowerCase();

  if (!unit) {
    return null;
  }

  const normalizedUnit = unitAliases[unit] ?? unit;

  return supportedUnits.includes(normalizedUnit) ? normalizedUnit : null;
}

function parseIngredientString(value: string): AutofillIngredient | null {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  const quantityWithUnit = normalized.match(
    /^(\d+(?:[.,]\d+)?)\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+(.+)$/,
  );

  if (quantityWithUnit) {
    return {
      nameEs: quantityWithUnit[3].trim(),
      quantity: optionalNumber(quantityWithUnit[1]),
      unit: normalizeUnit(quantityWithUnit[2]),
    };
  }

  return {
    nameEs: normalized,
    quantity: null,
    unit: null,
  };
}

function hasNutrition(nutrition: RecipeAutofillResult["nutritionPer100g"]) {
  return nutrition.calories !== null;
}

function hasUsefulAutofillData(
  recipe: RecipeAutofillResult,
) {
  return Boolean(
    recipe.nameEs ||
      recipe.nameEn ||
      recipe.descriptionEs ||
      recipe.descriptionEn ||
      recipe.ingredients.length > 0 ||
      hasNutrition(recipe.nutritionPer100g),
  );
}

function logAutofillValidation(details: {
  model: string;
  rawLength: number;
  parseSucceeded: boolean;
  ingredientCount: number;
  nutritionParsed: boolean;
  validationFailureReason?: string;
}) {
  if (process.env.NODE_ENV === "development") {
    console.info("AI VALIDATION RESULT", details);
  }
}

function logAutofillRequest(details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.info("AI AUTOFILL REQUEST", details);
  }
}

function validateAutofillResult(
  value: unknown,
  language: "es" | "en",
  providedName: string,
): {
  recipe: RecipeAutofillResult | null;
  failureReason?: string;
} {
  if (!value || typeof value !== "object") {
    return {
      recipe: null,
      failureReason: "AI response root was not an object",
    };
  }

  const candidate = value as Record<string, unknown>;
  const ingredients: AutofillIngredient[] = [];

  if (Array.isArray(candidate.ingredients)) {
    for (const ingredient of candidate.ingredients) {
      if (typeof ingredient === "string") {
        const parsedIngredient = parseIngredientString(ingredient);

        if (parsedIngredient) {
          ingredients.push(parsedIngredient);
        }

        continue;
      }

      if (!ingredient || typeof ingredient !== "object") {
        continue;
      }

      const row = ingredient as Record<string, unknown>;
      const name = getFirstString(row, ["name", "nameEs", "ingredient"]);

      if (!name) {
        continue;
      }

      ingredients.push({
        nameEs: name,
        quantity: getFirstNumber(row, ["quantity", "amount"]),
        unit: normalizeUnit(row.unit),
      });
    }
  }

  const name = getFirstString(candidate, ["name", "nameEs", "title"]);
  const description = getFirstString(candidate, [
    "description",
    "descriptionEs",
  ]);
  const finalName = providedName || name;
  return {
    recipe: {
      nameEs: language === "es" ? finalName : "",
      nameEn: language === "en" ? finalName : "",
      descriptionEs: language === "es" ? description : "",
      descriptionEn: language === "en" ? description : "",
      ingredients,
      nutritionPer100g: {
        calories: null,
        protein: null,
        carbs: null,
        fat: null,
      },
      prepTimeMinutes: null,
      difficulty: null,
    },
  };
}

export async function autofillRecipe(
  formData: FormData,
): Promise<RecipeAutofillState> {
  const session = await auth();

  if (!session?.user) {
    return {
      success: false,
      error: "Inicia sesión para autocompletar la receta.",
    };
  }

  const nameEs = getString(formData, "nameEs");
  const nameEn = getString(formData, "nameEn");
  const language = getCurrentLanguage(formData);
  const currentIngredients = getCurrentIngredients(formData);
  const systemPrompt =
    "Eres un asistente de cocina para MesaMate. Responde solo JSON válido, sin markdown, sin explicación. Da una respuesta breve y práctica para una familia. Si el usuario proporciona un nombre de receta, conserva la identidad de ese plato: puedes hacer una variante cercana, pero no lo cambies por otro tipo de comida. Ejemplo: Paella de pollo debe seguir siendo Paella de pollo o Paella de pollo familiar, no guiso, sopa, pasta ni otro plato. No calcules calorías ni otros valores nutricionales. Para ingredientes usa SOLO estas unidades: g, ml, unidad, lata, cucharada, cucharadita. No uses taza, tazas, diente, dientes, hojas, ramas, al gusto ni pizca. Si la cantidad es vaga, usa quantity null y unit null. Ejemplos: sal al gusto -> quantity null, unit null; ajo -> quantity 2, unit unidad; azafrán -> quantity null, unit null.";
  const requestedJsonShape = {
    name: "string",
    description: "string",
    ingredients: [
      {
        name: "string",
        quantity: "number|null",
        unit: "g|ml|unidad|lata|cucharada|cucharadita|null",
      },
    ],
  };
  const currentRecipeInput = {
    nameEs,
    nameEn,
    ingredients: currentIngredients,
  };
  const userPrompt = JSON.stringify({
    task: "Autocompleta una receta familiar práctica para cocinar en casa.",
    recipeNameRule:
      nameEs || nameEn
        ? "Keep the same recipe identity as the provided name. Do not turn it into a different dish."
        : "Choose a simple family recipe name.",
    language:
      language === "en"
        ? "English. Generate name, description, and ingredient names in English only."
        : "Spanish. Generate name, description, and ingredient names in Spanish only.",
    requiredShape: requestedJsonShape,
    currentForm: currentRecipeInput,
  });
  const messages = [
    {
      role: "system" as const,
      content: systemPrompt,
    },
    {
      role: "user" as const,
      content: userPrompt,
    },
  ];

  logAutofillRequest({
    systemPrompt,
    language,
    requestedJsonShape,
    currentRecipeInput,
    messages,
  });

  try {
    const result = await callOpenAIRecipeAutofillJson(messages);
    const providedName = language === "en" ? nameEn : nameEs;
    const validation = validateAutofillResult(
      result.value,
      language,
      providedName,
    );
    const recipe = validation.recipe;
    const validationFailureReason =
      validation.failureReason ??
      (!recipe
        ? "Validation returned no recipe"
        : !hasUsefulAutofillData(recipe)
          ? "AI response had no useful autofill fields"
          : undefined);

    logAutofillValidation({
      model: result.model,
      rawLength: result.rawLength,
      parseSucceeded: result.parseSucceeded,
      ingredientCount: recipe?.ingredients.length ?? 0,
      nutritionParsed: recipe ? hasNutrition(recipe.nutritionPer100g) : false,
      validationFailureReason,
    });

    if (!recipe || validationFailureReason) {
      return {
        success: false,
        error:
          "No se pudo autocompletar la receta. Puedes rellenarla manualmente.",
      };
    }

    return {
      success: true,
      data: recipe,
    };
  } catch {
    return {
      success: false,
      error: "No se pudo autocompletar la receta. Puedes rellenarla manualmente.",
    };
  }
}
