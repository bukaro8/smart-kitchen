"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { updateLocale } from "@/app/actions/locale";
import { APP_LOCALES, type AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

type LanguageSelectorProps = {
  locale: AppLocale;
};

export function LanguageSelector({ locale }: LanguageSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const messages = getMessages(locale).common;

  function selectLocale(nextLocale: AppLocale) {
    if (nextLocale === locale || isPending) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();

      formData.set("locale", nextLocale);

      const result = await updateLocale(formData);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div
      role="group"
      aria-label={messages.language}
      className="inline-flex rounded-xl border border-stone-200/80 bg-stone-100/80 p-1"
    >
      {APP_LOCALES.map((option) => {
        const isActive = option === locale;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => selectLocale(option)}
            className={`min-h-8 rounded-lg px-2.5 text-xs font-semibold uppercase transition disabled:cursor-wait ${
              isActive
                ? "bg-white text-emerald-800 shadow-sm ring-1 ring-stone-200"
                : "text-stone-500 hover:bg-white/70 hover:text-stone-800"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
