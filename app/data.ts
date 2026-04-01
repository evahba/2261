export type Category = "Entree" | "Side" | "Appetizer" | "Drink" | "Dessert";

export interface Item {
  name: string;
  category: Category;
  boxesPerThousand: number;
  unit: string;
}

export const items: Item[] = [
  { name: "Orange Chicken", category: "Entree", boxesPerThousand: 42, unit: "boxes" },
  { name: "Beijing Beef", category: "Entree", boxesPerThousand: 28, unit: "boxes" },
  { name: "Kung Pao Chicken", category: "Entree", boxesPerThousand: 31, unit: "boxes" },
  { name: "Broccoli Beef", category: "Entree", boxesPerThousand: 24, unit: "boxes" },
  { name: "Honey Walnut Shrimp", category: "Entree", boxesPerThousand: 19, unit: "boxes" },
  { name: "Mushroom Chicken", category: "Entree", boxesPerThousand: 22, unit: "boxes" },
  { name: "String Bean Chicken", category: "Entree", boxesPerThousand: 18, unit: "boxes" },
  { name: "Black Pepper Sirloin Steak", category: "Entree", boxesPerThousand: 14, unit: "boxes" },
  { name: "Chow Mein", category: "Side", boxesPerThousand: 55, unit: "boxes" },
  { name: "Fried Rice", category: "Side", boxesPerThousand: 61, unit: "boxes" },
  { name: "White Steamed Rice", category: "Side", boxesPerThousand: 38, unit: "boxes" },
  { name: "Mixed Vegetables", category: "Side", boxesPerThousand: 27, unit: "boxes" },
  { name: "Super Greens", category: "Side", boxesPerThousand: 21, unit: "boxes" },
  { name: "Cream Cheese Rangoon", category: "Appetizer", boxesPerThousand: 33, unit: "boxes" },
  { name: "Egg Roll", category: "Appetizer", boxesPerThousand: 29, unit: "boxes" },
  { name: "Veggie Spring Roll", category: "Appetizer", boxesPerThousand: 16, unit: "boxes" },
  { name: "Apple Pie Roll", category: "Dessert", boxesPerThousand: 12, unit: "boxes" },
  { name: "Fountain Drink", category: "Drink", boxesPerThousand: 74, unit: "cups" },
  { name: "Bottled Water", category: "Drink", boxesPerThousand: 18, unit: "bottles" },
];

export const categories: Category[] = ["Entree", "Side", "Appetizer", "Drink", "Dessert"];

export const categoryColors: Record<Category, string> = {
  Entree: "bg-red-100 text-red-700",
  Side: "bg-amber-100 text-amber-700",
  Appetizer: "bg-orange-100 text-orange-700",
  Drink: "bg-blue-100 text-blue-700",
  Dessert: "bg-pink-100 text-pink-700",
};
