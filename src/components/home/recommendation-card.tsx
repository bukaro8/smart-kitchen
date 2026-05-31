import Image from "next/image";
import Link from "next/link";

import { CookTodayButton } from "@/components/recipes/cook-today-button";

type RecommendationCardProps = {
  meal: {
    id: string;
    name: string;
    image: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    reason: string;
    href?: string;
  };
  priority?: boolean;
};

export function RecommendationCard({
  meal,
  priority = false,
}: RecommendationCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-md shadow-orange-950/5">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-orange-50">
        <Image
          src={meal.image}
          alt={meal.name}
          fill
          sizes="(min-width: 1024px) 30vw, 90vw"
          className="object-cover"
          priority={priority}
        />
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-xl font-semibold leading-snug text-emerald-700">
            {meal.reason}
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-stone-950">
            {meal.name}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-stone-700">
          <div className="rounded-2xl bg-stone-50/70 px-3.5 py-2.5">
            <p className="text-xs font-medium text-stone-500">Calorías</p>
            <p className="mt-1 text-base font-semibold">
              {meal.caloriesPer100g}
              <span className="text-xs font-medium text-stone-500">
                {" "}
                / 100g
              </span>
            </p>
          </div>
          <div className="rounded-2xl bg-stone-50/70 px-3.5 py-2.5">
            <p className="text-xs font-medium text-stone-500">Proteína</p>
            <p className="mt-1 text-base font-semibold">
              {meal.proteinPer100g}g
              <span className="text-xs font-medium text-stone-500">
                {" "}
                / 100g
              </span>
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          {meal.href ? (
            <Link
              href={meal.href}
              className="flex min-h-14 flex-shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-base font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-stone-950"
            >
              Ver receta
            </Link>
          ) : (
            <button className="min-h-14 flex-shrink-0 rounded-2xl border border-stone-200 bg-white px-4 text-base font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-stone-950">
              Ver receta
            </button>
          )}
          <CookTodayButton
            recipeId={meal.id}
            className="min-h-16 min-w-[10rem] rounded-2xl bg-emerald-700 px-5 text-lg font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>
    </article>
  );
}
