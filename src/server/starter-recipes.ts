import { prisma } from "@/server/db";
import type { RecipeCategory } from "@/constants/recipe-categories";

type StarterIngredient = {
  nameEs: string;
  quantity?: number;
  unit?: string;
  note?: string;
};

type StarterRecipe = {
  slug: string;
  nameEs: string;
  nameEn?: string;
  descriptionEs: string;
  imageUrl: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  prepTimeMinutes: number;
  difficulty: string;
  category: RecipeCategory;
  ingredients: StarterIngredient[];
};

export const starterRecipes: StarterRecipe[] = [
  {
    slug: "pollo-al-curry",
    nameEs: "Pollo al curry",
    nameEn: "Chicken curry",
    descriptionEs:
      "Una comida sencilla y cremosa para preparar entre semana sin complicarte.",
    imageUrl: "/images/meals/pollo-curry.svg",
    caloriesPer100g: 120,
    proteinPer100g: 12,
    carbsPer100g: 7,
    fatPer100g: 5,
    prepTimeMinutes: 35,
    difficulty: "Fácil",
    category: "Pollo",
    ingredients: [
      { nameEs: "pechuga de pollo", quantity: 1, unit: "unidad" },
      { nameEs: "cebolla", quantity: 50, unit: "g" },
      {
        nameEs: "leche de coco light",
        quantity: 0.5,
        unit: "lata",
        note: "1/2 lata",
      },
      { nameEs: "tomate", quantity: 0.5, unit: "lata", note: "1/2 lata" },
      { nameEs: "curry en polvo", note: "al gusto" },
      { nameEs: "sal", note: "al gusto" },
    ],
  },
  {
    slug: "paella-de-pollo",
    nameEs: "Paella de pollo",
    nameEn: "Chicken paella",
    descriptionEs:
      "Una paella sencilla con pollo, arroz y verduras para una comida completa.",
    imageUrl: "/images/meals/paella-pollo.svg",
    caloriesPer100g: 178,
    proteinPer100g: 14,
    carbsPer100g: 20,
    fatPer100g: 5,
    prepTimeMinutes: 45,
    difficulty: "Media",
    category: "Arroz",
    ingredients: [
      { nameEs: "arroz", quantity: 150, unit: "g" },
      { nameEs: "pollo", quantity: 1, unit: "unidad", note: "muslo o pechuga" },
      { nameEs: "pimiento rojo", quantity: 0.5, unit: "unidad" },
      { nameEs: "guisantes", quantity: 50, unit: "g" },
      { nameEs: "caldo de pollo", note: "cantidad necesaria" },
      { nameEs: "azafrán o colorante", note: "al gusto" },
      { nameEs: "sal", note: "al gusto" },
    ],
  },
  {
    slug: "lentejas-con-chorizo",
    nameEs: "Lentejas con chorizo",
    nameEn: "Lentils with chorizo",
    descriptionEs:
      "Un plato caliente y saciante con ingredientes básicos y mucho sabor.",
    imageUrl: "/images/meals/lentejas-chorizo.svg",
    caloriesPer100g: 152,
    proteinPer100g: 11,
    carbsPer100g: 16,
    fatPer100g: 6,
    prepTimeMinutes: 40,
    difficulty: "Fácil",
    category: "Legumbres",
    ingredients: [
      { nameEs: "lentejas cocidas", quantity: 200, unit: "g" },
      { nameEs: "chorizo", quantity: 50, unit: "g" },
      { nameEs: "cebolla", quantity: 50, unit: "g" },
      { nameEs: "zanahoria", quantity: 1, unit: "unidad" },
      { nameEs: "tomate", quantity: 0.5, unit: "lata", note: "1/2 lata" },
      { nameEs: "pimentón dulce", note: "al gusto" },
      { nameEs: "sal", note: "al gusto" },
    ],
  },
  {
    slug: "guiso",
    nameEs: "Guiso",
    nameEn: "Sofrito base",
    descriptionEs:
      "Base sencilla de cebolla, tomate y cebolla larga para dar sabor a platos de casa.",
    imageUrl: "/images/meals/lentejas-chorizo.svg",
    caloriesPer100g: 45,
    proteinPer100g: 1,
    carbsPer100g: 9,
    fatPer100g: 1,
    prepTimeMinutes: 15,
    difficulty: "Fácil",
    category: "Sopa/Guiso",
    ingredients: [
      { nameEs: "cebolla", quantity: 1, unit: "unidad" },
      { nameEs: "tomate", quantity: 1, unit: "unidad" },
      { nameEs: "cebolla larga", quantity: 1, unit: "unidad" },
    ],
  },
  {
    slug: "frijoles-rojos-con-cerdo",
    nameEs: "Frijoles rojos con cerdo",
    nameEn: "Kidney beans with pork",
    descriptionEs:
      "Un plato familiar y contundente con frijoles, cerdo magro, plátano y patata.",
    imageUrl: "/images/meals/lentejas-chorizo.svg",
    caloriesPer100g: 165,
    proteinPer100g: 11,
    carbsPer100g: 22,
    fatPer100g: 4,
    prepTimeMinutes: 75,
    difficulty: "Media",
    category: "Legumbres",
    ingredients: [
      { nameEs: "frijoles rojos secos", quantity: 220, unit: "g" },
      { nameEs: "carne magra de cerdo", quantity: 150, unit: "g" },
      { nameEs: "zanahoria", quantity: 1, unit: "unidad" },
      { nameEs: "guiso", quantity: 1, unit: "unidad" },
      { nameEs: "plátano macho mediano", quantity: 1, unit: "unidad" },
      { nameEs: "patata pequeña", quantity: 1, unit: "unidad" },
    ],
  },
  {
    slug: "arroz-con-pollo",
    nameEs: "Arroz con pollo",
    nameEn: "Chicken & Rice",
    descriptionEs:
      "Arroz con pechuga de pollo y verduras mixtas para una comida completa y sencilla.",
    imageUrl: "/images/meals/paella-pollo.svg",
    caloriesPer100g: 155,
    proteinPer100g: 13,
    carbsPer100g: 21,
    fatPer100g: 3,
    prepTimeMinutes: 40,
    difficulty: "Fácil",
    category: "Arroz",
    ingredients: [
      { nameEs: "pechuga de pollo", quantity: 300, unit: "g" },
      { nameEs: "arroz seco", quantity: 200, unit: "g" },
      { nameEs: "verduras mixtas", quantity: 200, unit: "g" },
    ],
  },
  {
    slug: "carne-sudada",
    nameEs: "Carne sudada",
    nameEn: "Beef stew",
    descriptionEs:
      "Carne de res guisada con base de guiso y patata para una comida casera.",
    imageUrl: "/images/meals/pollo-curry.svg",
    caloriesPer100g: 175,
    proteinPer100g: 17,
    carbsPer100g: 12,
    fatPer100g: 7,
    prepTimeMinutes: 60,
    difficulty: "Media",
    category: "Carne",
    ingredients: [
      { nameEs: "carne de res para guisar", quantity: 500, unit: "g" },
      { nameEs: "guiso", quantity: 1, unit: "unidad" },
      { nameEs: "patata mediana grande", quantity: 1, unit: "unidad" },
    ],
  },
];

