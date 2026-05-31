"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  loadStarterRecipes,
  type LoadStarterRecipesState,
} from "@/app/actions/starter-recipes";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 min-h-14 rounded-2xl bg-emerald-700 px-6 text-lg font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
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
