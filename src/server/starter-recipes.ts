import { Prisma } from "@prisma/client";

import { isRecipeCategory, type RecipeCategory } from "@/constants/recipe-categories";
import starterRecipeData from "@/data/starter-recipes.json";
import { prisma } from "@/server/db";

type StarterIngredient = {
  nameEs: string;
  nameEn: string | null;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  sortOrder: number | null;
};

type StarterRecipe = {
  slug: string;
  nameEs: string;
  nameEn: string | null;
  descriptionEs: string | null;
  category: RecipeCategory;
  imageUrl: string | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  prepTimeMinutes: number | null;
  difficulty: string | null;
  ingredients: StarterIngredient[];
};

type StarterRecipeDataset = {
  formatVersion: number;
  recipes: StarterRecipe[];
};

function loadStarterRecipeDataset() {
  const dataset = starterRecipeData as unknown as StarterRecipeDataset;

  if (dataset.formatVersion !== 1) {
    throw new Error("Unsupported starter recipe dataset version.");
  }

  if (!Array.isArray(dataset.recipes) || dataset.recipes.length !== 20) {
    throw new Error("The starter recipe dataset must contain 20 recipes.");
  }

  const slugs = new Set<string>();

  for (const recipe of dataset.recipes) {
    if (!recipe.slug || slugs.has(recipe.slug)) {
      throw new Error("The starter recipe dataset contains an invalid slug.");
    }

    if (!isRecipeCategory(recipe.category)) {
      throw new Error("The starter recipe dataset contains an invalid category.");
    }

    slugs.add(recipe.slug);
  }

  return dataset.recipes;
}

export const starterRecipes = loadStarterRecipeDataset();

export async function createStarterRecipesForUser(userId: string) {
  return prisma.$transaction(
    async (transaction) => {
      const existingRecipeCount = await transaction.recipe.count({
        where: { userId },
      });

      if (existingRecipeCount !== 0) {
        return {
          recipeCount: 0,
          skipped: true,
        };
      }

      const ingredientIdsByName = new Map<string, string>();

      for (const recipeSeed of starterRecipes) {
        const recipe = await transaction.recipe.create({
          data: {
            userId,
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
                  userId,
                  nameEs: ingredientSeed.nameEs,
                },
              },
              update: {
                nameEn: ingredientSeed.nameEn,
                category: ingredientSeed.category,
              },
              create: {
                userId,
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
