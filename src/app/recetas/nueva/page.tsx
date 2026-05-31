import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CreateRecipeForm } from "@/components/recipes/create-recipe-form";

export default async function NewRecipePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-dvh bg-[#fff8ef] pb-28 text-stone-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <header className="rounded-[1.75rem] bg-white/60 px-5 py-5 ring-1 ring-orange-100 sm:px-7 sm:py-6">
          <Link
            href="/recetas"
            className="mb-4 inline-flex min-h-11 items-center rounded-2xl border border-orange-100 bg-white/70 px-4 text-base font-semibold text-stone-700 transition hover:bg-white"
          >
            Volver
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            Añadir receta
          </h1>
          <p className="mt-3 text-lg text-stone-700">
            Guarda una comida sencilla en tu cocina.
          </p>
        </header>

        <section className="rounded-[2rem] bg-white/70 p-5 ring-1 ring-orange-100 sm:p-7">
          <CreateRecipeForm />
        </section>
      </div>

      <BottomNav activeItem="Recetas" />
    </main>
  );
}
