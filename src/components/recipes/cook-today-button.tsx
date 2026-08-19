"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { cookToday, type CookTodayState } from "@/app/actions/meal-history";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { buttonPrimary } from "@/lib/ui-styles";

type CookTodayButtonProps = {
  recipeId: string;
  locale: AppLocale;
  alreadyCookedToday?: boolean;
  className?: string;
  onCookedToday?: (recipeId: string) => void;
  showStatus?: boolean;
};

function SubmitButton({
  alreadyCookedToday = false,
  className,
  locale,
  message,
}: {
  alreadyCookedToday?: boolean;
  className?: string;
  locale: AppLocale;
  message?: string;
}) {
  const { pending } = useFormStatus();
  const isCooked = alreadyCookedToday || Boolean(message);
  const messages = getMessages(locale).common;
  const label = pending
    ? messages.saving
    : isCooked
      ? messages.cookedToday
      : messages.cookToday;

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
  locale,
  alreadyCookedToday = false,
  className,
  onCookedToday,
  showStatus = true,
}: CookTodayButtonProps) {
  const router = useRouter();
  const initialState: CookTodayState = {};
  const [state, formAction] = useActionState(cookToday, initialState);

  useEffect(() => {
    if (state.message) {
      onCookedToday?.(recipeId);
      router.refresh();
    }
  }, [onCookedToday, recipeId, router, state.message]);

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="recipeId" value={recipeId} />
      <SubmitButton
        alreadyCookedToday={alreadyCookedToday}
        className={className}
        locale={locale}
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
