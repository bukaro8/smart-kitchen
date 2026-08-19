"use client";

import { useCallback, useState } from "react";

import {
  RecommendationCard,
  type RecommendationMeal,
} from "@/components/home/recommendation-card";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

type HomeRecommendationsProps = {
  meals: RecommendationMeal[];
  locale: AppLocale;
};

export function HomeRecommendations({
  meals,
  locale,
}: HomeRecommendationsProps) {
  const [visibleMeals, setVisibleMeals] = useState(meals);
  const messages = getMessages(locale).common;

  const handleCookedToday = useCallback((recipeId: string) => {
    setVisibleMeals((currentMeals) =>
      currentMeals.map((meal) =>
        meal.id === recipeId
          ? {
              ...meal,
              cookedToday: true,
              reason: messages.cookedToday,
            }
          : meal,
      ),
    );
  }, [messages.cookedToday]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {visibleMeals.map((meal, index) => (
        <RecommendationCard
          key={meal.id}
          meal={meal}
          locale={locale}
          priority={index === 0}
          onCookedToday={handleCookedToday}
        />
      ))}
    </div>
  );
}
