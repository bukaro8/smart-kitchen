import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

export const COOKING_TIME_ZONE = "Europe/London";

export const DATE_LOCALES = {
  es: "es-ES",
  en: "en-GB",
} as const satisfies Record<AppLocale, string>;

type DateValue = Date | number;
type DateFormatOptions = Omit<Intl.DateTimeFormatOptions, "timeZone">;

function toDate(value: DateValue) {
  return value instanceof Date ? value : new Date(value);
}

function getDateParts(value: DateValue) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: COOKING_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(toDate(value));

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function getCalendarDay(value: DateValue) {
  const { year, month, day } = getDateParts(value);

  return Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24);
}

export function getDateLocale(locale: AppLocale) {
  return DATE_LOCALES[locale];
}

export function getDateKey(value: DateValue) {
  const { year, month, day } = getDateParts(value);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatDate(
  value: DateValue,
  locale: AppLocale,
  options: DateFormatOptions = { day: "numeric", month: "long" },
) {
  return new Intl.DateTimeFormat(getDateLocale(locale), {
    ...options,
    timeZone: COOKING_TIME_ZONE,
  }).format(toDate(value));
}

export function formatTime(value: DateValue, locale: AppLocale) {
  return new Intl.DateTimeFormat(getDateLocale(locale), {
    timeZone: COOKING_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(value));
}

export function formatRelativeDate(
  value: DateValue,
  locale: AppLocale,
  now: DateValue = new Date(),
) {
  const dayDifference = getCalendarDay(now) - getCalendarDay(value);
  const messages = getMessages(locale).common;

  if (dayDifference === 0) {
    return messages.today;
  }

  if (dayDifference === 1) {
    return messages.yesterday;
  }

  const valueYear = getDateParts(value).year;
  const currentYear = getDateParts(now).year;

  return formatDate(value, locale, {
    day: "numeric",
    month: "long",
    ...(valueYear !== currentYear ? { year: "numeric" } : {}),
  });
}
