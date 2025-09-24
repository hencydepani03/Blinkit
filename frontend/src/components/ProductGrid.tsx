import ProductCard from "./ProductCard";
import { useEffect, useState } from "react";
import { useSearch } from "@/contexts/SearchContext";
import { CATEGORY_ORDER } from "@/constants/categories";

// Use the same API base approach as AdminDashboard
const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface ServerProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  unit?: string;
  description?: string;
  category?: string;
}

const ProductGrid = () => {
  const [products, setProducts] = useState<ServerProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { searchTerm, selectedCategory } = useSearch();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load products");
        const list: ServerProduct[] = Array.isArray(data.products) ? data.products : [];
        // Strong deduplication: collapse by normalized name + unit + price
        const norm = (s?: string) => (s || "").toLowerCase().trim().replace(/\s+/g, " ");
        const seen = new Set<string>();
        const unique: ServerProduct[] = [];
        for (const p of list) {
          const key = `${norm(p.name)}|${norm(p.unit)}|${Number(p.price)}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(p);
          }
        }
        setProducts(unique);
      } catch (err: any) {
        setError(err?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const norm = (v?: string) => (v || "").toLowerCase();
  const q = norm(searchTerm);
  // Filter by search term and selectedCategory (if set)
  const filtered = products.filter((p) => {
    const matchesSearch =
      !q ||
      norm(p.name).includes(q) ||
      norm(p.description).includes(q) ||
      norm(p.unit).includes(q) ||
      norm(p.category).includes(q);
    const matchesCategory = !selectedCategory || norm(p.category) === norm(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Sort by: selectedCategory first (if any), then by CATEGORY_ORDER, then by name
  const orderIndex = (cat?: string) => {
    const idx = CATEGORY_ORDER.findIndex((c) => norm(c) === norm(cat));
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  const sorted = [...filtered].sort((a, b) => {
    const aSel = selectedCategory && norm(a.category) === norm(selectedCategory) ? 0 : 1;
    const bSel = selectedCategory && norm(b.category) === norm(selectedCategory) ? 0 : 1;
    if (aSel !== bSel) return aSel - bSel;
    const ao = orderIndex(a.category);
    const bo = orderIndex(b.category);
    if (ao !== bo) return ao - bo;
    return norm(a.name).localeCompare(norm(b.name));
  });

  // Final safeguard: deduplicate at render time as well using composite key
  const keyOf = (p: ServerProduct) => `${(p.name || '').toLowerCase().trim()}|${(p.unit || '').toLowerCase().trim()}|${Number(p.price)}`;
  const dedupedSorted = Array.from(new Map(sorted.map(p => [keyOf(p), p])).values());

  return (
    <section className="py-8" id="product-grid">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Popular Products</h2>

        {loading && <p className="text-muted-foreground">Loading products...</p>}
        {error && !loading && (
          <p className="text-destructive">{error}</p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {dedupedSorted.map((p) => (
              <ProductCard
                key={keyOf(p)}
                product={{
                  // ProductCard accepts string | number id (we update its type accordingly)
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  image: p.image || "/api/placeholder/300/300",
                  unit: p.unit || "1 unit",
                  // Use a friendly default for now
                  deliveryTime: "10 mins",
                }}
              />
            ))}
            {sorted.length === 0 && (
              <p className="text-muted-foreground">No matching products.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;