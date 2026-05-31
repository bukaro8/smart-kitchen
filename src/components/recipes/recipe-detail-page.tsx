import { ArrowLeft, Check, Flame, Gauge, Timer, Utensils } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CookTodayButton } from "@/components/recipes/cook-today-button";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";

const infoIcons = [Flame, Gauge, Timer, Utensils];

export type RecipeDetail = {
  id: string;
  name: string;
  editHref: string;
  image: string;
  description: string;
  info: [string, string, string, string];
  ingredients: string[];
  steps: string[];
};

type RecipeDetailPageProps = {
  recipe: RecipeDetail;
};

export function RecipeDetailPage({ recipe }: RecipeDetailPageProps) {
  return (
    <main className="min-h-dvh bg-[#fff8ef] px-5 py-5 pb-10 text-stone-950 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <Link
          href="/"
          className="flex min-h-12 w-fit items-center gap-2 rounded-2xl bg-white/70 px-5 text-base font-semibold text-stone-700 ring-1 ring-orange-100 transition hover:bg-white hover:text-stone-950"
        >
          <ArrowLeft size={20} aria-hidden="true" />
          Volver
        </Link>

        <section className="relative overflow-hidden rounded-[2rem] bg-white shadow-md shadow-orange-950/5 ring-1 ring-orange-100">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -right-16 -top-16 h-[150%] w-[82%] sm:-right-20 sm:w-[72%]">
              <Image
                src={recipe.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 720px, 80vw"
                className="object-cover object-center opacity-60 blur-[0.5px]"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/78 to-white/24" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/82 via-white/20 to-orange-50/20" />
          </div>

          <div className="relative space-y-5 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
                  {recipe.name}
                </h1>
                <p className="mt-3 max-w-2xl text-lg leading-7 text-stone-700 sm:text-xl sm:leading-8">
                  {recipe.description}
                </p>
              </div>

              <div className="w-full rounded-[1.5rem] bg-white/72 p-3 ring-1 ring-orange-100/80 sm:max-w-md">
                <CookTodayButton
                  recipeId={recipe.id}
                  className="min-h-16 w-full rounded-2xl bg-emerald-700 px-8 text-lg font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    href={recipe.editHref}
                    className="flex min-h-14 items-center justify-center rounded-2xl border border-stone-200 bg-white/85 px-4 text-center text-base font-semibold text-stone-700 transition hover:bg-white hover:text-stone-950"
                  >
                    Editar receta
                  </Link>
                  <DeleteRecipeButton
                    recipeId={recipe.id}
                    className="flex min-h-14 items-center justify-center rounded-2xl border border-red-100 bg-white/85 px-4 text-center text-base font-semibold text-red-700 transition hover:bg-red-50 hover:text-red-800"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {recipe.info.map((label, index) => {
                const Icon = infoIcons[index];

                return (
                  <div
                    key={label}
                    className="flex min-h-14 items-center gap-3 rounded-2xl bg-white/75 px-4 text-stone-800 ring-1 ring-white/80"
                  >
                    <Icon
                      size={22}
                      className="text-emerald-700"
                      aria-hidden="true"
                    />
                    <span className="text-base font-semibold">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white/80 p-5 ring-1 ring-orange-100 sm:p-7">
            <h2 className="text-2xl font-semibold">Ingredientes</h2>
            <div className="mt-5 space-y-3">
              {recipe.ingredients.map((ingredient) => (
                <label
                  key={ingredient}
                  className="flex min-h-14 items-center gap-4 rounded-2xl bg-white px-4 text-lg font-semibold text-stone-800 ring-1 ring-stone-100"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg border-2 border-emerald-600 text-emerald-700">
                    <Check size={18} aria-hidden="true" />
                  </span>
                  {ingredient}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/80 p-5 ring-1 ring-orange-100 sm:p-7">
            <h2 className="text-2xl font-semibold">Pasos</h2>
            <ol className="mt-5 space-y-4">
              {recipe.steps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 rounded-2xl bg-white px-4 py-4 text-lg font-semibold leading-7 text-stone-800 ring-1 ring-stone-100"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-base font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
