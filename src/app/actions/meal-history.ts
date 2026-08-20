"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/get-messages";
import { prisma } from "@/server/db";

export type CookTodayState = {
  message?: string;
  error?: string;
};

export type UndoLatestMealState = {
  message?: string;
  error?: string;
};

const cookingTimeZone = "Europe/London";

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const timeZoneDateAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );

  return timeZoneDateAsUtc - date.getTime();
}

function getUtcDateForTimeZoneDate(
  dateParts: { year: number; month: number; day: number },
  timeZone: string,
) {
  const utcDate = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day);
  const firstOffset = getTimeZoneOffsetMs(new Date(utcDate), timeZone);
  const firstCandidate = new Date(utcDate - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(firstCandidate, timeZone);

  return new Date(utcDate - secondOffset);
}

function getCookingDayRange(date = new Date()) {
  const today = getDatePartsInTimeZone(date, cookingTimeZone);
  const tomorrow = {
    ...today,
    day: today.day + 1,
  };

  return {
    start: getUtcDateForTimeZoneDate(today, cookingTimeZone),
    end: getUtcDateForTimeZoneDate(tomorrow, cookingTimeZone),
  };
}

export async function cookToday(
  _previousState: CookTodayState,
  formData: FormData,
): Promise<CookTodayState> {
  const session = await auth();
  const userId = session?.user?.id;
  const recipeId = formData.get("recipeId");
  const locale = await getLocale();
  const messages = getMessages(locale);

  if (!userId) {
    return { error: messages.actions.signInToSaveMeal };
  }

  if (typeof recipeId !== "string" || recipeId.length === 0) {
    return { error: messages.actions.recipeNotIdentified };
  }

  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!recipe) {
    return { error: messages.actions.recipeNotFound };
  }

  const today = getCookingDayRange();
  const existingCookedToday = await prisma.mealHistory.findFirst({
    where: {
      userId,
      recipeId: recipe.id,
      cookedAt: {
        gte: today.start,
        lt: today.end,
      },
    },
    select: { id: true },
  });

  if (!existingCookedToday) {
    await prisma.mealHistory.create({
      data: {
        userId,
        recipeId: recipe.id,
        cookedAt: new Date(),
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/recetas");
  revalidatePath("/historial");
  revalidatePath(`/recetas/${recipe.slug}`);

  return { message: messages.common.cookedToday };
}

export async function undoLatestMealHistory(
  _previousState: UndoLatestMealState,
  formData: FormData,
): Promise<UndoLatestMealState> {
  const session = await auth();
  const userId = session?.user?.id;
  const mealHistoryId = formData.get("mealHistoryId");
  const locale = await getLocale();
  const messages = getMessages(locale);

  if (!userId) {
    return { error: messages.actions.signInToEditHistory };
  }

  if (typeof mealHistoryId !== "string" || mealHistoryId.length === 0) {
    return { error: messages.actions.historyEntryNotIdentified };
  }

  const latestMealHistory = await prisma.mealHistory.findFirst({
    where: { userId },
    orderBy: { cookedAt: "desc" },
    select: { id: true },
  });

  if (!latestMealHistory || latestMealHistory.id !== mealHistoryId) {
    return { error: messages.actions.onlyLatestHistoryCanBeUndone };
  }

  await prisma.mealHistory.delete({
    where: { id: mealHistoryId },
  });

  revalidatePath("/");
  revalidatePath("/historial");

  return { message: messages.actions.historyEntryRemoved };
}
