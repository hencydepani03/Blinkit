export interface CategoryItem {
  id: number;
  name: string;
  icon: string;
  image?: string;
  color: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 1, name: "Fruits", icon: "🍎", image: "/api/placeholder/80/80", color: "bg-orange-100 hover:bg-orange-200" },
  { id: 2, name: "Vegetables", icon: "🥬", image: "/api/placeholder/80/80", color: "bg-green-100 hover:bg-green-200" },
  { id: 3, name: "Dairy", icon: "🥛", image: "/api/placeholder/80/80", color: "bg-blue-100 hover:bg-blue-200" },
  { id: 4, name: "Bakery", icon: "🥐", image: "/api/placeholder/80/80", color: "bg-yellow-100 hover:bg-yellow-200" },
  { id: 5, name: "Beverages", icon: "🥤", image: "/api/placeholder/80/80", color: "bg-purple-100 hover:bg-purple-200" },
  { id: 6, name: "Snacks", icon: "🍿", image: "/api/placeholder/80/80", color: "bg-pink-100 hover:bg-pink-200" },
  { id: 7, name: "Personal Care", icon: "🧴", image: "/api/placeholder/80/80", color: "bg-gray-100 hover:bg-gray-200" },
];

export const CATEGORY_ORDER = CATEGORIES.map(c => c.name);
