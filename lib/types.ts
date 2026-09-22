export type Size = "Small" | "Large";
export type Dish = {
  id: string;
  name: string;
  shortName: string;
  category: "Savory" | "Sweet";
  description: string;
  note: string;
  ingredients: string[];
  prices: Record<Size, number>;
  available: boolean;
  scene: number;
  photo: string;
};
export type Selection = { id: string; size: Size; quantity: number };
export type Estimate = {
  items: (Selection & { name: string; unitPrice: number; total: number })[];
  total: number;
};
export const money = (centavos: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(centavos / 100);
export function reconcileSelection(dishes: Dish[], id: string) {
  return dishes.find((d) => d.id === id) ?? dishes[0];
}
