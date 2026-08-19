import type { AppLocale, MessageDictionary } from "@/i18n/config";
import { enMessages } from "@/i18n/messages/en";
import { esMessages } from "@/i18n/messages/es";

const messagesByLocale = {
  es: esMessages,
  en: enMessages,
} satisfies Record<AppLocale, MessageDictionary>;

export function getMessages(locale: AppLocale): MessageDictionary {
  return messagesByLocale[locale];
}
