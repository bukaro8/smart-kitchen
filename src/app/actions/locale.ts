"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import {
  isAppLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/i18n/config";
import { prisma } from "@/server/db";

export type UpdateLocaleResult =
  | { success: true; locale: AppLocale }
  | { success: false; error: "unauthenticated" | "invalid_locale" };

export async function updateLocale(
  formData: FormData,
): Promise<UpdateLocaleResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "unauthenticated" };
  }

  const locale = formData.get("locale");

  if (!isAppLocale(locale)) {
    return { success: false, error: "invalid_locale" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { locale },
  });

  const cookieStore = await cookies();

  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");

  return { success: true, locale };
}
