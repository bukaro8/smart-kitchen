"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createRecipe,
  type CreateRecipeState,
  updateRecipe,
} from "@/app/actions/recipes";

export type RecipeFormValues = {
  recipeId?: string;
  nameEs?: string;
  nameEn?: string | null;
  descriptionEs?: string | null;
  caloriesPer100g?: number | null;
  proteinPer100g?: number | null;
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  prepTimeMinutes?: number | null;
  difficulty?: string | null;
  ingredients?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-14 rounded-2xl bg-emerald-700 px-6 text-lg font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number | null;
}) {
  return (
    <label className="space-y-2">
      <span className="text-base font-semibold text-stone-800">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={type === "number" ? 0 : undefined}
        defaultValue={defaultValue ?? ""}
        className="min-h-14 w-full rounded-2xl border border-orange-100 bg-white/80 px-4 text-lg text-stone-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}

export function CreateRecipeForm({
  mode = "create",
  initialValues = {},
}: {
  mode?: "create" | "edit";
  initialValues?: RecipeFormValues;
}) {
  const initialState: CreateRecipeState = {};
  const action = mode === "edit" ? updateRecipe : createRecipe;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.recipeId ? (
        <input type="hidden" name="recipeId" value={initialValues.recipeId} />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Nombre de la receta"
          name="nameEs"
          defaultValue={initialValues.nameEs}
          required
        />
        <Field
          label="Nombre en inglés"
          name="nameEn"
          defaultValue={initialValues.nameEn}
        />
      </div>

      <label className="space-y-2">
        <span className="text-base font-semibold text-stone-800">
          Descripción
        </span>
        <textarea
          name="descriptionEs"
          rows={3}
          defaultValue={initialValues.descriptionEs ?? ""}
          className="w-full rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-lg text-stone-950 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
        />
      </label>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Calorías / 100g"
          name="caloriesPer100g"
          type="number"
          defaultValue={initialValues.caloriesPer100g}
        />
        <Field
          label="Proteína / 100g"
          name="proteinPer100g"
          type="number"
          defaultValue={initialValues.proteinPer100g}
        />
        <Field
          label="Carbohidratos / 100g"
          name="carbsPer100g"
          type="number"
          defaultValue={initialValues.carbsPer100g}
        />
        <Field
          label="Grasas / 100g"
          name="fatPer100g"
          type="number"
          defaultValue={initialValues.fatPer100g}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Tiempo en minutos"
          name="prepTimeMinutes"
          type="number"
          defaultValue={initialValues.prepTimeMinutes}
        />
        <Field
          label="Dificultad"
          name="difficulty"
          defaultValue={initialValues.difficulty}
        />
      </div>

      <label className="space-y-2">
        <span className="text-base font-semibold text-stone-800">
          Ingredientes
        </span>
        <textarea
          name="ingredients"
          required
          rows={7}
          defaultValue={initialValues.ingredients ?? ""}
          placeholder={`Ejemplo:
200g pollo
50g cebolla
1 tomate`}
          className="w-full rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-lg text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-base font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton
          label={mode === "edit" ? "Guardar cambios" : "Guardar receta"}
        />
      </div>
    </form>
  );
}
