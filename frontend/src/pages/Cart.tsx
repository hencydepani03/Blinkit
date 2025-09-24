import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

const Cart = () => {
  const { state, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (state.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart first",
        variant: "destructive",
      });
      return;
    }
    // Basic validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      toast({ title: "Name required", description: "Please enter your full name", variant: "destructive" });
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      toast({ title: "Phone required", description: "Please enter a valid phone number", variant: "destructive" });
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      toast({ title: "Address required", description: "Please enter a valid delivery address", variant: "destructive" });
      return;
    }
    if (paymentMethod !== 'COD') {
      toast({ title: "Unsupported payment", description: "Only Cash on Delivery is available right now", variant: "destructive" });
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Please login', description: 'Login required to place order', variant: 'destructive' });
        navigate('/login');
        return;
      }
      setIsSubmitting(true);
      const handlingFee = 2;
      const payload = {
        items: state.items.map((item) => ({
          product: item.id,
          name: item.name,
          image: item.image,
          unit: item.unit,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: state.total,
        deliveryFee: 0,
        handlingFee,
        total: state.total + handlingFee,
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        paymentMethod,
      };
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to place order');

      toast({
        title: 'Order placed!',
        description: `Your order of ₹${payload.total} has been placed successfully`,
      });
      clearCart();
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Order failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.items.length === 0) {
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
              <h1 className="text-xl font-bold">My Cart</h1>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some fresh groceries to get started
            </p>
            <Button onClick={() => navigate("/")} variant="gradient" size="lg">
              Start Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">My Cart</h1>
                <p className="text-sm text-muted-foreground">
                  {state.itemCount} {state.itemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {state.items.map((item) => (
              <Card key={item.id} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg bg-muted"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.unit}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-bold">₹{item.price}</span>
                        <Badge variant="secondary" className="text-xs">
                          ₹{item.price * item.quantity} total
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-primary rounded-md">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium text-primary-foreground px-2">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checkout Details + Order Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Delivery Details */}
            <Card className="shadow-medium sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold">Delivery Details</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" placeholder="Enter your full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" inputMode="tel" placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address</Label>
                    <Textarea id="address" placeholder="House no, street, area, city, pincode" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="COD" id="pm-cod" />
                        <Label htmlFor="pm-cod">Cash on Delivery (COD)</Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">Only COD is available right now.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="shadow-medium sticky top-[28rem]">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal ({state.itemCount} items)</span>
                    <span>₹{state.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-success">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Handling Charges</span>
                    <span>₹2</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{state.total + 2}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleCheckout}
                  variant="gradient" 
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                 {isSubmitting ? 'Placing Order...' : 'Place the Order'}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-3">
                  By placing order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;