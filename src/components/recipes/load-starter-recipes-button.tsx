"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  loadStarterRecipes,
  type LoadStarterRecipesState,
} from "@/app/actions/starter-recipes";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import { buttonPrimary } from "@/lib/ui-styles";

function SubmitButton({ locale }: { locale: AppLocale }) {
  const { pending } = useFormStatus();
  const messages = getMessages(locale).recipes;

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonPrimary} mt-5 text-lg`}
    >
      {pending ? messages.loadingStarterRecipes : messages.loadStarterRecipes}
    </button>
  );
}

export function LoadStarterRecipesButton({ locale }: { locale: AppLocale }) {
  const initialState: LoadStarterRecipesState = {};
  const [state, formAction] = useActionState(
    loadStarterRecipes,
    initialState,
  );

  return (
    <form action={formAction}>
      <SubmitButton locale={locale} />
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
