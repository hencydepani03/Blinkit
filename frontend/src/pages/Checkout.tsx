import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, MapPin, Clock, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';

const Checkout = () => {
  const navigate = useNavigate();
  const { state: cartState, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    area: '',
    city: '',
    pincode: '',
    landmark: ''
  });

  // API base URL
  const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

  const deliveryFee = 29;
  const platformFee = 5;
  const totalAmount = cartState.total + deliveryFee + platformFee;

  const handlePlaceOrder = async () => {
    try {
      if (!deliveryAddress.street || !deliveryAddress.area || !deliveryAddress.city || !deliveryAddress.pincode) {
        toast.error('Please fill in all delivery address fields');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to place your order');
        navigate('/login');
        return;
      }

      if (!user) {
        toast.error('User session not found. Please log in again.');
        navigate('/login');
        return;
      }

      // Build order payload compatible with backend Order model
      const items = cartState.items.map((item) => ({
        product: item.id,
        name: item.name,
        image: item.image,
        unit: item.unit,
        price: item.price,
        quantity: item.quantity,
      }));

      const payload = {
        items,
        subtotal: cartState.total,
        deliveryFee,
        handlingFee: platformFee,
        total: totalAmount,
        // Optional: attach address for future use (backend currently ignores extra fields)
        address: deliveryAddress,
        paymentMethod,
      } as any;

      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to place order');
      }

      toast.success('Order placed successfully! 🎉');
      clearCart();
      navigate('/orders');
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong while placing your order');
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setDeliveryAddress(prev => ({ ...prev, [field]: value }));
  };

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card>
            <CardContent className="text-center p-8">
              <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add some items to proceed with checkout</p>
              <Button onClick={() => navigate('/')} className="w-full">
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/cart')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Delivery Time */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Delivery in 10-15 mins</CardTitle>
            </div>
          </CardHeader>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Delivery Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  placeholder="Enter street address"
                  value={deliveryAddress.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  placeholder="Enter area"
                  value={deliveryAddress.area}
                  onChange={(e) => handleAddressChange('area', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={deliveryAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="Enter pincode"
                  value={deliveryAddress.pincode}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="Enter landmark"
                value={deliveryAddress.landmark}
                onChange={(e) => handleAddressChange('landmark', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartState.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × ₹{item.price}
                  </p>
                </div>
                <p className="font-semibold">₹{item.price * item.quantity}</p>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartState.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span>₹{platformFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Payment Method</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  Credit/Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                  <Wallet className="h-4 w-4" />
                  UPI
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod" className="cursor-pointer">
                  Cash on Delivery
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Place Order Button */}
        <div className="sticky bottom-0 bg-background pt-4 pb-6">
          <Button 
            onClick={handlePlaceOrder}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            Place Order • ₹{totalAmount}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;