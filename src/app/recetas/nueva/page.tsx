import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CreateRecipeForm } from "@/components/recipes/create-recipe-form";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/get-messages";
import { buttonSecondary, contentCard, pageHeader } from "@/lib/ui-styles";

export default async function NewRecipePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const messages = getMessages(locale);

  return (
    <main className="min-h-dvh bg-[#fff8ef] pb-28 text-stone-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <header className={pageHeader}>
          <Link
            href="/recetas"
            className={`${buttonSecondary} mb-4 min-h-12 px-4`}
          >
            {messages.common.back}
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            {messages.recipes.newTitle}
          </h1>
          <p className="mt-3 text-lg text-stone-700">
            {messages.recipes.newSubtitle}
          </p>
        </header>

        <section className={contentCard}>
          <CreateRecipeForm locale={locale} />
        </section>
      </div>

      <BottomNav activeItem="recipes" />
    </main>
  );
}
