import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, Plus, Minus, Trash2 } from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

type OrderItem = {
  product?: string;
  name: string;
  image?: string;
  unit?: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  createdAt: string;
  status: 'pending' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  handlingFee: number;
  total: number;
  customerName?: string;
  phone?: string;
  address?: string;
  paymentMethod?: 'COD' | string;
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/orders/my`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load orders');
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'packed':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <Package className="h-4 w-4 text-gray-400" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'packed':
        return 'Packed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'out_for_delivery':
        return 'secondary';
      case 'packed':
        return 'outline';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to cancel order');
      setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      if (selected && selected.id === orderId) {
        setSelected(data.order);
      }
    } catch (err) {
      console.error(err);
      alert((err as any)?.message || 'Failed to cancel order');
    }
  };

  const openDetails = (order: Order) => {
    setSelected(order);
    setEditItems(order.items.map(it => ({ ...it })));
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelected(null);
    setEditItems([]);
  };

  const canEdit = selected?.status === 'pending';

  const editedSubtotal = useMemo(() => {
    return editItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }, [editItems]);

  const editedTotal = useMemo(() => {
    if (!selected) return 0;
    return editedSubtotal + (selected.deliveryFee || 0) + (selected.handlingFee || 0);
  }, [editedSubtotal, selected]);

  const updateQty = (index: number, qty: number) => {
    if (!canEdit) return;
    setEditItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: Math.max(1, qty) } : it));
  };

  const removeItem = (index: number) => {
    if (!canEdit) return;
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveEdits = async () => {
    if (!selected) return;
    if (editItems.length === 0) {
      alert('Order must contain at least one item. To cancel, use Cancel Order.');
      return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/orders/${selected.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          items: editItems.map(it => ({
            product: it.product,
            name: it.name,
            image: it.image,
            unit: it.unit,
            price: it.price,
            quantity: it.quantity,
          })),
          subtotal: editedSubtotal,
          deliveryFee: selected.deliveryFee,
          handlingFee: selected.handlingFee,
          total: editedTotal,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update order');
      setOrders(prev => prev.map(o => o.id === selected.id ? data.order : o));
      setSelected(data.order);
      setEditItems(data.order.items);
      setDetailsOpen(false);
    } catch (err) {
      console.error(err);
      alert((err as any)?.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">My Orders</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {loading && (
          <div className="text-center py-8">Loading your orders...</div>
        )}
        {error && (
          <div className="text-center py-4 text-destructive text-sm">{error}</div>
        )}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/')}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Order</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order Total */}
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total</span>
                      <span>₹{order.total}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetails(order)}>
                        View Details
                      </Button>
                      {order.status === 'pending' && (
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => cancelOrder(order.id)}>
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(o) => !o ? closeDetails() : setDetailsOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Order ID</div>
                  <div className="font-medium">{selected.id}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date</div>
                  <div className="font-medium">{new Date(selected.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">{selected.customerName || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{selected.phone || '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">Address</div>
                  <div className="font-medium whitespace-pre-wrap">{selected.address || '—'}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Items</div>
                  <Badge variant={getStatusVariant(selected.status)} className="flex items-center gap-1">
                    {getStatusIcon(selected.status)}
                    {getStatusText(selected.status)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {editItems.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-xs text-muted-foreground">₹{it.price} {it.unit ? `• ${it.unit}` : ''}</div>
                      </div>
                      {canEdit ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-primary rounded-md">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => updateQty(idx, it.quantity - 1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium text-primary-foreground px-2">{it.quantity}</span>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => updateQty(idx, it.quantity + 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm">× {it.quantity}</div>
                      )}
                      <div className="w-16 text-right font-medium">₹{it.price * it.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{canEdit ? editedSubtotal : selected.subtotal}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span className={selected.deliveryFee === 0 ? 'text-success' : ''}>{selected.deliveryFee === 0 ? 'FREE' : `₹${selected.deliveryFee}`}</span></div>
                <div className="flex justify-between"><span>Handling</span><span>₹{selected.handlingFee}</span></div>
                <div className="flex justify-between font-semibold border-t pt-2"><span>Total</span><span>₹{canEdit ? editedTotal : selected.total}</span></div>
              </div>

              <div className="text-xs text-muted-foreground">Payment Method: {selected.paymentMethod || 'COD'}</div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            {selected?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => selected && cancelOrder(selected.id)} disabled={saving}>Cancel Order</Button>
                <Button onClick={saveEdits} disabled={saving || editItems.length === 0}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </>
            )}
            <Button variant="outline" onClick={closeDetails}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;