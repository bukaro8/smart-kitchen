import Link from "next/link";

import { CookTodayButton } from "@/components/recipes/cook-today-button";
import { RecipeCardImage } from "@/components/recipes/recipe-card-image";
import { getCategoryLabel } from "@/i18n/category-labels";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";
import {
  buttonPrimary,
  buttonSecondary,
  recipePreviewCard,
} from "@/lib/ui-styles";

export type RecommendationMeal = {
  id: string;
  name: string;
  category: string;
  image: string;
  reason: string;
  cookedToday: boolean;
  href?: string;
};

type RecommendationCardProps = {
  meal: RecommendationMeal;
  locale: AppLocale;
  onCookedToday?: (recipeId: string) => void;
  priority?: boolean;
};

export function RecommendationCard({
  meal,
  locale,
  onCookedToday,
  priority = false,
}: RecommendationCardProps) {
  const messages = getMessages(locale).common;

  return (
    <article className={recipePreviewCard}>
      <RecipeCardImage
        src={meal.image}
        alt={meal.name}
        sizes="(min-width: 1024px) 30vw, 90vw"
        priority={priority}
      />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div>
          <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">
            {getCategoryLabel(meal.category, locale)}
          </span>
          <h2 className="mt-3 text-2xl font-semibold leading-tight text-stone-950">
            {meal.name}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-emerald-700">
            {meal.reason}
          </p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
          {meal.href ? (
            <Link
              href={meal.href}
              className={`${buttonSecondary} w-full px-4 text-stone-600`}
            >
              {messages.viewRecipe}
            </Link>
          ) : (
            <button className={`${buttonSecondary} w-full px-4 text-stone-600`}>
              {messages.viewRecipe}
            </button>
          )}
          <CookTodayButton
            recipeId={meal.id}
            locale={locale}
            alreadyCookedToday={meal.cookedToday}
            onCookedToday={onCookedToday}
            showStatus={false}
            className={`${buttonPrimary} w-full px-4`}
          />
        </div>
      </div>
    </article>
  );
}
