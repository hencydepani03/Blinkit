import { Button } from "@/components/ui/button";
import { useSearch } from "@/contexts/SearchContext";
import { CATEGORIES } from "@/constants/categories";

const categories = CATEGORIES;

const CategoryGrid = () => {
  const { selectedCategory, setSelectedCategory } = useSearch();
  return (
    <section id="category-grid" className="py-8 scroll-mt-24">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              className={`h-auto p-4 flex flex-col items-center gap-2 ${category.color} rounded-xl border-0 transition-all duration-200 hover:scale-105 active:scale-95 ${selectedCategory === category.name ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === category.name ? '' : category.name)}
            >
              <span className="text-3xl">{category.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">
                {category.name}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;