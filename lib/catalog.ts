import type { Dish, Estimate, Size } from "./types";

export const catalog: Dish[] = [
  {
    id: "sisig",
    name: "House Crispy Sisig",
    shortName: "Sisig",
    category: "Savory",
    description:
      "Crisp little edges. A bright squeeze of calamansi. The kind of sizzle that brings everyone to the table.",
    note: "Crispy. Tangy. Made for sharing.",
    ingredients: ["Pork", "Calamansi", "Chili", "Spring onion"],
    prices: { Small: 29500, Large: 59500 },
    available: true,
    scene: 0,
    photo: "/food/sisig.jpg",
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
    photo: "/food/sinigang.jpg",
  },
  {
    id: "ube",
    name: "Bibingkang Ube",
    shortName: "Ube",
    category: "Sweet",
    description:
      "Purple yam tucked into a warm rice cake, with salted egg, white cheese, and coconut on the side.",
    note: "Something sweet to stay for.",
    ingredients: [
      "Rice",
      "Purple yam",
      "Salted egg",
      "White cheese",
      "Coconut",
    ],
    prices: { Small: 18500, Large: 34500 },
    available: false,
    scene: 2,
    photo: "/food/ube.jpg",
  },
  {
    id: "karekare",
    name: "Kare-Kare with Oxtail",
    shortName: "Kare-kare",
    category: "Savory",
    description:
      "Slow comfort in a rich peanut sauce. Oxtail, tripe, and vegetables, with bagoong for that salty finish.",
    note: "Rich, nutty, comforting.",
    ingredients: ["Oxtail", "Tripe", "Peanuts", "Vegetables"],
    prices: { Small: 50500, Large: 101000 },
    available: true,
    scene: 3,
    photo: "/food/karekare.jpg",
  },
  {
    id: "pata",
    name: "Crispy Pata",
    shortName: "Crispy pata",
    category: "Savory",
    description:
      "Golden pork knuckle with a crackling crust. Bring friends, pass the plate, and go for the crispy bits.",
    note: "For the crispy-bit people.",
    ingredients: ["Pork knuckle"],
    prices: { Small: 40500, Large: 81000 },
    available: true,
    scene: 4,
    photo: "/food/pata.jpg",
  },
  {
    id: "adobo",
    name: "Garlicky Chicken & Pork Belly Adobo",
    shortName: "Adobo",
    category: "Savory",
    description:
      "Chicken and pork belly, a generous tumble of crispy garlic, and savory adobo sauce. Extra rice belongs here.",
    note: "Go on. Get extra rice.",
    ingredients: ["Chicken", "Pork belly", "Garlic", "Adobo sauce"],
    prices: { Small: 25500, Large: 51000 },
    available: true,
    scene: 5,
    photo: "/food/adobo.jpg",
  },
  {
    id: "gising",
    name: "Gising Gising",
    shortName: "Gising gising",
    category: "Savory",
    description:
      "Green vegetables and pork in coconut cream, warmed through with chili and bagoong. A lively spoonful beside your favorites.",
    note: "Creamy, green, a little heat.",
    ingredients: ["Winged beans", "Kangkong", "Pork", "Coconut cream", "Chili"],
    prices: { Small: 17500, Large: 35000 },
    available: true,
    scene: 6,
    photo: "/food/gising.jpg",
  },
  {
    id: "wings",
    name: "Caramelized Patis Wings",
    shortName: "Patis wings",
    category: "Savory",
    description:
      "Crispy chicken wings in a sticky patis glaze. Sweet, savory, and meant to be eaten with your hands.",
    note: "Sticky fingers welcome.",
    ingredients: ["Chicken wings", "Patis glaze"],
    prices: { Small: 21500, Large: 43000 },
    available: true,
    scene: 7,
    photo: "/food/wings.jpg",
  },
  {
    id: "palabok",
    name: "Crispy Pancit Palabok",
    shortName: "Palabok",
    category: "Savory",
    description:
      "A nest of crisp noodles meets shrimp sauce, seafood, and crunchy toppings. Break in and share the good bits.",
    note: "A crunch worth gathering for.",
    ingredients: ["Glass noodles", "Shrimp", "Squid", "Chicharon", "Tinapa"],
    prices: { Small: 26500, Large: 53000 },
    available: true,
    scene: 8,
    photo: "/food/palabok.jpg",
  },
  {
    id: "halohalo",
    name: "Namnam Halo-halo",
    shortName: "Halo-halo",
    category: "Sweet",
    description:
      "Shaved ice and a colorful mix of Filipino sweet favorites. Stir it all together for a cool ending.",
    note: "Mix it up. Cool down.",
    ingredients: ["Shaved ice", "Halo-halo toppings"],
    prices: { Small: 20500, Large: 41000 },
    available: true,
    scene: 9,
    photo: "/food/halohalo.jpg",
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
