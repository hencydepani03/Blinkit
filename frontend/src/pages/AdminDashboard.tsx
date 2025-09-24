import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Plus, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  Edit,
  Trash2,
  Search,
  BarChart3,
  DollarSign,
  AlertTriangle,
  Eye,
  TrendingDown,
  Calendar,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import React from "react";

// API base URL and types
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  description?: string;
  image?: string;
  sales?: number;
  status?: 'active' | 'low_stock';
}
interface OrderItem {
  product?: string;
  name: string;
  image?: string;
  unit?: string;
  price: number;
  quantity: number;
}
interface Order {
  id: string;
  user: { name: string; email: string };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  handlingFee: number;
  total: number;
  status: 'pending' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: string;
}

const mockCategories = ["Fruits", "Vegetables", "Dairy", "Bakery", "Beverages", "Snacks", "Personal Care"];

const AdminDashboard = () => {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Product>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  // Active tab state for controlled Tabs navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  // Order details modal state
  const [orderDetailsOpen, setOrderDetailsOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // Orders tab date filters
  const [ordersDateFrom, setOrdersDateFrom] = useState<string>('');
  const [ordersDateTo, setOrdersDateTo] = useState<string>('');
  // Analytics filters
  const [analyticsRangeType, setAnalyticsRangeType] = useState<'last7' | 'custom'>('last7');
  const [analyticsFrom, setAnalyticsFrom] = useState<string>('');
  const [analyticsTo, setAnalyticsTo] = useState<string>('');
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    unit: "",
    image: "/api/placeholder/80/80"
  });

  // Helpers for date filtering
  const dateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const withinRange = (iso: string, from?: string, to?: string) => {
    if (!iso) return false;
    const d = dateOnly(new Date(iso));
    let ok = true;
    if (from) {
      const f = dateOnly(new Date(from));
      ok = ok && d >= f;
    }
    if (to) {
      const t = dateOnly(new Date(to));
      ok = ok && d <= t;
    }
    return ok;
  };

  // Derived orders for Orders tab based on date range
  const ordersFilteredByDate = orders.filter(o => {
    if (!ordersDateFrom && !ordersDateTo) return true;
    return withinRange(o.createdAt, ordersDateFrom || undefined, ordersDateTo || undefined);
  });

  // Derived orders for Analytics based on range type
  const analyticsOrders = (() => {
    if (analyticsRangeType === 'last7') {
      const to = dateOnly(new Date());
      const from = new Date(to);
      from.setDate(from.getDate() - 6); // inclusive last 7 days
      return orders.filter(o => withinRange(o.createdAt, from.toISOString(), to.toISOString()));
    }
    // custom
    return orders.filter(o => withinRange(o.createdAt, analyticsFrom || undefined, analyticsTo || undefined));
  })();

  // Export analyticsOrders to CSV (Excel-compatible)
  const handleExportAnalytics = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Status', 'Items', 'Subtotal', 'Delivery Fee', 'Handling Fee', 'Total'],
      ...analyticsOrders.map(o => [
        o.id,
        new Date(o.createdAt).toISOString().slice(0,10),
        o.user?.name || 'Customer',
        o.status,
        o.items?.reduce((s, it) => s + (Number(it.quantity) || 0), 0).toString(),
        String(o.subtotal ?? ''),
        String(o.deliveryFee ?? ''),
        String(o.handlingFee ?? ''),
        String(o.total ?? '')
      ])
    ];
    const csv = rows.map(r => r.map(cell => {
      const str = String(cell ?? '');
      const needsQuotes = /[",\n]/.test(str);
      const escaped = str.replace(/\"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    }).join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g, '-');
    a.download = `analytics-report-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

    // Redirect non-admins after auth state resolves
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/");
    }
  }, [isLoading, isAdmin, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Helper to compute status when backend doesn't send it
  const computeStatus = (p: Product) => (Number(p.stock) <= 20 ? 'low_stock' : 'active');

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch(`${API_BASE}/api/products`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load products');
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to load products', variant: 'destructive' });
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [toast]);

  // Fetch orders (admin)
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAdmin) return;
      try {
        setLoadingOrders(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to load orders');
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to load orders', variant: 'destructive' });
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [isAdmin, toast]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Unauthorized', description: 'Please log in as admin', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        name: newProduct.name.trim(),
        category: newProduct.category.trim(),
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        unit: newProduct.unit.trim(),
        description: newProduct.description?.trim() || '',
        image: newProduct.image?.trim() || '/api/placeholder/80/80'
      };
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to add product');
      setProducts(prev => [data.product, ...prev]);
      toast({ title: 'Product added!', description: `${payload.name} has been added to inventory` });
      setNewProduct({
        name: "",
        category: "",
        price: "",
        stock: "",
        description: "",
        unit: "",
        image: "/api/placeholder/80/80"
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add product', variant: 'destructive' });
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Unauthorized', description: 'Please log in as admin', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to delete product');
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Product deleted', description: `${name} has been removed from inventory`, variant: 'destructive' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete product', variant: 'destructive' });
    }
  };

  const beginEditProduct = (p: Product) => {
    setEditingId(p.id);
    setEditingData({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      unit: p.unit,
      description: p.description || '',
      image: p.image || ''
    });
  };

  const cancelEditProduct = () => {
    setEditingId(null);
    setEditingData({});
  };

  const saveEditProduct = async () => {
    if (!editingId) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Unauthorized', description: 'Please log in as admin', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        name: (editingData.name || '').toString().trim(),
        category: (editingData.category || '').toString().trim(),
        price: Number(editingData.price),
        stock: Number(editingData.stock),
        unit: (editingData.unit || '').toString().trim(),
        description: (editingData.description || '').toString(),
        image: (editingData.image || '').toString()
      };
      const res = await fetch(`${API_BASE}/api/products/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update product');
      setProducts(prev => prev.map(p => p.id === editingId ? data.product : p));
      toast({ title: 'Product updated', description: `${payload.name} has been saved` });
      cancelEditProduct();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update product', variant: 'destructive' });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Unauthorized', description: 'Please log in as admin', variant: 'destructive' });
        return;
      }
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update order status');
      setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
      toast({ title: 'Order updated', description: `Order ${orderId} status changed to ${newStatus}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update order', variant: 'destructive' });
    }
  };

  // Calculate dynamic stats based on products
  const totalProducts = products.length;
  const activeProducts = products.filter(p => (p.status ?? computeStatus(p)) === 'active').length;
  const lowStockProducts = products.filter(p => (p.status ?? computeStatus(p)) === 'low_stock').length;
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const todayStr = new Date().toISOString().slice(0,10);
  const todayOrders = orders.filter(order => (order.createdAt || '').slice(0,10) === todayStr).length;

  const stats = [
    {
      title: "Total Products",
      value: totalProducts.toString(),
      icon: Package,
      change: "+12%",
      changeType: "positive",
      description: `${activeProducts} active, ${lowStockProducts} low stock`
    },
    {
      title: "Today's Orders",
      value: todayOrders.toString(),
      icon: ShoppingCart,
      change: "+8%", 
      changeType: "positive",
      description: `${orders.filter(o => o.status === 'pending').length} pending`
    },
    {
      title: "Revenue Today",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+15%",
      changeType: "positive",
      description: "From all orders"
    },
    {
      title: "Low Stock Alert",
      value: lowStockProducts.toString(),
      icon: AlertTriangle,
      change: lowStockProducts > 0 ? "Needs attention" : "All good",
      changeType: lowStockProducts > 0 ? "negative" : "positive",
      description: "Products running low"
    }
  ];

  // Derived categories and filtered products
  const categoryOptions = Array.from(new Set(products.map(p => p.category))).sort();
  const filteredProducts = products.filter(product => {
    const matchesSearch =
  product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  product.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || (product.status ?? computeStatus(product)) === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                View Store
              </Button>
              <Button variant="destructive" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${
                    stat.changeType === 'negative' ? 'text-destructive' : 'text-primary'
                  }`} />
                  <Badge variant={stat.changeType === 'negative' ? 'destructive' : 'secondary'}>
                    {stat.change}
                  </Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="add-product" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <Card className="lg:col-span-2 shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 4).map((order) => {
                      const created = new Date(order.createdAt);
                      const time = created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium">{order.user?.name || 'Customer'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{order.total}</p>
                            <Badge variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'pending' ? 'secondary' : 'outline'
                            }>
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...products]
                      .sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0))
                      .slice(0, 4)
                      .map((product) => (
                        <div key={product.id} className="flex items-center gap-3">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-muted"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sales ?? 0} sales</p>
                          </div>
                          <p className="text-sm font-medium">₹{product.price}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 hover:shadow-medium transition-shadow cursor-pointer hover:ring-1 hover:ring-primary/20" 
                    onClick={() => setActiveTab('add-product')}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Add Product</h3>
                    <p className="text-sm text-muted-foreground">Add new items to inventory</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-medium transition-shadow cursor-pointer hover:ring-1 hover:ring-primary/20"
                    onClick={() => setActiveTab('orders')}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium">Manage Orders</h3>
                    <p className="text-sm text-muted-foreground">Process pending orders</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-medium transition-shadow cursor-pointer hover:ring-1 hover:ring-primary/20"
                    onClick={() => setActiveTab('analytics')}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-medium">View Analytics</h3>
                    <p className="text-sm text-muted-foreground">Check performance metrics</p>
                  </div>
                </div>
              </Card>
            </div>

          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Product Management</h2>
                <p className="text-sm text-muted-foreground">
                  Total: {totalProducts} products â€¢ Active: {activeProducts} â€¢ Low Stock: {lowStockProducts}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {mockCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    {editingId === product.id ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-4">
                          <img src={editingData.image || product.image} alt={editingData.name || product.name} className="w-16 h-16 rounded-lg object-cover bg-muted" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                            <div className="space-y-1">
                              <Label>Name</Label>
                              <Input value={editingData.name as string || ''} onChange={(e) => setEditingData(d => ({ ...d, name: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                              <Label>Category</Label>
                              <Input value={editingData.category as string || ''} onChange={(e) => setEditingData(d => ({ ...d, category: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                              <Label>Price (₹)</Label>
                              <Input type="number" value={editingData.price as number | any || 0} onChange={(e) => setEditingData(d => ({ ...d, price: Number(e.target.value) }))} />
                            </div>
                            <div className="space-y-1">
                              <Label>Stock</Label>
                              <Input type="number" value={editingData.stock as number | any || 0} onChange={(e) => setEditingData(d => ({ ...d, stock: Number(e.target.value) }))} />
                            </div>
                            <div className="space-y-1">
                              <Label>Unit</Label>
                              <Input value={editingData.unit as string || ''} onChange={(e) => setEditingData(d => ({ ...d, unit: e.target.value }))} />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <Label>Image URL</Label>
                              <Input value={editingData.image as string || ''} onChange={(e) => setEditingData(d => ({ ...d, image: e.target.value }))} />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <Label>Description</Label>
                              <Textarea rows={3} value={editingData.description as string || ''} onChange={(e) => setEditingData(d => ({ ...d, description: e.target.value }))} />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={cancelEditProduct}>Cancel</Button>
                          <Button variant="default" onClick={saveEditProduct}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover bg-muted"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{product.name}</h3>
                            <Badge variant="secondary">{product.category}</Badge>
                            <Badge 
                              variant={product.status === "low_stock" ? "destructive" : "default"}
                            >
                              {product.status === "low_stock" ? "Low Stock" : "Active"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <span>Price: ₹{product.price}</span>
                            <span>Stock: {product.stock} units</span>
                            <span>Unit: {product.unit}</span>
                            <span>Sales: {product.sales ?? 0}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" title="Edit Product" onClick={() => beginEditProduct(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            title="Delete Product"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <Card className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No products found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Order Management</h2>
                <p className="text-sm text-muted-foreground">
                  {orders.length} total orders • {orders.filter(o => o.status === 'pending').length} pending
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">From</div>
                  <Input type="date" value={ordersDateFrom} onChange={(e) => setOrdersDateFrom(e.target.value)} className="w-[150px]" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">To</div>
                  <Input type="date" value={ordersDateTo} onChange={(e) => setOrdersDateTo(e.target.value)} className="w-[150px]" />
                </div>
                <Button variant="outline" size="sm" onClick={() => { setOrdersDateFrom(''); setOrdersDateTo(''); }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {ordersFilteredByDate.map((order) => {
                const created = new Date(order.createdAt);
                const dateStr = created.toISOString().slice(0,10);
                const timeStr = created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const itemsCount = order.items.reduce((s, it) => s + (it.quantity || 0), 0);
                return (
                  <Card key={order.id} className="shadow-soft hover:shadow-medium transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{order.user?.name || 'Customer'}</h3>
                            <Badge 
                              variant={
                                order.status === 'delivered' ? 'default' :
                                order.status === 'pending' ? 'secondary' :
                                order.status === 'out_for_delivery' ? 'outline' : 'secondary'
                              }
                            >
                              {order.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground mb-3">                           <span>{itemsCount} items • ₹{order.total}</span>
                            <span>{dateStr} • {timeStr}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {order.items.slice(0, 3).map((it, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {it.name}
                              </Badge>
                            ))}
                            {order.items.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{order.items.length - 3} more</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {order.status === 'pending' && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => updateOrderStatus(order.id, 'packed')}>
                                Mark Packed
                              </Button>
                              <Button variant="default" size="sm" onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}>
                                Ship Order
                              </Button>
                            </>
                          )}
                          {order.status === 'packed' && (
                            <Button variant="default" size="sm" onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}>
                              Ship Order
                            </Button>
                          )}
                          {order.status === 'out_for_delivery' && (
                            <Button variant="default" size="sm" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                              Mark Delivered
                            </Button>
                          )}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <Button variant="destructive" size="sm" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                              Cancel Order
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {ordersFilteredByDate.length === 0 && !loadingOrders && (
                <Card className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">No orders for the selected date range.</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Add Product Tab */}
          <TabsContent value="add-product">
            <Card className="max-w-2xl mx-auto shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Product
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct({...newProduct, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCategories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        placeholder="Enter price"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                        placeholder="Enter stock quantity"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                        placeholder="e.g., 1 kg, 1 liter"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Enter product description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL (Optional)</Label>
                    <Input
                      id="image"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                      placeholder="Enter image URL or use default"
                    />
                  </div>

                  <Button type="submit" variant="gradient" size="lg" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product to Inventory
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Analytics & Reports</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Select value={analyticsRangeType} onValueChange={(v: any) => setAnalyticsRangeType(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last7">Last 7 days</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                  {analyticsRangeType === 'custom' && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">From</div>
                      <Input type="date" value={analyticsFrom} onChange={(e) => setAnalyticsFrom(e.target.value)} className="w-[150px]" />
                      <div className="text-xs text-muted-foreground">To</div>
                      <Input type="date" value={analyticsTo} onChange={(e) => setAnalyticsTo(e.target.value)} className="w-[150px]" />
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleExportAnalytics}>
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-lg font-bold">₹{analyticsOrders.length ? Math.round((analyticsOrders.reduce((s, o) => s + (Number(o.total) || 0), 0)) / analyticsOrders.length) : 0}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-lg font-bold">{new Set(analyticsOrders.map(o => o.user?.email || o.user?.name || 'Guest')).size}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Package className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Best Category</p>
                    <p className="text-lg font-bold">Fruits</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Return Rate</p>
                    <p className="text-lg font-bold">2.3%</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
                <div className="space-y-3">
                  {[...products]
                    .sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0))
                    .slice(0, 5)
                    .map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-6">#{index + 1}</span>
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover bg-muted"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{product.sales ?? 0} sold</p>
                          <p className="text-xs text-muted-foreground">₹{product.price * (product.sales ?? 0)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
                <div className="space-y-3">
                  {['delivered', 'pending', 'out_for_delivery', 'packed', 'cancelled'].map(status => {
                    const count = analyticsOrders.filter(o => o.status === status).length;
                    const percentage = analyticsOrders.length ? (count / analyticsOrders.length) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'delivered' ? 'bg-primary' :
                            status === 'pending' ? 'bg-secondary' :
                            status === 'out_for_delivery' ? 'bg-accent' : status === 'cancelled' ? 'bg-destructive' : 'bg-muted'
                          }`} />
                          <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Global Order Details Dialog - always mounted */}
        <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                {selectedOrder ? (
                  <span>
                    Order ID: {selectedOrder.id} • Total: ₹{selectedOrder.total}
                  </span>
                ) : (
                  'View items in this order'
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
              {selectedOrder?.items.map((it, idx) => (
                <Card key={idx} className="shadow-soft">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-4">
                      <img
                        src={it.image || '/api/placeholder/80/80'}
                        alt={it.name}
                        className="w-14 h-14 rounded-lg object-cover bg-muted"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{it.name}</p>
                          {it.unit && (
                            <Badge variant="outline" className="text-xs">{it.unit}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">Qty: {it.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{it.price}</p>
                        <p className="text-xs text-muted-foreground">Sub: ₹{(Number(it.price) || 0) * (Number(it.quantity) || 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!selectedOrder && (
                <div className="text-sm text-muted-foreground">No order selected.</div>
              )}
            </div>

            <DialogFooter>
              <Button variant="default" onClick={() => setOrderDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;