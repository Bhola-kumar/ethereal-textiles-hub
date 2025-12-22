import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  IndianRupee, 
  TrendingUp,
  Plus,
  Eye,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  publishedProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    publishedProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch products count
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user!.id);

      const { count: publishedProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user!.id)
        .eq('is_published', true);

      // Fetch seller's product IDs
      const { data: sellerProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user!.id);

      const productIds = sellerProducts?.map(p => p.id) || [];

      if (productIds.length > 0) {
        // Fetch orders containing seller's products
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('order_id, price, quantity, orders!inner(id, order_number, status, created_at, total)')
          .in('product_id', productIds);

        const uniqueOrders = new Map();
        let totalRevenue = 0;
        let pendingCount = 0;

        orderItems?.forEach(item => {
          const order = item.orders as any;
          if (!uniqueOrders.has(order.id)) {
            uniqueOrders.set(order.id, order);
            if (['pending', 'confirmed', 'packed'].includes(order.status)) {
              pendingCount++;
            }
          }
          totalRevenue += Number(item.price) * item.quantity;
        });

        setStats({
          totalProducts: totalProducts || 0,
          publishedProducts: publishedProducts || 0,
          totalOrders: uniqueOrders.size,
          pendingOrders: pendingCount,
          totalRevenue,
          monthlyRevenue: totalRevenue, // Simplified for now
        });

        // Get recent orders
        const recent = Array.from(uniqueOrders.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentOrders(recent);
      } else {
        setStats({
          totalProducts: totalProducts || 0,
          publishedProducts: publishedProducts || 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Products', 
      value: stats.totalProducts, 
      subtext: `${stats.publishedProducts} published`,
      icon: Package, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10' 
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders, 
      subtext: `${stats.pendingOrders} pending`,
      icon: ShoppingCart, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10' 
    },
    { 
      title: 'Total Revenue', 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      subtext: 'All time',
      icon: IndianRupee, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10' 
    },
    { 
      title: 'This Month', 
      value: `₹${stats.monthlyRevenue.toLocaleString()}`, 
      subtext: 'Revenue',
      icon: TrendingUp, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10' 
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      confirmed: 'bg-blue-500/20 text-blue-500',
      packed: 'bg-purple-500/20 text-purple-500',
      shipped: 'bg-indigo-500/20 text-indigo-500',
      delivered: 'bg-green-500/20 text-green-500',
      cancelled: 'bg-red-500/20 text-red-500',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Seller Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your store overview.
            </p>
          </div>
          <Link to="/seller/products">
            <Button variant="hero">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-xl lg:text-2xl font-bold text-foreground mt-1">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                    </div>
                    <div className={`p-2 lg:p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions & Recent Orders */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to="/seller/products">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Package className="h-5 w-5" />
                  <span className="text-sm">Manage Products</span>
                </Button>
              </Link>
              <Link to="/seller/orders">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm">View Orders</span>
                </Button>
              </Link>
              <Link to="/seller/analytics">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </Link>
              <Link to="/seller/shop">
                <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm">Shop Settings</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <Link to="/seller/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">₹{Number(order.total).toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
