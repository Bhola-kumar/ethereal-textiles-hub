import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft, Eye, RefreshCcw, FileText, Box, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useOrders, Order } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OrderInvoice from '@/components/order/OrderInvoice';
import OrderDetailsModal from '@/components/order/OrderDetailsModal';

const statusSteps = [
  { key: 'pending', label: 'Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'packed', label: 'Packed', icon: Box },
  { key: 'shipped', label: 'Shipped', icon: Package },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
];

const getStatusIndex = (status: string) => {
  if (status === 'cancelled' || status === 'returned') return -1;
  return statusSteps.findIndex((s) => s.key === status);
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  packed: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  out_for_delivery: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  returned: <RefreshCcw className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  packed: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  shipped: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
  out_for_delivery: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  delivered: 'bg-green-500/20 text-green-500 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
  returned: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
};

const paymentColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  paid: 'bg-green-500/20 text-green-500',
  failed: 'bg-red-500/20 text-red-500',
  refunded: 'bg-blue-500/20 text-blue-500',
};

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: orders, isLoading, refetch } = useOrders(user?.id);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-display font-bold">My Orders</h1>
                <p className="text-muted-foreground">Track and manage your orders</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Orders List */}
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card border-border/50 overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            Order #{order.order_number}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Placed on {format(new Date(order.created_at), 'PPP')}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${statusColors[order.status]} border`}>
                            {statusIcons[order.status]}
                            <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={paymentColors[order.payment_status]}>
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Visual Order Progress */}
                      {order.status !== 'cancelled' && order.status !== 'returned' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between relative">
                            {/* Progress Line Background */}
                            <div className="absolute top-3 left-0 right-0 h-1 bg-border rounded-full" />
                            {/* Progress Line Active */}
                            <div
                              className="absolute top-3 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(0, (getStatusIndex(order.status) / (statusSteps.length - 1)) * 100)}%`,
                              }}
                            />
                            {statusSteps.map((step, idx) => {
                              const Icon = step.icon;
                              const isCompleted = idx <= getStatusIndex(order.status);
                              const isCurrent = idx === getStatusIndex(order.status);
                              return (
                                <div key={step.key} className="flex flex-col items-center relative z-10">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                      isCompleted
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                    } ${isCurrent ? 'ring-2 ring-primary/40' : ''}`}
                                  >
                                    <Icon className="h-3 w-3" />
                                  </div>
                                  <span className={`text-[10px] mt-1 hidden sm:block ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        {order.order_items?.slice(0, 4).map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="h-16 w-16 rounded-lg bg-secondary/30 overflow-hidden">
                              {item.product_image ? (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {item.quantity} × ₹{item.price}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.order_items && order.order_items.length > 4 && (
                          <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-secondary/30">
                            <span className="text-sm text-muted-foreground">
                              +{order.order_items.length - 4}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Order Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-lg font-bold">₹{order.total.toLocaleString()}</p>
                          </div>
                          {order.tracking_id && (
                            <div>
                              <p className="text-xs text-muted-foreground">Tracking ID</p>
                              <p className="text-sm font-medium">{order.tracking_id}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setInvoiceOrder(order)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Invoice
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDetailsOrder(order)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Start shopping to see your orders here
                </p>
                <Link to="/products">
                  <Button variant="hero">Browse Products</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Invoice Modal */}
        {invoiceOrder && (
          <OrderInvoice
            order={{
              ...invoiceOrder,
              shipping_address: invoiceOrder.shipping_address as any,
              order_items: invoiceOrder.order_items?.map(item => ({
                id: item.id,
                product_name: item.product_name,
                product_image: item.product_image,
                quantity: item.quantity,
                price: Number(item.price),
              })),
            }}
            open={!!invoiceOrder}
            onOpenChange={(open) => !open && setInvoiceOrder(null)}
          />
        )}

        {/* Order Details Modal */}
        <OrderDetailsModal
          order={detailsOrder ? {
            ...detailsOrder,
            shipping_address: detailsOrder.shipping_address as any,
            order_items: detailsOrder.order_items?.map(item => ({
              id: item.id,
              product_name: item.product_name,
              product_image: item.product_image,
              quantity: item.quantity,
              price: Number(item.price),
            })) || [],
          } : null}
          open={!!detailsOrder}
          onOpenChange={(open) => !open && setDetailsOrder(null)}
        />
      </main>

      <Footer />
    </div>
  );
}
