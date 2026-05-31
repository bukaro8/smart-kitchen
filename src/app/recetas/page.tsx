import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { prisma } from "@/server/db";

export default async function RecipesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const recipes = await prisma.recipe.findMany({
    where: { userId: session.user.id },
    orderBy: { nameEs: "asc" },
    select: {
      nameEs: true,
      nameEn: true,
      slug: true,
      imageUrl: true,
      caloriesPer100g: true,
      proteinPer100g: true,
      prepTimeMinutes: true,
      difficulty: true,
    },
  });

  return (
    <main className="min-h-dvh bg-[#fff8ef] pb-28 text-stone-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <header className="rounded-[1.75rem] bg-white/60 px-5 py-5 ring-1 ring-orange-100 sm:px-7 sm:py-6">
          <h1 className="text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            Recetas
          </h1>
          <p className="mt-3 text-lg text-stone-700">
            Todas tus comidas guardadas
          </p>
        </header>

        {recipes.length > 0 ? (
          <section
            aria-label="Lista de recetas"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {recipes.map((recipe, index) => (
              <article
                key={recipe.slug}
                className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-md shadow-orange-950/5"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-orange-50">
                  <Image
                    src={recipe.imageUrl ?? "/images/meals/pollo-curry.svg"}
                    alt={recipe.nameEs}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>

                <div className="space-y-4 p-5">
                  <div>
                    <h2 className="text-2xl font-semibold leading-tight text-stone-950">
                      {recipe.nameEs}
                    </h2>
                    {recipe.nameEn ? (
                      <p className="mt-1 text-sm font-semibold text-stone-500">
                        {recipe.nameEn}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-stone-700">
                    <div className="rounded-2xl bg-stone-50/70 px-3.5 py-2.5">
                      <p className="text-xs font-medium text-stone-500">
                        Calorías
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {recipe.caloriesPer100g ?? 0}
                        <span className="text-xs font-medium text-stone-500">
                          {" "}
                          / 100g
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50/70 px-3.5 py-2.5">
                      <p className="text-xs font-medium text-stone-500">
                        Proteína
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {recipe.proteinPer100g ?? 0}g
                        <span className="text-xs font-medium text-stone-500">
                          {" "}
                          / 100g
                        </span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50/70 px-3.5 py-2.5">
                      <p className="text-xs font-medium text-stone-500">
                        Tiempo
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {recipe.prepTimeMinutes
                          ? `${recipe.prepTimeMinutes} min`
                          : "Sin tiempo"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50/70 px-3.5 py-2.5">
                      <p className="text-xs font-medium text-stone-500">
                        Dificultad
                      </p>
                      <p className="mt-1 text-base font-semibold">
                        {recipe.difficulty ?? "Fácil"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/recetas/${recipe.slug}`}
                    className="flex min-h-14 items-center justify-center rounded-2xl bg-stone-950 px-4 text-base font-semibold text-white transition hover:bg-stone-800"
                  >
                    Ver receta
                  </Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-[2rem] bg-white/70 px-5 py-8 text-center ring-1 ring-orange-100">
            <p className="text-xl font-semibold text-stone-800">
              No tienes recetas todavía.
            </p>
          </section>
        )}
      </div>

      <BottomNav activeItem="Recetas" />
    </main>
  );
}
