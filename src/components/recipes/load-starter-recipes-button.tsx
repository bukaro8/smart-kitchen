"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  loadStarterRecipes,
  type LoadStarterRecipesState,
} from "@/app/actions/starter-recipes";
import { buttonPrimary } from "@/lib/ui-styles";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonPrimary} mt-5 text-lg`}
    >
      {pending ? "Cargando..." : "Cargar recetas iniciales"}
    </button>
  );
}

export function LoadStarterRecipesButton() {
  const initialState: LoadStarterRecipesState = {};
  const [state, formAction] = useActionState(
    loadStarterRecipes,
    initialState,
  );

  return (
    <form action={formAction}>
      <SubmitButton />
      {state.message ? (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-3 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
