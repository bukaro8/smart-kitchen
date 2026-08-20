"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";

import { autofillRecipe } from "@/app/actions/recipe-autofill";
import {
  createRecipe,
  type CreateRecipeState,
  updateRecipe,
} from "@/app/actions/recipes";
import { RECIPE_CATEGORIES } from "@/constants/recipe-categories";
import ingredientsData from "@/data/ingredients.json";
import { getCategoryLabel } from "@/i18n/category-labels";
import type { AppLocale, MessageDictionary } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { buttonPrimary, fieldInput, fieldTextarea } from "@/lib/ui-styles";

const unitOptions = ["g", "ml", "unidad", "lata", "cucharada", "cucharadita"];
const minimumIngredientRows = 3;

export type IngredientFormRow = {
  ingredientId?: string | null;
  nameEs?: string;
  quantity?: string | number | null;
  unit?: string | null;
};

type KnownIngredient = {
  id: string;
  nameEn: string;
  nameEs: string;
  defaultUnit: string;
  aliases?: string[];
};

type IngredientRow = {
  id: string;
  ingredientId: string;
  nameEs: string;
  quantity: string;
  unit: string;
};

const knownIngredients = ingredientsData as KnownIngredient[];

export type RecipeFormValues = {
  recipeId?: string;
  nameEs?: string;
  nameEn?: string | null;
  descriptionEs?: string | null;
  imageUrl?: string | null;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  prepTimeMinutes?: number | null;
  difficulty?: string | null;
  category?: string | null;
  ingredientRows?: IngredientFormRow[];
  ingredients?: string;
};

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonPrimary} text-lg`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function createIngredientRows(initialValues: RecipeFormValues) {
  function padRows(rows: IngredientRow[]) {
    const paddedRows = [...rows];

    while (paddedRows.length < minimumIngredientRows) {
      paddedRows.push({
        id: `ingredient-${paddedRows.length}`,
        ingredientId: "",
        nameEs: "",
        quantity: "",
        unit: "",
      });
    }

    return paddedRows;
  }

  if (initialValues.ingredientRows && initialValues.ingredientRows.length > 0) {
    return padRows(
      initialValues.ingredientRows.map((ingredient, index) => ({
        id: `ingredient-${index}`,
        ingredientId: ingredient.ingredientId ?? "",
        nameEs: ingredient.nameEs ?? "",
        quantity: ingredient.quantity?.toString() ?? "",
        unit: ingredient.unit ?? "",
      })),
    );
  }

  if (initialValues.ingredients) {
    const ingredientRows = initialValues.ingredients
      .split(/\r?\n/)
      .map((line, index) => ({
        id: `ingredient-${index}`,
        ingredientId: "",
        nameEs: line.trim(),
        quantity: "",
        unit: "",
      }))
      .filter((ingredient) => ingredient.nameEs);

    if (ingredientRows.length > 0) {
      return padRows(ingredientRows);
    }
  }

  return padRows([]);
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getIngredientDisplayName(ingredient: KnownIngredient) {
  return ingredient.nameEs;
}

function getUnitLabel(
  unit: string,
  messages: MessageDictionary["recipeForm"],
) {
  const labels: Record<string, string> = {
    g: messages.gramUnit,
    ml: messages.millilitreUnit,
    unidad: messages.itemUnit,
    lata: messages.canUnit,
    cucharada: messages.tablespoonUnit,
    cucharadita: messages.teaspoonUnit,
  };

  return labels[unit] ?? unit;
}

function getIngredientSearchValues(ingredient: KnownIngredient) {
  return [
    ingredient.nameEs,
    ingredient.nameEn,
    ...(ingredient.aliases ?? []),
  ].map(normalizeSearchValue);
}

function findKnownIngredient(value: string) {
  const normalizedValue = normalizeSearchValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  return knownIngredients.find((ingredient) =>
    getIngredientSearchValues(ingredient).some(
      (searchValue) => searchValue === normalizedValue,
    ),
  );
}

function getIngredientSuggestions(value: string) {
  const normalizedValue = normalizeSearchValue(value);

  if (!normalizedValue) {
    return knownIngredients.slice(0, 6);
  }

  return knownIngredients
    .filter((ingredient) =>
      getIngredientSearchValues(ingredient).some((searchValue) =>
        searchValue.includes(normalizedValue),
      ),
    )
    .slice(0, 6);
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  onChange,
  value,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
  onChange?: (value: string) => void;
  value?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-base font-semibold text-stone-800">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={type === "number" ? 0 : undefined}
        defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        value={value}
        className={fieldInput}
      />
    </label>
  );
}

function CookingAutofillLoader({
  helperText,
  message,
}: {
  helperText: string;
  message: string;
}) {
  return (
    <div
      aria-live="polite"
      className="rounded-3xl border border-orange-100 bg-orange-50/80 px-4 py-4 text-stone-800 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-orange-100">
          <span
            className="absolute -top-2 left-4 h-3 w-1 rounded-full bg-orange-200 opacity-70 motion-safe:animate-ping"
            aria-hidden="true"
          />
          <span
            className="absolute -top-2 right-4 h-3 w-1 rounded-full bg-orange-200 opacity-70 motion-safe:animate-ping"
            style={{ animationDelay: "350ms" }}
            aria-hidden="true"
          />
          <span className="motion-safe:animate-bounce" aria-hidden="true">
            🍲
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-stone-900">{message}</p>
          <p className="mt-1 text-sm font-medium text-stone-600">
            {helperText}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CreateRecipeForm({
  locale,
  mode = "create",
  initialValues = {},
}: {
  locale: AppLocale;
  mode?: "create" | "edit";
  initialValues?: RecipeFormValues;
}) {
  const messages = getMessages(locale);
  const formMessages = messages.recipeForm;
  const initialState: CreateRecipeState = {};
  const action = mode === "edit" ? updateRecipe : createRecipe;
  const [state, formAction] = useActionState(action, initialState);
  const [isAutofilling, startAutofillTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [autofillError, setAutofillError] = useState("");
  const [autofillSucceeded, setAutofillSucceeded] = useState(false);
  const [autofillMessageIndex, setAutofillMessageIndex] = useState(0);
  const [nameEs, setNameEs] = useState(initialValues.nameEs ?? "");
  const [nameEn, setNameEn] = useState(initialValues.nameEn ?? "");
  const [descriptionEs, setDescriptionEs] = useState(
    initialValues.descriptionEs ?? "",
  );
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    initialValues.prepTimeMinutes?.toString() ?? "",
  );
  const [difficulty, setDifficulty] = useState(initialValues.difficulty ?? "");
  const [nutrition, setNutrition] = useState({
    caloriesPer100g: initialValues.caloriesPer100g?.toString() ?? "",
    proteinPer100g: initialValues.proteinPer100g?.toString() ?? "",
    carbsPer100g: initialValues.carbsPer100g?.toString() ?? "",
    fatPer100g: initialValues.fatPer100g?.toString() ?? "",
  });
  const [ingredientRows, setIngredientRows] = useState(() =>
    createIngredientRows(initialValues),
  );
  const [focusedIngredientRowId, setFocusedIngredientRowId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isAutofilling) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setAutofillMessageIndex(
        (currentIndex) =>
          (currentIndex + 1) % formMessages.autofillLoadingMessages.length,
      );
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [formMessages.autofillLoadingMessages.length, isAutofilling]);

  function addIngredientRow() {
    setIngredientRows((currentRows) => [
      ...currentRows,
      {
        id: `ingredient-${Date.now()}`,
        ingredientId: "",
        nameEs: "",
        quantity: "",
        unit: "",
      },
    ]);
  }

  function removeIngredientRow(id: string) {
    setIngredientRows((currentRows) =>
      currentRows.length > 1
        ? currentRows.filter((ingredient) => ingredient.id !== id)
        : [
            {
              id: "ingredient-0",
              ingredientId: "",
              nameEs: "",
              quantity: "",
              unit: "",
            },
          ],
    );
  }

  function updateIngredientRow(
    id: string,
    updates: Partial<Omit<IngredientRow, "id">>,
  ) {
    setIngredientRows((currentRows) =>
      currentRows.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, ...updates } : ingredient,
      ),
    );
  }

  function handleIngredientNameChange(id: string, value: string) {
    const knownIngredient = findKnownIngredient(value);

    updateIngredientRow(id, {
      nameEs: value,
      ingredientId: knownIngredient?.id ?? "",
      unit: knownIngredient?.defaultUnit ?? "",
    });
  }

  function selectKnownIngredient(id: string, ingredient: KnownIngredient) {
    updateIngredientRow(id, {
      ingredientId: ingredient.id,
      nameEs: getIngredientDisplayName(ingredient),
      unit: ingredient.defaultUnit,
    });
    setFocusedIngredientRowId(null);
  }

  function handleAutofill() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    setAutofillError("");
    setAutofillSucceeded(false);
    setAutofillMessageIndex(0);

    startAutofillTransition(async () => {
      const result = await autofillRecipe(new FormData(form));

      if (!result.success) {
        setAutofillError(result.error);
        setAutofillSucceeded(false);
        return;
      }

      const recipe = result.data;

      if (!nameEs && recipe.nameEs) {
        setNameEs(recipe.nameEs);
      }

      if (!nameEn && recipe.nameEn) {
        setNameEn(recipe.nameEn);
      }

      if (recipe.descriptionEs) {
        setDescriptionEs(recipe.descriptionEs);
      }

      if (recipe.ingredients.length > 0) {
        setIngredientRows(
          recipe.ingredients.map((ingredient, index) => {
            const knownIngredient = findKnownIngredient(ingredient.nameEs);

            return {
              id: `ai-ingredient-${Date.now()}-${index}`,
              ingredientId: knownIngredient?.id ?? "",
              nameEs: ingredient.nameEs,
              quantity: ingredient.quantity?.toString() ?? "",
              unit: knownIngredient?.defaultUnit ?? ingredient.unit ?? "",
            };
          }),
        );
      }

      setNutrition({
        caloriesPer100g: recipe.nutritionPer100g.calories?.toString() ?? "",
        proteinPer100g: "",
        carbsPer100g: "",
        fatPer100g: "",
      });
      setAutofillError("");
      setAutofillSucceeded(true);
    });
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6"
    >
      {initialValues.recipeId ? (
        <input type="hidden" name="recipeId" value={initialValues.recipeId} />
      ) : null}
      <input type="hidden" name="language" value="es" />
      <input
        type="hidden"
        name="caloriesPer100g"
        value={nutrition.caloriesPer100g}
      />
      <input
        type="hidden"
        name="proteinPer100g"
        value={nutrition.proteinPer100g}
      />
      <input
        type="hidden"
        name="carbsPer100g"
        value={nutrition.carbsPer100g}
      />
      <input type="hidden" name="fatPer100g" value={nutrition.fatPer100g} />

      <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <Field
          label={formMessages.recipeNameEs}
          name="nameEs"
          value={nameEs}
          onChange={setNameEs}
          required
        />
        <Field
          label={formMessages.recipeNameEn}
          name="nameEn"
          value={nameEn}
          onChange={setNameEn}
        />
        <button
          type="button"
          onClick={handleAutofill}
          disabled={isAutofilling}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 text-base font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Sparkles
            size={18}
            className={isAutofilling ? "motion-safe:animate-spin" : ""}
            aria-hidden="true"
          />
          {isAutofilling ? formMessages.autofilling : formMessages.autofill}
        </button>
      </div>

      {isAutofilling ? (
        <CookingAutofillLoader
          message={formMessages.autofillLoadingMessages[autofillMessageIndex]}
          helperText={formMessages.autofillWait}
        />
      ) : null}

      <label className="space-y-2">
        <span className="text-base font-semibold text-stone-800">
          {formMessages.description}
        </span>
        <textarea
          name="descriptionEs"
          rows={3}
          value={descriptionEs}
          onChange={(event) => setDescriptionEs(event.target.value)}
          className={fieldTextarea}
        />
      </label>

      <label className="space-y-3">
        <span className="text-base font-semibold text-stone-800">
          {formMessages.recipePhoto}
        </span>
        {initialValues.imageUrl ? (
          <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-3xl bg-orange-50 ring-1 ring-orange-100">
            <Image
              src={initialValues.imageUrl}
              alt={formMessages.currentPhotoAlt}
              fill
              sizes="(min-width: 768px) 448px, 90vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block min-h-14 w-full rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-base font-semibold text-stone-700 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        <p className="text-sm font-medium text-stone-500">
          {formMessages.imageHelp}
        </p>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label={formMessages.prepTime}
          name="prepTimeMinutes"
          type="number"
          value={prepTimeMinutes}
          onChange={setPrepTimeMinutes}
        />
        <Field
          label={formMessages.difficulty}
          name="difficulty"
          value={difficulty}
          onChange={setDifficulty}
        />
      </div>

      <label className="space-y-2">
        <span className="text-base font-semibold text-stone-800">
          {formMessages.category}
        </span>
        <select
          name="category"
          defaultValue={initialValues.category ?? "Otro"}
          required
          className={fieldInput}
        >
          {RECIPE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {getCategoryLabel(category, locale)}
            </option>
          ))}
        </select>
      </label>

      {autofillSucceeded ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {formMessages.aiSuggestion}
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-800">
              {formMessages.ingredients}
            </h2>
            <p className="mt-1 text-sm font-medium text-stone-500">
              {formMessages.ingredientsHelp}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {ingredientRows.map((ingredient, index) => (
            <div
              key={ingredient.id}
              className="grid gap-3 rounded-2xl bg-white/55 p-3 ring-1 ring-orange-100 sm:grid-cols-[1fr_7rem_9rem_3.25rem]"
            >
              <input
                type="hidden"
                name="ingredientId"
                value={ingredient.ingredientId}
              />
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">
                  {formMessages.ingredient}
                </span>
                <div className="relative">
                  <input
                    name="ingredientName"
                    type="text"
                    value={ingredient.nameEs}
                    onChange={(event) =>
                      handleIngredientNameChange(
                        ingredient.id,
                        event.target.value,
                      )
                    }
                    onFocus={() => setFocusedIngredientRowId(ingredient.id)}
                    onBlur={() => {
                      window.setTimeout(
                        () => setFocusedIngredientRowId(null),
                        120,
                      );
                    }}
                    placeholder={
                      index === 0
                        ? formMessages.ingredientExample
                        : formMessages.ingredientPlaceholder
                    }
                    autoComplete="off"
                    className={fieldInput}
                  />
                  {focusedIngredientRowId === ingredient.id ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-lg">
                      {getIngredientSuggestions(ingredient.nameEs).length > 0 ? (
                        getIngredientSuggestions(ingredient.nameEs).map(
                          (suggestion) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() =>
                                selectKnownIngredient(ingredient.id, suggestion)
                              }
                              className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm font-semibold text-stone-700 transition hover:bg-orange-50"
                            >
                              <span>{getIngredientDisplayName(suggestion)}</span>
                              <span className="shrink-0 text-xs font-bold text-stone-400">
                                {getUnitLabel(
                                  suggestion.defaultUnit,
                                  formMessages,
                                )}
                              </span>
                            </button>
                          ),
                        )
                      ) : (
                        <p className="px-4 py-3 text-sm font-medium text-stone-500">
                          {formMessages.useTypedIngredient}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">
                  {formMessages.quantity}
                </span>
                <input
                  name="ingredientQuantity"
                  type="text"
                  inputMode="decimal"
                  value={ingredient.quantity}
                  onChange={(event) =>
                    updateIngredientRow(ingredient.id, {
                      quantity: event.target.value,
                    })
                  }
                  placeholder="200"
                  className={fieldInput}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-700">
                  {formMessages.unit}
                </span>
                {ingredient.ingredientId ? (
                  <>
                    <input
                      type="hidden"
                      name="ingredientUnit"
                      value={ingredient.unit}
                    />
                    <div className="flex min-h-14 items-center rounded-2xl border border-orange-100 bg-orange-50/70 px-4 text-base font-semibold text-stone-700">
                      {ingredient.unit
                        ? getUnitLabel(ingredient.unit, formMessages)
                        : formMessages.noUnit}
                    </div>
                  </>
                ) : (
                  <select
                    name="ingredientUnit"
                    value={ingredient.unit ?? ""}
                    onChange={(event) =>
                      updateIngredientRow(ingredient.id, {
                        unit: event.target.value,
                      })
                    }
                    className={fieldInput}
                  >
                    <option value="">{formMessages.noUnit}</option>
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {getUnitLabel(unit, formMessages)}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <div className="flex items-end justify-end">
                {ingredientRows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(ingredient.id)}
                    aria-label={formMessages.removeIngredient}
                    className="flex size-12 items-center justify-center rounded-2xl border border-red-100 bg-white/80 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={20} aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={addIngredientRow}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-orange-100 bg-white/80 px-4 text-base font-semibold text-stone-700 transition hover:bg-white"
          >
            <Plus size={19} aria-hidden="true" />
            {formMessages.addIngredient}
          </button>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-base font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
      {autofillError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-base font-semibold text-red-700">
          {autofillError}
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton
          label={
            mode === "edit"
              ? formMessages.saveChanges
              : formMessages.saveRecipe
          }
          pendingLabel={messages.common.saving}
        />
      </div>
    </form>
  );
}
