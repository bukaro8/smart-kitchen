import { History } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RecipeCardImage } from "@/components/recipes/recipe-card-image";
import { getCategoryLabel } from "@/i18n/category-labels";
import {
  formatRelativeDate,
  formatTime,
  getDateKey,
} from "@/i18n/date-format";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/get-messages";
import {
  buttonSecondary,
  contentCard,
  pageHeader,
} from "@/lib/ui-styles";
import { prisma } from "@/server/db";

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const messages = getMessages(locale);

  const mealHistory = await prisma.mealHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { cookedAt: "desc" },
    select: {
      id: true,
      cookedAt: true,
      recipe: {
        select: {
          slug: true,
          nameEs: true,
          category: true,
          imageUrl: true,
        },
      },
    },
  });

  const today = new Date();
  const groupedHistory: Array<{
    key: string;
    heading: string;
    entries: typeof mealHistory;
  }> = [];

  for (const entry of mealHistory) {
    const key = getDateKey(entry.cookedAt);
    const currentGroup = groupedHistory.at(-1);

    if (currentGroup?.key === key) {
      currentGroup.entries.push(entry);
      continue;
    }

    groupedHistory.push({
      key,
      heading: formatRelativeDate(entry.cookedAt, locale, today),
      entries: [entry],
    });
  }

  return (
    <main className="min-h-dvh bg-[#fff8ef] pb-28 text-stone-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-8">
        <header className={pageHeader}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex rounded-2xl bg-emerald-50 p-2.5 text-emerald-800">
              <History size={24} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
                {messages.history.title}
              </h1>
              <p className="mt-2 text-base text-stone-700 sm:text-lg">
                {messages.history.subtitle}
              </p>
            </div>
          </div>
        </header>

        {groupedHistory.length > 0 ? (
          <div className="space-y-7">
            {groupedHistory.map((group) => (
              <section
                key={group.key}
                aria-labelledby={`history-${group.key}`}
              >
                <h2
                  id={`history-${group.key}`}
                  className="mb-3 text-lg font-semibold text-stone-700"
                >
                  {group.heading}
                </h2>

                <div className="divide-y divide-stone-100 overflow-hidden rounded-[1.375rem] border border-stone-200/80 bg-white shadow-sm shadow-stone-950/5">
                  {group.entries.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/recetas/${entry.recipe.slug}`}
                      className="flex items-center gap-4 px-3 py-3 transition hover:bg-orange-50/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-emerald-100 sm:px-4"
                    >
                      <RecipeCardImage
                        src={
                          entry.recipe.imageUrl ??
                          "/images/meals/pollo-curry.svg"
                        }
                        alt={entry.recipe.nameEs}
                        sizes="72px"
                        variant="compact"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold leading-snug text-stone-950 sm:text-lg">
                            {entry.recipe.nameEs}
                          </h3>
                          <time
                            dateTime={entry.cookedAt.toISOString()}
                            className="shrink-0 pt-0.5 text-xs font-medium text-stone-500 sm:text-sm"
                          >
                            {formatTime(entry.cookedAt, locale)}
                          </time>
                        </div>
                        <span className="mt-2 inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">
                          {getCategoryLabel(entry.recipe.category, locale)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className={`${contentCard} py-10 text-center sm:py-14`}>
            <span className="mx-auto inline-flex rounded-full bg-orange-50 p-4 text-orange-600">
              <History size={30} aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-stone-900 sm:text-2xl">
              {messages.history.emptyTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-base leading-7 text-stone-600">
              {messages.history.emptyDescription}
            </p>
            <Link
              href="/recetas"
              className={`${buttonSecondary} mt-6 w-fit`}
            >
              {messages.common.viewRecipes}
            </Link>
          </section>
        )}
      </div>

      <BottomNav activeItem="history" />
    </main>
  );
}
