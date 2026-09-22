import type { Dish, Estimate, Size } from "./types";

export const catalog: Dish[] = [
  {
    id: "sisig",
    name: "Sizzling sisig",
    shortName: "Sisig",
    category: "Savory",
    description:
      "Crisp little edges. A bright squeeze of calamansi. The kind of sizzle that brings everyone to the table.",
    note: "Crispy. Tangy. Made for sharing.",
    ingredients: ["Pork", "Calamansi", "Chili", "Spring onion"],
    prices: { Small: 29500, Large: 59500 },
    available: true,
    scene: 0,
  },
  {
    id: "sinigang",
    name: "Watermelon sinigang",
    shortName: "Sinigang",
    category: "Savory",
    description:
      "Beef short rib meets sweet watermelon in a sour tamarind broth. A familiar comfort, with a little surprise.",
    note: "A little sweet. A little sour.",
    ingredients: ["Beef short rib", "Watermelon", "Tamarind", "Greens"],
    prices: { Small: 39500, Large: 79500 },
    available: true,
    scene: 1,
  },
  {
    id: "ube",
    name: "Ube at the end",
    shortName: "Ube",
    category: "Sweet",
    description:
      "Velvety purple yam, a cloud of cream, and toasted coconut. Save a little room for this imagined sweet ending.",
    note: "Something sweet to stay for.",
    ingredients: ["Purple yam", "Cream", "Coconut"],
    prices: { Small: 18500, Large: 34500 },
    available: false,
    scene: 2,
  },
];

export function calculateEstimate(body: unknown, dishes = catalog): Estimate {
  if (
    !body ||
    typeof body !== "object" ||
    !("items" in body) ||
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 3
  )
    throw new Error("Choose between 1 and 3 dishes.");
  const seen = new Set<string>();
  const items = body.items.map((item: unknown) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("id" in item) ||
      !("size" in item) ||
      !("quantity" in item)
    )
      throw new Error("Each dish needs an ID, size, and quantity.");
    const { id, size, quantity } = item;
    if (typeof id !== "string") throw new Error("Dish ID must be text.");
    const dish = dishes.find((d) => d.id === id);
    if (!dish) throw new Error("Unknown dish.");
    if (seen.has(id)) throw new Error("Each dish may appear only once.");
    seen.add(id);
    if (!dish.available) throw new Error(`${dish.name} is unavailable.`);
    if (size !== "Small" && size !== "Large")
      throw new Error("Choose Small or Large.");
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 5
    )
      throw new Error("Quantity must be a whole number from 1 to 5.");
    const unitPrice = dish.prices[size as Size];
    return {
      id,
      name: dish.name,
      size: size as Size,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };
  });
  return { items, total: items.reduce((sum, item) => sum + item.total, 0) };
}
