import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react';
import { SellerOrderCard } from '@/components/order/SellerOrderCard';
import { ReturnRequest } from '@/hooks/useReturnRequests';

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
  notes: string | null;
  tracking_id: string | null;
  decline_reason: string | null;
  declined_at: string | null;
  items: OrderItem[];
}

const statusOptions = [
  { value: 'all', label: 'All Orders', icon: ShoppingCart },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { value: 'packed', label: 'Packed', icon: Package },
  { value: 'shipped', label: 'Shipped', icon: Truck },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchReturnRequests();
    }
  }, [user]);

  const fetchReturnRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReturnRequests(data || []);
    } catch (error) {
      console.error('Error fetching return requests:', error);
    }
  };

  const getReturnRequest = (orderId: string) => {
    return returnRequests.find(r => r.order_id === orderId);
  };

  const fetchOrders = async () => {
    try {
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
            created_at,
            notes,
            tracking_id,
            decline_reason,
            declined_at
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

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

  const filteredOrders = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => 
      !searchQuery || 
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(item => item.product_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
  const ordersNeedingAction = orders.filter(
    o => (o.status === 'pending' && o.payment_status === 'pending') || 
         returnRequests.some(r => r.order_id === o.id && r.status === 'pending')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground">Orders</h1>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search orders..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Required Alert */}
        {ordersNeedingAction.length > 0 && (
          <Card className="mb-4 border-amber-500/50 bg-amber-500/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <span className="font-medium">{ordersNeedingAction.length}</span> order(s) need your attention
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Stats */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { label: 'Total', value: stats.total, icon: ShoppingCart },
            { label: 'Pending', value: stats.pending, icon: Clock },
            { label: 'Processing', value: stats.processing, icon: Package },
            { label: 'Shipped', value: stats.shipped, icon: Truck },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border/50">
              <CardContent className="p-2 flex flex-col items-center">
                <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Orders List - Compact Cards */}
        {filteredOrders.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-8 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <SellerOrderCard
                key={order.id}
                order={order}
                returnRequest={getReturnRequest(order.id)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
