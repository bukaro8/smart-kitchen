"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  undoLatestMealHistory,
  type UndoLatestMealState,
} from "@/app/actions/meal-history";

type UndoMealHistoryButtonProps = {
  mealHistoryId: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl px-3 py-1.5 text-sm font-semibold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Eliminando..." : "Deshacer"}
    </button>
  );
}

export function UndoMealHistoryButton({
  mealHistoryId,
}: UndoMealHistoryButtonProps) {
  const initialState: UndoLatestMealState = {};
  const [state, formAction] = useActionState(
    undoLatestMealHistory,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="mealHistoryId" value={mealHistoryId} />
      <SubmitButton />
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
