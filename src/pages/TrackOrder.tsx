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
  ShoppingCart,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const searchSchema = z.string().min(3, 'Please enter at least 3 characters');

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
  { key: 'pending', label: 'Order Placed', icon: ShoppingCart, description: 'Your order has been received' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Order confirmed by seller' },
  { key: 'packed', label: 'Packed', icon: Box, description: 'Your order is being packed' },
  { key: 'shipped', label: 'Shipped', icon: Package, description: 'Order has been shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'Your order is on the way' },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck, description: 'Order delivered successfully' },
];

const getStatusIndex = (status: string) => {
  if (status === 'cancelled' || status === 'returned') return -1;
  return statusSteps.findIndex((s) => s.key === status);
};

export default function TrackOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('order') || searchParams.get('tracking') || '');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchType, setSearchType] = useState<'order' | 'tracking'>('order');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = searchSchema.safeParse(searchQuery.trim());
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Try searching by order number first
      let { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', searchQuery.trim().toUpperCase())
        .maybeSingle();

      // If not found by order number, try tracking ID
      if (!data && !error) {
        const trackingResult = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('tracking_id', searchQuery.trim())
          .maybeSingle();
        
        data = trackingResult.data;
        error = trackingResult.error;
        if (data) setSearchType('tracking');
      } else {
        setSearchType('order');
      }

      if (error) throw error;

      if (!data) {
        setOrder(null);
        toast.error('Order not found. Please check the order number or tracking ID.');
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

  // Generate journey timeline
  const getOrderJourney = () => {
    if (!order) return [];
    
    const journey = [];
    const orderDate = new Date(order.created_at);
    const updateDate = new Date(order.updated_at);
    
    // Always show order placed
    journey.push({
      status: 'Order Placed',
      description: 'Your order has been received',
      date: orderDate,
      icon: ShoppingCart,
      completed: true,
    });

    // Add intermediate steps based on current status
    const currentIdx = getStatusIndex(order.status);
    
    if (currentIdx >= 1) {
      journey.push({
        status: 'Confirmed',
        description: 'Order confirmed by seller',
        date: null, // We don't have exact dates for each step
        icon: CheckCircle,
        completed: true,
      });
    }

    if (currentIdx >= 2) {
      journey.push({
        status: 'Packed',
        description: 'Order packed and ready for shipping',
        date: null,
        icon: Box,
        completed: true,
      });
    }

    if (currentIdx >= 3) {
      journey.push({
        status: 'Shipped',
        description: order.tracking_id ? `Tracking ID: ${order.tracking_id}` : 'Order shipped',
        date: null,
        icon: Package,
        completed: true,
      });
    }

    if (currentIdx >= 4) {
      journey.push({
        status: 'Out for Delivery',
        description: 'Your order is on the way',
        date: null,
        icon: Truck,
        completed: true,
      });
    }

    if (currentIdx >= 5) {
      journey.push({
        status: 'Delivered',
        description: 'Order delivered successfully',
        date: updateDate,
        icon: PackageCheck,
        completed: true,
      });
    }

    // Add next expected step if not delivered
    if (currentIdx >= 0 && currentIdx < 5 && !isCancelled && !isReturned) {
      const nextStep = statusSteps[currentIdx + 1];
      if (nextStep) {
        journey.push({
          status: nextStep.label,
          description: nextStep.description,
          date: null,
          icon: nextStep.icon,
          completed: false,
        });
      }
    }

    return journey;
  };

  const journey = getOrderJourney();

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
              <p className="text-muted-foreground">Enter your order number or tracking ID</p>
            </div>
          </div>

          {/* Search Form */}
          <Card className="glass-card border-border/50 mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter order number (GD...) or tracking ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="hero" disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Track'}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                You can search using your order number or the shipping tracking ID provided by the seller
              </p>
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
                      {searchType === 'tracking' && (
                        <p className="text-xs text-primary mt-1">
                          Found by tracking ID: {order.tracking_id}
                        </p>
                      )}
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
                      <Badge className={order.payment_status === 'paid' 
                        ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                      }>
                        <CreditCard className="h-4 w-4 mr-1" />
                        {order.payment_status}
                      </Badge>
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

                  {/* Order Journey Timeline */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Order Journey
                    </h4>
                    <div className="space-y-4">
                      {journey.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step.completed 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted text-muted-foreground border-2 border-dashed border-muted-foreground'
                              }`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              {index < journey.length - 1 && (
                                <div className={`w-0.5 h-8 ${
                                  step.completed ? 'bg-primary' : 'bg-muted'
                                }`} />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.status}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {step.description}
                              </p>
                              {step.date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(step.date, 'PPp')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tracking ID */}
                  {order.tracking_id && (
                    <div className="bg-accent/50 p-4 rounded-lg mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">Shipping Tracking ID</p>
                      </div>
                      <p className="font-mono text-lg">{order.tracking_id}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use this ID to track your shipment with the courier
                      </p>
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
                <p className="text-muted-foreground text-center max-w-md">
                  We couldn't find an order with that number or tracking ID. Please check and try again.
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
