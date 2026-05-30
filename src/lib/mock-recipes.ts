export type MockRecipe = {
  name: string;
  image: string;
  description: string;
  info: [string, string, string, string];
  ingredients: string[];
  steps: string[];
};

export const polloAlCurry: MockRecipe = {
  name: "Pollo al curry",
  image: "/images/meals/pollo-curry.svg",
  description:
    "Una comida sencilla y cremosa para preparar entre semana sin complicarte.",
  info: ["120 kcal / 100g", "12g proteína / 100g", "35 min", "Fácil"],
  ingredients: [
    "1 pechuga de pollo",
    "50g cebolla",
    "1/2 lata de leche de coco light",
    "1/2 lata de tomate",
    "curry en polvo",
    "sal al gusto",
  ],
  steps: [
    "Sofríe la cebolla.",
    "Añade el pollo y cocina hasta dorar.",
    "Añade curry, tomate y leche de coco.",
    "Cocina a fuego medio durante 20 minutos.",
    "Sirve con arroz o verduras.",
  ],
};

export const paellaDePollo: MockRecipe = {
  name: "Paella de pollo",
  image: "/images/meals/paella-pollo.svg",
  description:
    "Una paella sencilla con pollo, arroz y verduras para una comida completa.",
  info: ["178 kcal / 100g", "14g proteína / 100g", "45 min", "Media"],
  ingredients: [
    "150g arroz",
    "1 muslo o pechuga de pollo",
    "1/2 pimiento rojo",
    "50g guisantes",
    "caldo de pollo",
    "azafrán o colorante",
    "sal al gusto",
  ],
  steps: [
    "Dora el pollo en una sartén amplia.",
    "Añade el pimiento y cocina unos minutos.",
    "Incorpora el arroz y mezcla bien.",
    "Añade caldo, guisantes y azafrán.",
    "Cocina hasta que el arroz esté en su punto.",
  ],
};

export const lentejasConChorizo: MockRecipe = {
  name: "Lentejas con chorizo",
  image: "/images/meals/lentejas-chorizo.svg",
  description:
    "Un plato caliente y saciante con ingredientes básicos y mucho sabor.",
  info: ["152 kcal / 100g", "11g proteína / 100g", "40 min", "Fácil"],
  ingredients: [
    "200g lentejas cocidas",
    "50g chorizo",
    "50g cebolla",
    "1 zanahoria",
    "1/2 lata de tomate",
    "pimentón dulce",
    "sal al gusto",
  ],
  steps: [
    "Sofríe la cebolla y la zanahoria.",
    "Añade el chorizo y cocina un par de minutos.",
    "Incorpora tomate y pimentón.",
    "Añade las lentejas y un poco de agua o caldo.",
    "Cocina a fuego medio hasta que espese.",
  ],
};
