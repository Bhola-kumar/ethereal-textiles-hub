import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAllOrders } from '@/hooks/useOrders';
import { useAdminStats, calculateTrend } from '@/hooks/useAdminStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { data: orders = [], isLoading: ordersLoading } = useAllOrders();
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  const isLoading = ordersLoading || statsLoading;

  const recentOrders = orders.slice(0, 5);

  // Calculate trends from stats
  const revenueTrend = stats ? calculateTrend(stats.totalRevenue, stats.previousRevenue) : { value: '0%', isUp: true };
  const ordersTrend = stats ? calculateTrend(stats.totalOrders - stats.previousOrders, stats.previousOrders) : { value: '0%', isUp: true };
  const productsTrend = stats ? calculateTrend(stats.totalProducts, stats.previousProducts) : { value: '0%', isUp: true };
  const customersTrend = stats ? calculateTrend(stats.totalCustomers, stats.previousCustomers) : { value: '0%', isUp: true };

  const mainStats = [
    {
      label: 'Total Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      trend: revenueTrend.value,
      trendUp: revenueTrend.isUp,
      description: 'From paid orders',
    },
    {
      label: 'Total Orders',
      value: (stats?.totalOrders || 0).toString(),
      icon: ShoppingCart,
      trend: ordersTrend.value,
      trendUp: ordersTrend.isUp,
      description: 'All time orders',
    },
    {
      label: 'Total Products',
      value: (stats?.totalProducts || 0).toString(),
      icon: Package,
      trend: productsTrend.value,
      trendUp: productsTrend.isUp,
      description: 'Active listings',
    },
    {
      label: 'Customers',
      value: (stats?.totalCustomers || 0).toString(),
      icon: Users,
      trend: customersTrend.value,
      trendUp: customersTrend.isUp,
      description: 'Unique buyers',
    },
  ];

  const secondaryStats = [
    {
      label: 'Active Sellers',
      value: (stats?.totalSellers || 0).toString(),
      icon: Store,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Pending Orders',
      value: (stats?.pendingOrders || 0).toString(),
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Delivered',
      value: (stats?.deliveredOrders || 0).toString(),
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Cancelled',
      value: (stats?.cancelledOrders || 0).toString(),
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">
          Dashboard
        </h1>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mainStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border/50">
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <stat.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${
                          stat.trendUp ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {stat.trend}
                          {stat.trendUp ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {secondaryStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Card className="bg-card border-border/50">
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-8" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Payment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-foreground">Paid Orders</span>
                    </div>
                    <span className="font-bold text-green-500">{stats?.paidOrders || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <span className="text-foreground">Pending Payment</span>
                    </div>
                    <span className="font-bold text-yellow-500">{stats?.unpaidOrders || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card className="bg-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Pending', value: stats?.pendingOrders || 0, color: 'bg-yellow-500' },
                    { label: 'Delivered', value: stats?.deliveredOrders || 0, color: 'bg-green-500' },
                    { label: 'Cancelled', value: stats?.cancelledOrders || 0, color: 'bg-red-500' },
                  ].map((item) => {
                    const total = stats?.totalOrders || 1;
                    const percentage = (item.value / total) * 100;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="text-foreground font-medium">{item.value} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-accent rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No orders yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-accent/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {order.order_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'PPp')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        ₹{Number(order.total).toLocaleString()}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered' 
                          ? 'bg-green-500/20 text-green-500'
                          : order.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : order.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-500'
                          : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
