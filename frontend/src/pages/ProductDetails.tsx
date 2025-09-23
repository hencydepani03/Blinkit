import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Minus, Clock, Star, Truck, ShieldCheck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: "Fresh Bananas",
    price: 25,
    originalPrice: 30,
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&h=500&fit=crop",
    unit: "1 dozen",
    deliveryTime: "8 mins",
    discount: 17,
    rating: 4.5,
    reviews: 128,
    description: "Fresh, sweet bananas packed with potassium and natural energy. Perfect for breakfast, smoothies, or as a healthy snack.",
    category: "Fruits",
    nutritionInfo: [
      { label: "Calories", value: "89 per 100g" },
      { label: "Potassium", value: "358mg" },
      { label: "Vitamin C", value: "8.7mg" },
      { label: "Dietary Fiber", value: "2.6g" }
    ],
    benefits: [
      "Rich in potassium for heart health",
      "Natural source of energy",
      "Supports digestive health",
      "Contains antioxidants"
    ]
  }
];

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, state } = useCart();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("description");

  // Find product by ID (in real app, this would be an API call)
  const product = mockProducts.find(p => p.id === Number(id)) || mockProducts[0];
  const cartItem = state.items.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      unit: product.unit
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
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={product.image}
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
                <span>{product.deliveryTime}</span>
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
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground">{product.unit}</p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">({product.reviews} reviews)</span>
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
                {["description", "nutrition", "benefits"].map((tab) => (
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
                    {product.description}
                  </p>
                )}

                {selectedTab === "nutrition" && (
                  <div className="space-y-3">
                    {product.nutritionInfo.map((info, index) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span className="font-medium">{info.label}</span>
                        <span className="text-muted-foreground">{info.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === "benefits" && (
                  <ul className="space-y-2">
                    {product.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;