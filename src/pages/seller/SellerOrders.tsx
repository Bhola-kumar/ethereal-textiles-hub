import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, Eye, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  shipping_address: any;
  created_at: string;
  items: OrderItem[];
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      // Get seller's products
      const { data: sellerProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user!.id);

      const productIds = sellerProducts?.map(p => p.id) || [];

      if (productIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Get order items for seller's products
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          id,
          product_name,
          product_image,
          quantity,
          price,
          order_id,
          orders!inner (
            id,
            order_number,
            status,
            payment_status,
            total,
            subtotal,
            shipping_cost,
            shipping_address,
            created_at
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by order
      const orderMap = new Map<string, Order>();
      orderItems?.forEach(item => {
        const order = item.orders as any;
        if (!orderMap.has(order.id)) {
          orderMap.set(order.id, {
            ...order,
            items: [],
          });
        }
        orderMap.get(order.id)!.items.push({
          id: item.id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          price: Number(item.price),
        });
      });

      const ordersArray = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(ordersArray);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      confirmed: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
      packed: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
      shipped: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
      out_for_delivery: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
      delivered: 'bg-green-500/20 text-green-500 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      paid: 'bg-green-500/20 text-green-500',
      failed: 'bg-red-500/20 text-red-500',
      refunded: 'bg-gray-500/20 text-gray-500',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => ['confirmed', 'packed'].includes(o.status)).length,
      shipped: orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Orders</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: ShoppingCart },
            { label: 'Pending', value: stats.pending, icon: Package },
            { label: 'Processing', value: stats.processing, icon: Package },
            { label: 'Shipped', value: stats.shipped, icon: Truck },
            { label: 'Delivered', value: stats.delivered, icon: Eye },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="bg-card/50 border-border/50 overflow-hidden">
                <CardHeader className="bg-accent/30 py-3 px-4 lg:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-base font-medium">{order.order_number}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <Badge className={getPaymentColor(order.payment_status)}>{order.payment_status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Items */}
                    <div className="lg:col-span-2 space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-accent/20 rounded-lg">
                          {item.product_image ? (
                            <img src={item.product_image} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                          <p className="font-semibold text-foreground">
                            ₹{(item.quantity * item.price).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Shipping & Summary */}
                    <div className="space-y-4">
                      <div className="p-4 bg-accent/20 rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-2">Shipping Address</p>
                        <div className="text-sm text-muted-foreground">
                          <p>{order.shipping_address?.full_name}</p>
                          <p>{order.shipping_address?.address_line1}</p>
                          {order.shipping_address?.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                          <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
                          <p>Phone: {order.shipping_address?.phone}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="text-foreground">₹{Number(order.subtotal).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Shipping</span>
                          <span className="text-foreground">₹{Number(order.shipping_cost || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t border-border pt-2">
                          <span>Total</span>
                          <span className="text-primary">₹{Number(order.total).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
