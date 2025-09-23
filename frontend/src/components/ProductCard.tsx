import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: {
    id: string | number;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    unit: string;
    deliveryTime: string;
    discount?: number;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, updateQuantity, state } = useCart();
  const navigate = useNavigate();
  
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
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      updateQuantity(product.id, 0);
    }
  };

  return (
    <Card className="group hover:shadow-medium transition-all duration-200 border-border/50 overflow-hidden cursor-pointer">
      <CardContent className="p-3" onClick={() => navigate(`/product/${product.id}`)}>
        {/* Product Image */}
        <div className="relative mb-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-32 object-cover rounded-lg bg-muted group-hover:scale-105 transition-transform duration-200"
          />
          {product.discount && (
            <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs">
              {product.discount}% OFF
            </Badge>
          )}
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>

        {/* Delivery Time */}
        <div className="flex items-center gap-1 mb-2">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{product.deliveryTime}</span>
        </div>

        {/* Product Name */}
        <h3 className="font-medium text-sm mb-1 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        {/* Unit */}
        <p className="text-xs text-muted-foreground mb-3">{product.unit}</p>

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {quantity === 0 ? (
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="text-xs h-8 px-3 bg-background border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              Add
              <Plus className="w-3 h-3 ml-1" />
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-primary rounded-md">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDecrement}
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
                onClick={handleIncrement}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;