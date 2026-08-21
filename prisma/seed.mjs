import fs from "node:fs";
import path from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";

function loadEnvFile(fileName, override = false) {
  const filePath = path.join(process.cwd(), fileName);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (override || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function loadStarterRecipeDataset() {
  const datasetPath = path.join(
    process.cwd(),
    "src/data/starter-recipes.json",
  );
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

  if (dataset.formatVersion !== 1) {
    throw new Error("Unsupported starter recipe dataset version.");
  }

  if (!Array.isArray(dataset.recipes) || dataset.recipes.length !== 20) {
    throw new Error("The starter recipe dataset must contain 20 recipes.");
  }

  const slugs = new Set();

  for (const recipe of dataset.recipes) {
    if (!recipe.slug || slugs.has(recipe.slug)) {
      throw new Error("The starter recipe dataset contains an invalid slug.");
    }

    slugs.add(recipe.slug);
  }

  return dataset.recipes;
}

loadEnvFile(".env");
loadEnvFile(".env.local", true);

const targetEmail = process.env.MESAMATE_SEED_USER_EMAIL?.trim();

if (!targetEmail) {
  console.error("MESAMATE_SEED_USER_EMAIL is required.");
  process.exit(1);
}

const starterRecipes = loadStarterRecipeDataset();
const prisma = new PrismaClient();

async function installStarterRecipes() {
  return prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { email: targetEmail },
        select: { id: true },
      });

      if (!user) {
        throw new Error("No user matched MESAMATE_SEED_USER_EMAIL.");
      }

      const existingRecipeCount = await transaction.recipe.count({
        where: { userId: user.id },
      });

      if (existingRecipeCount !== 0) {
        return {
          recipeCount: 0,
          skipped: true,
        };
      }

      const ingredientIdsByName = new Map();

      for (const recipeSeed of starterRecipes) {
        const recipe = await transaction.recipe.create({
          data: {
            userId: user.id,
            slug: recipeSeed.slug,
            nameEs: recipeSeed.nameEs,
            nameEn: recipeSeed.nameEn,
            descriptionEs: recipeSeed.descriptionEs,
            category: recipeSeed.category,
            imageUrl: recipeSeed.imageUrl,
            caloriesPer100g: recipeSeed.caloriesPer100g,
            proteinPer100g: recipeSeed.proteinPer100g,
            carbsPer100g: recipeSeed.carbsPer100g,
            fatPer100g: recipeSeed.fatPer100g,
            prepTimeMinutes: recipeSeed.prepTimeMinutes,
            difficulty: recipeSeed.difficulty,
          },
        });

        for (const ingredientSeed of recipeSeed.ingredients) {
          let ingredientId = ingredientIdsByName.get(ingredientSeed.nameEs);

          if (!ingredientId) {
            const ingredient = await transaction.ingredient.upsert({
              where: {
                userId_nameEs: {
                  userId: user.id,
                  nameEs: ingredientSeed.nameEs,
                },
              },
              update: {
                nameEn: ingredientSeed.nameEn,
                category: ingredientSeed.category,
              },
              create: {
                userId: user.id,
                nameEs: ingredientSeed.nameEs,
                nameEn: ingredientSeed.nameEn,
                category: ingredientSeed.category,
              },
            });

            ingredientId = ingredient.id;
            ingredientIdsByName.set(ingredientSeed.nameEs, ingredientId);
          }

          await transaction.recipeIngredient.create({
            data: {
              recipeId: recipe.id,
              ingredientId,
              quantity: ingredientSeed.quantity,
              unit: ingredientSeed.unit,
              note: ingredientSeed.note,
              sortOrder: ingredientSeed.sortOrder,
            },
          });
        }
      }

      return {
        recipeCount: starterRecipes.length,
        skipped: false,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

installStarterRecipes()
  .then((result) => {
    if (result.skipped) {
      console.log("Starter recipes skipped: the target user already has recipes.");
      return;
    }

    console.log(`Starter recipes created: ${result.recipeCount}`);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Seed failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
