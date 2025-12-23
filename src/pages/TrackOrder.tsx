import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { z } from 'zod';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  ArrowLeft,
  MapPin,
  RefreshCcw,
  Box,
  PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const orderNumberSchema = z.string().min(5, 'Please enter a valid order number');

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  tracking_id: string | null;
  total: number;
  shipping_address: any;
  order_items: {
    id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    price: number;
  }[];
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
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

export default function TrackOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = orderNumberSchema.safeParse(orderNumber.trim());
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setOrder(null);
        toast.error('Order not found. Please check the order number.');
      } else {
        setOrder(data as OrderData);
      }
    } catch (error: any) {
      toast.error('Failed to fetch order details');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';
  const isReturned = order?.status === 'returned';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold">Track Order</h1>
              <p className="text-muted-foreground">Enter your order number to track delivery</p>
            </div>
          </div>

          {/* Search Form */}
          <Card className="glass-card border-border/50 mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter order number (e.g., GD202312150001)"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="hero" disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Track'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card border-border/50 mb-6">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Order #{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on {format(new Date(order.created_at), 'PPP')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {isCancelled && (
                        <Badge className="bg-red-500/20 text-red-500 border border-red-500/30">
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelled
                        </Badge>
                      )}
                      {isReturned && (
                        <Badge className="bg-orange-500/20 text-orange-500 border border-orange-500/30">
                          <RefreshCcw className="h-4 w-4 mr-1" />
                          Returned
                        </Badge>
                      )}
                      {!isCancelled && !isReturned && (
                        <Badge className="bg-primary/20 text-primary border border-primary/30">
                          {statusSteps[currentStatusIndex]?.icon && (
                            <span className="mr-1">
                              {(() => {
                                const Icon = statusSteps[currentStatusIndex].icon;
                                return <Icon className="h-4 w-4" />;
                              })()}
                            </span>
                          )}
                          {statusSteps[currentStatusIndex]?.label || order.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Tracker */}
                  {!isCancelled && !isReturned && (
                    <div className="mb-8">
                      <div className="flex justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                        <div
                          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                          style={{
                            width: `${Math.max(0, (currentStatusIndex / (statusSteps.length - 1)) * 100)}%`,
                          }}
                        />

                        {statusSteps.map((step, index) => {
                          const Icon = step.icon;
                          const isCompleted = index <= currentStatusIndex;
                          const isCurrent = index === currentStatusIndex;

                          return (
                            <div
                              key={step.key}
                              className="flex flex-col items-center relative z-10"
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                  isCompleted
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <p
                                className={`text-xs mt-2 text-center max-w-16 ${
                                  isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'
                                }`}
                              >
                                {step.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tracking ID */}
                  {order.tracking_id && (
                    <div className="bg-accent/50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-muted-foreground">Tracking ID</p>
                      <p className="font-mono font-medium">{order.tracking_id}</p>
                    </div>
                  )}

                  {/* Shipping Address */}
                  {order.shipping_address && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </h4>
                      <div className="bg-accent/50 p-4 rounded-lg text-sm">
                        <p className="font-medium">{order.shipping_address.full_name}</p>
                        <p>{order.shipping_address.address_line1}</p>
                        {order.shipping_address.address_line2 && (
                          <p>{order.shipping_address.address_line2}</p>
                        )}
                        <p>
                          {order.shipping_address.city}, {order.shipping_address.state} -{' '}
                          {order.shipping_address.pincode}
                        </p>
                        <p className="text-muted-foreground">
                          Phone: {order.shipping_address.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-3">Items in this order</h4>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 bg-accent/50 p-3 rounded-lg"
                        >
                          <div className="h-14 w-14 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
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
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-1">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × ₹{Number(item.price).toLocaleString()}
                            </p>
                          </div>
                          <p className="font-medium">
                            ₹{(item.quantity * Number(item.price)).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                    <span className="text-lg font-medium">Order Total</span>
                    <span className="text-2xl font-bold">
                      ₹{Number(order.total).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* No Order Found */}
          {hasSearched && !order && !isLoading && (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Order Not Found</h3>
                <p className="text-muted-foreground text-center">
                  We couldn't find an order with that number. Please check and try again.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
