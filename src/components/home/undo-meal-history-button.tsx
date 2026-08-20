"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  undoLatestMealHistory,
  type UndoLatestMealState,
} from "@/app/actions/meal-history";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

type UndoMealHistoryButtonProps = {
  mealHistoryId: string;
  locale: AppLocale;
};

function SubmitButton({ locale }: { locale: AppLocale }) {
  const { pending } = useFormStatus();
  const messages = getMessages(locale).common;

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-3 py-1.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? messages.deleting : messages.undo}
    </button>
  );
}

export function UndoMealHistoryButton({
  mealHistoryId,
  locale,
}: UndoMealHistoryButtonProps) {
  const initialState: UndoLatestMealState = {};
  const [state, formAction] = useActionState(
    undoLatestMealHistory,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="mealHistoryId" value={mealHistoryId} />
      <SubmitButton locale={locale} />
      {state.message ? (
        <p className="text-right text-xs font-semibold text-emerald-700">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p className="text-right text-xs font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
