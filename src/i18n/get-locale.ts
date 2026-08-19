import { cookies, headers } from "next/headers";
import { cache } from "react";

import { auth } from "@/auth";
import {
  DEFAULT_APP_LOCALE,
  isAppLocale,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/i18n/config";
import { prisma } from "@/server/db";

type LocalePreference = {
  locale: AppLocale;
  quality: number;
  index: number;
};

function getLocaleFromAcceptLanguage(
  acceptLanguage: string | null,
): AppLocale | undefined {
  if (!acceptLanguage) {
    return undefined;
  }

  const supportedPreferences = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [languageRange, ...parameters] = entry.trim().split(";");
      const language = languageRange.toLowerCase().split("-")[0];
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().toLowerCase().startsWith("q="),
      );
      const parsedQuality = qualityParameter
        ? Number.parseFloat(qualityParameter.split("=")[1])
        : 1;

      if (!isAppLocale(language) || !Number.isFinite(parsedQuality)) {
        return null;
      }

      return {
        locale: language,
        quality: parsedQuality,
        index,
      };
    })
    .filter(
      (preference): preference is LocalePreference =>
        preference !== null && preference.quality > 0,
    )
    .sort(
      (firstPreference, secondPreference) =>
        secondPreference.quality - firstPreference.quality ||
        firstPreference.index - secondPreference.index,
    );

  return supportedPreferences[0]?.locale;
}

async function resolveLocale(): Promise<AppLocale> {
  const session = await auth();
  const userId = session?.user?.id;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    if (isAppLocale(user?.locale)) {
      return user.locale;
    }
  }

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;

  if (isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = (await headers()).get("accept-language");

  return getLocaleFromAcceptLanguage(acceptLanguage) ?? DEFAULT_APP_LOCALE;
}

export const getLocale = cache(resolveLocale);
