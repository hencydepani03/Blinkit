import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Minus, Clock, Star, Truck, ShieldCheck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

// Use the same API base approach as ProductGrid
const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface ServerProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  unit?: string;
  description?: string;
  category?: string;
  // Optional fields that may exist in UI but not on server
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviews?: number;
  nutritionInfo?: { label: string; value: string }[];
  benefits?: string[];
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, state } = useCart();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("description");
  const [product, setProduct] = useState<ServerProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load product");
        const p: ServerProduct = data.product;
        setProduct(p);
      } catch (err: any) {
        setError(err?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const cartItem = state.items.find(item => item.id === (product?.id ?? id ?? ""));
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "/api/placeholder/300/300",
      unit: product.unit || "1 unit",
    });
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Product Details</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading && (
          <p className="text-muted-foreground">Loading product...</p>
        )}
        {error && !loading && (
          <p className="text-destructive">{error}</p>
        )}
        {!loading && !error && product && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={product.image || "/api/placeholder/500/500"}
                  alt={product.name}
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
                {product.discount && (
                  <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                    {product.discount}% OFF
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>{(product as any).deliveryTime || "10 mins"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-primary" />
                <span>Free delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>100% fresh</span>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category || "General"}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground">{product.unit || "1 unit"}</p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium">{product.rating ?? 4.5}</span>
                </div>
                <span className="text-muted-foreground">({product.reviews ?? 100} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ₹{product.originalPrice}
                </span>
              )}
              {product.discount && (
                <Badge variant="secondary" className="text-success">
                  Save ₹{product.originalPrice! - product.price}
                </Badge>
              )}
            </div>

            {/* Add to Cart */}
            <div className="flex items-center gap-4">
              {quantity === 0 ? (
                <Button
                  onClick={handleAddToCart}
                  variant="gradient"
                  size="lg"
                  className="flex-1"
                >
                  Add to Cart
                  <Plus className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">In cart:</span>
                  <div className="flex items-center gap-2 bg-primary rounded-md">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateQuantity(product.id, Math.max(0, quantity - 1))}
                      className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-medium text-primary-foreground px-2">
                      {quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/cart")}
              >
                View Cart ({state.itemCount})
              </Button>
            </div>

            {/* Tabs */}
            <div>
              <div className="flex border-b">
                {(["description"] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant="ghost"
                    onClick={() => setSelectedTab(tab)}
                    className={`rounded-none border-b-2 ${
                      selectedTab === tab 
                        ? "border-primary text-primary" 
                        : "border-transparent"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Button>
                ))}
              </div>

              <div className="py-4">
                {selectedTab === "description" && (
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || "No description available."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;