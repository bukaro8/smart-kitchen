import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RecipeDetailPage } from "@/components/recipes/recipe-detail-page";
import { polloAlCurry } from "@/lib/mock-recipes";

export default async function PolloAlCurryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <RecipeDetailPage recipe={polloAlCurry} />;
}