export async function createStarterRecipesForUser(userId: string) {
  for (const recipeSeed of starterRecipes) {
    const recipe = await prisma.recipe.upsert({
      where: {
        userId_slug: {
          userId,
          slug: recipeSeed.slug,
        },
      },
      update: {
        nameEs: recipeSeed.nameEs,
        nameEn: recipeSeed.nameEn,
        descriptionEs: recipeSeed.descriptionEs,
        imageUrl: recipeSeed.imageUrl,
        caloriesPer100g: recipeSeed.caloriesPer100g,
        proteinPer100g: recipeSeed.proteinPer100g,
        carbsPer100g: recipeSeed.carbsPer100g,
        fatPer100g: recipeSeed.fatPer100g,
        prepTimeMinutes: recipeSeed.prepTimeMinutes,
        difficulty: recipeSeed.difficulty,
        category: recipeSeed.category,
      },
      create: {
        userId,
        slug: recipeSeed.slug,
        nameEs: recipeSeed.nameEs,
        nameEn: recipeSeed.nameEn,
        descriptionEs: recipeSeed.descriptionEs,
        imageUrl: recipeSeed.imageUrl,
        caloriesPer100g: recipeSeed.caloriesPer100g,
        proteinPer100g: recipeSeed.proteinPer100g,
        carbsPer100g: recipeSeed.carbsPer100g,
        fatPer100g: recipeSeed.fatPer100g,
        prepTimeMinutes: recipeSeed.prepTimeMinutes,
        difficulty: recipeSeed.difficulty,
        category: recipeSeed.category,
      },
    });

    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: recipe.id },
    });

    for (const [index, ingredientSeed] of recipeSeed.ingredients.entries()) {
      const ingredient = await prisma.ingredient.upsert({
        where: {
          userId_nameEs: {
            userId,
            nameEs: ingredientSeed.nameEs,
          },
        },
        update: {},
        create: {
          userId,
          nameEs: ingredientSeed.nameEs,
        },
      });

      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          quantity: ingredientSeed.quantity,
          unit: ingredientSeed.unit,
          note: ingredientSeed.note,
          sortOrder: index + 1,
        },
      });
    }
  }

  return {
    recipeCount: starterRecipes.length,
  };
}
