"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import { deleteRecipe, type DeleteRecipeState } from "@/app/actions/recipes";
import { buttonDestructive, buttonSecondary } from "@/lib/ui-styles";

type DeleteRecipeButtonProps = {
  recipeId: string;
  className?: string;
};

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-12 rounded-2xl bg-red-700 px-5 text-base font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}

export function DeleteRecipeButton({
  recipeId,
  className,
}: DeleteRecipeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialState: DeleteRecipeState = {};
  const [state, formAction] = useActionState(deleteRecipe, initialState);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ??
          buttonDestructive
        }
      >
        Eliminar receta
      </button>

      {state.error ? (
        <p className="w-full text-sm font-semibold text-red-700">
          {state.error}
        </p>
      ) : null}

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-5 py-8"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl shadow-stone-950/20 ring-1 ring-red-100">
            <h2 id={titleId} className="text-2xl font-semibold text-stone-950">
              ¿Eliminar receta?
            </h2>
            <p id={descriptionId} className="mt-3 text-base text-stone-700">
              Esta acción eliminará la receta y su historial de cocinado. No se
              puede deshacer.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`${buttonSecondary} min-h-12`}
              >
                Cancelar
              </button>
              <form action={formAction}>
                <input type="hidden" name="recipeId" value={recipeId} />
                <DeleteSubmitButton />
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
