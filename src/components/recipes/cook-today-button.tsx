"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { cookToday, type CookTodayState } from "@/app/actions/meal-history";
import { buttonPrimary } from "@/lib/ui-styles";

type CookTodayButtonProps = {
  recipeId: string;
  alreadyCookedToday?: boolean;
  className?: string;
  showStatus?: boolean;
};

function SubmitButton({
  alreadyCookedToday = false,
  className,
  message,
}: {
  alreadyCookedToday?: boolean;
  className?: string;
  message?: string;
}) {
  const { pending } = useFormStatus();
  const isCooked = alreadyCookedToday || Boolean(message);
  const label = pending
    ? "Guardando..."
    : isCooked
      ? "Cocinada hoy"
      : "Cocinar hoy";

  return (
    <button
      type="submit"
      disabled={pending || isCooked}
      className={
        className ??
        `${buttonPrimary} min-h-16 px-4 text-lg`
      }
    >
      {label}
    </button>
  );
}

export function CookTodayButton({
  recipeId,
  alreadyCookedToday = false,
  className,
  showStatus = true,
}: CookTodayButtonProps) {
  const router = useRouter();
  const initialState: CookTodayState = {};
  const [state, formAction] = useActionState(cookToday, initialState);

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
  }, [router, state.message]);

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="recipeId" value={recipeId} />
      <SubmitButton
        alreadyCookedToday={alreadyCookedToday}
        className={className}
        message={state.message}
      />
      {showStatus ? (
        <p className="min-h-5 text-sm font-semibold text-red-700">
          {state.error ?? ""}
        </p>
      ) : null}
    </form>
  );
}
