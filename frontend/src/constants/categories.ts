export interface CategoryItem {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 1, name: "Vegetables & Fruits", icon: "🥬", color: "bg-green-100 hover:bg-green-200" },
  { id: 2, name: "Dairy, Bread & Eggs", icon: "🥛", color: "bg-blue-100 hover:bg-blue-200" },
  { id: 3, name: "Cold Drinks & Juices", icon: "🥤", color: "bg-orange-100 hover:bg-orange-200" },
  { id: 4, name: "Snacks & Munchies", icon: "🍿", color: "bg-yellow-100 hover:bg-yellow-200" },
  { id: 5, name: "Breakfast & Instant Food", icon: "🥞", color: "bg-red-100 hover:bg-red-200" },
  { id: 6, name: "Sweet Tooth", icon: "🍰", color: "bg-pink-100 hover:bg-pink-200" },
  { id: 7, name: "Atta, Rice & Dal", icon: "🌾", color: "bg-amber-100 hover:bg-amber-200" },
  { id: 8, name: "Chicken, Meat & Fish", icon: "🍗", color: "bg-red-100 hover:bg-red-200" },
];

export const CATEGORY_ORDER = CATEGORIES.map(c => c.name);
