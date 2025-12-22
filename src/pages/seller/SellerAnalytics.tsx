import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  IndianRupee,
  ShoppingCart,
  Eye
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  avgOrderValue: number;
  ordersByStatus: { name: string; value: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#6366f1', '#22c55e', '#ef4444'];

export default function SellerAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    avgOrderValue: 0,
    ordersByStatus: [],
    revenueByMonth: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch products
      const { data: products, count: productCount } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('seller_id', user!.id);

      const productIds = products?.map(p => p.id) || [];

      if (productIds.length === 0) {
        setData({
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: productCount || 0,
          avgOrderValue: 0,
          ordersByStatus: [],
          revenueByMonth: [],
        });
        setLoading(false);
        return;
      }

      // Fetch order items for seller's products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          price,
          quantity,
          orders!inner (
            id,
            status,
            created_at
          )
        `)
        .in('product_id', productIds);

      // Calculate metrics
      const orderMap = new Map();
      let totalRevenue = 0;
      const statusCount: Record<string, number> = {};
      const monthlyRevenue: Record<string, number> = {};

      orderItems?.forEach(item => {
        const order = item.orders as any;
        const itemRevenue = Number(item.price) * item.quantity;
        totalRevenue += itemRevenue;

        if (!orderMap.has(order.id)) {
          orderMap.set(order.id, true);
          statusCount[order.status] = (statusCount[order.status] || 0) + 1;
        }

        const month = new Date(order.created_at).toLocaleDateString('en-US', { 
          month: 'short',
          year: '2-digit'
        });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + itemRevenue;
      });

      const totalOrders = orderMap.size;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const ordersByStatus = Object.entries(statusCount).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      const revenueByMonth = Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .slice(-6);

      setData({
        totalRevenue,
        totalOrders,
        totalProducts: productCount || 0,
        avgOrderValue,
        ordersByStatus,
        revenueByMonth,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Revenue', 
      value: `₹${data.totalRevenue.toLocaleString()}`, 
      icon: IndianRupee, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10' 
    },
    { 
      title: 'Total Orders', 
      value: data.totalOrders, 
      icon: ShoppingCart, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10' 
    },
    { 
      title: 'Products Listed', 
      value: data.totalProducts, 
      icon: Package, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10' 
    },
    { 
      title: 'Avg Order Value', 
      value: `₹${Math.round(data.avgOrderValue).toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10' 
    },
  ];

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
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Track your store performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No revenue data yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders by Status */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Orders by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.ordersByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.ordersByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
