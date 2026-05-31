"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { cookToday, type CookTodayState } from "@/app/actions/meal-history";

type CookTodayButtonProps = {
  recipeId: string;
  className?: string;
};

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "min-h-16 rounded-2xl bg-emerald-700 px-4 text-lg font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
      }
    >
      {pending ? "Guardando..." : "Cocinar hoy"}
    </button>
  );
}

export function CookTodayButton({ recipeId, className }: CookTodayButtonProps) {
  const initialState: CookTodayState = {};
  const [state, formAction] = useActionState(cookToday, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="recipeId" value={recipeId} />
      <SubmitButton className={className} />
      {state.message ? (
        <p className="text-sm font-semibold text-emerald-700">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-semibold text-red-700">{state.error}</p>
      ) : null}
    </form>
  );
}
