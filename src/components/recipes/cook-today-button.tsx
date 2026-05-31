"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { cookToday, type CookTodayState } from "@/app/actions/meal-history";
import { buttonPrimary } from "@/lib/ui-styles";

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
        `${buttonPrimary} min-h-16 px-4 text-lg`
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
