"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createRecipe,
  type CreateRecipeState,
  updateRecipe,
} from "@/app/actions/recipes";
import { buttonPrimary, fieldInput, fieldTextarea } from "@/lib/ui-styles";

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
  ingredients?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonPrimary} text-lg`}
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
        className={fieldInput}
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
    <form action={formAction} encType="multipart/form-data" className="space-y-6">
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
          className={fieldTextarea}
        />
      </label>

      <label className="space-y-3">
        <span className="text-base font-semibold text-stone-800">
          Foto de la receta
        </span>
        {initialValues.imageUrl ? (
          <div className="relative aspect-[16/9] w-full max-w-md overflow-hidden rounded-3xl bg-orange-50 ring-1 ring-orange-100">
            <Image
              src={initialValues.imageUrl}
              alt="Foto actual de la receta"
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
          JPG, PNG o WebP. Máximo 5 MB. Puedes guardar la receta sin foto.
        </p>
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
          className={fieldTextarea}
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
