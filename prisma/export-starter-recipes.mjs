import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";

const DEFAULT_OUTPUT_PATH = "/tmp/mesamate-starter-recipes.json";
const FORBIDDEN_KEYS = new Set([
  "account",
  "accounts",
  "accesstoken",
  "email",
  "emailverified",
  "expires",
  "expiresat",
  "id",
  "identifier",
  "idtoken",
  "ingredientid",
  "mealhistory",
  "password",
  "provider",
  "provideraccountid",
  "recipeid",
  "refreshtoken",
  "scope",
  "session",
  "sessions",
  "sessiontoken",
  "sessionstate",
  "token",
  "tokentype",
  "user",
  "userid",
  "verificationtoken",
]);

class ExportError extends Error {}

function requireOwnerEmail() {
  const ownerEmail = process.env.MESAMATE_EXPORT_USER_EMAIL?.trim();

  if (!ownerEmail) {
    throw new ExportError("MESAMATE_EXPORT_USER_EMAIL is required.");
  }

  return ownerEmail;
}

function getOutputPath() {
  const configuredPath = process.env.MESAMATE_EXPORT_OUTPUT?.trim();

  return path.resolve(configuredPath || DEFAULT_OUTPUT_PATH);
}

function validateUniqueSlugs(recipes) {
  const seenSlugs = new Set();

  for (const recipe of recipes) {
    if (seenSlugs.has(recipe.slug)) {
      throw new ExportError("Output validation failed: duplicate recipe slug.");
    }

    seenSlugs.add(recipe.slug);
  }
}

function validateForbiddenKeys(value, currentPath = "output") {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      validateForbiddenKeys(item, `${currentPath}[${index}]`),
    );
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const normalizedKey = key.replaceAll("_", "").toLowerCase();

    if (FORBIDDEN_KEYS.has(normalizedKey)) {
      throw new ExportError(
        `Output validation failed: forbidden key at ${currentPath}.${key}.`,
      );
    }

    validateForbiddenKeys(nestedValue, `${currentPath}.${key}`);
  }
}

function validateExport(exportData) {
  if (exportData.formatVersion !== 1) {
    throw new ExportError("Output validation failed: invalid format version.");
  }

  validateUniqueSlugs(exportData.recipes);
  validateForbiddenKeys(exportData);
}

function toExportData(recipes) {
  return {
    formatVersion: 1,
    recipes: recipes.map(({ recipeIngredients, ...recipe }) => ({
      ...recipe,
      ingredients: recipeIngredients.map(
        ({ ingredient, quantity, unit, note, sortOrder }) => ({
          nameEs: ingredient.nameEs,
          nameEn: ingredient.nameEn,
          category: ingredient.category,
          quantity,
          unit,
          note,
          sortOrder,
        }),
      ),
    })),
  };
}

async function readRecipes(prisma, ownerEmail) {
  return prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`SET TRANSACTION READ ONLY`;

      const owner = await transaction.user.findUnique({
        where: { email: ownerEmail },
        select: { id: true },
      });

      if (!owner) {
        throw new ExportError(
          "No user matched MESAMATE_EXPORT_USER_EMAIL.",
        );
      }

      const recipes = await transaction.recipe.findMany({
        where: { userId: owner.id },
        orderBy: { slug: "asc" },
        select: {
          slug: true,
          nameEs: true,
          nameEn: true,
          descriptionEs: true,
          category: true,
          imageUrl: true,
          caloriesPer100g: true,
          proteinPer100g: true,
          carbsPer100g: true,
          fatPer100g: true,
          prepTimeMinutes: true,
          difficulty: true,
          recipeIngredients: {
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
            select: {
              quantity: true,
              unit: true,
              note: true,
              sortOrder: true,
              ingredient: {
                select: {
                  nameEs: true,
                  nameEn: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (recipes.length === 0) {
        throw new ExportError("The selected user has no recipes to export.");
      }

      return recipes;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    },
  );
}

async function main() {
  const ownerEmail = requireOwnerEmail();
  const outputPath = getOutputPath();
  const prisma = new PrismaClient();

  try {
    const recipes = await readRecipes(prisma, ownerEmail);
    const exportData = toExportData(recipes);

    validateExport(exportData);

    const json = `${JSON.stringify(exportData, null, 2)}\n`;
    const checksum = createHash("sha256").update(json).digest("hex");

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, json, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });

    console.log(`Recipe count: ${exportData.recipes.length}`);
    console.log(`Output file: ${outputPath}`);
    console.log(`SHA-256: ${checksum}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const message =
    error instanceof ExportError
      ? error.message
      : "Starter recipe export failed safely.";

  console.error(message);
  process.exitCode = 1;
});
