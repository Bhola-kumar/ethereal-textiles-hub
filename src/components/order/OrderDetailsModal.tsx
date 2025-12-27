import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  RefreshCcw,
  Box,
  PackageCheck,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  tracking_id: string | null;
  total: number;
  subtotal: number;
  shipping_cost: number | null;
  discount: number | null;
  shipping_address: ShippingAddress;
  order_items: OrderItem[];
}

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock, description: 'Your order has been placed successfully' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Seller has confirmed your order' },
  { key: 'packed', label: 'Packed', icon: Box, description: 'Your order is being packed' },
  { key: 'shipped', label: 'Shipped', icon: Package, description: 'Your order is on the way' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'Your order will arrive today' },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck, description: 'Your order has been delivered' },
];

const getStatusIndex = (status: string) => {
  if (status === 'cancelled' || status === 'returned') return -1;
  return statusSteps.findIndex((s) => s.key === status);
};

export default function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  if (!order) return null;

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">Order #{order.order_number}</DialogTitle>
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
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Visual Order Tracking Timeline */}
            {!isCancelled && !isReturned && (
              <div className="bg-accent/30 rounded-xl p-5">
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">Order Status</h4>
                <div className="relative">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const isLast = index === statusSteps.length - 1;

                    return (
                      <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4"
                      >
                        {/* Timeline Connector */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                              isCompleted
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                                : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 h-12 transition-all duration-300 ${
                                index < currentStatusIndex ? 'bg-primary' : 'bg-border'
                              }`}
                            />
                          )}
                        </div>

                        {/* Step Content */}
                        <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                          <p
                            className={`font-medium ${
                              isCompleted ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                          {isCurrent && (
                            <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">
                              Current Status
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancelled/Returned Status */}
            {(isCancelled || isReturned) && (
              <div className={`rounded-xl p-5 ${isCancelled ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
                <div className="flex items-center gap-3">
                  {isCancelled ? (
                    <XCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <RefreshCcw className="h-8 w-8 text-orange-500" />
                  )}
                  <div>
                    <p className={`font-semibold ${isCancelled ? 'text-red-500' : 'text-orange-500'}`}>
                      Order {isCancelled ? 'Cancelled' : 'Returned'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isCancelled
                        ? 'This order has been cancelled'
                        : 'This order has been returned'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking ID */}
            {order.tracking_id && (
              <div className="bg-accent/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Tracking ID</p>
                <p className="font-mono font-medium text-lg">{order.tracking_id}</p>
              </div>
            )}

            {/* Shipping Address */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Address
              </h4>
              <div className="bg-accent/30 p-4 rounded-lg text-sm">
                <p className="font-medium">{order.shipping_address.full_name}</p>
                <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                <p className="mt-2">{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} -{' '}
                  {order.shipping_address.pincode}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items ({order.order_items.length})
              </h4>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 bg-accent/30 p-3 rounded-lg"
                  >
                    <div className="h-16 w-16 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
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
                      <p className="font-medium line-clamp-2">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{Number(item.price).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold text-right">
                      ₹{(item.quantity * Number(item.price)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-accent/30 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{Number(order.subtotal).toLocaleString()}</span>
              </div>
              {order.shipping_cost !== null && order.shipping_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₹{Number(order.shipping_cost).toLocaleString()}</span>
                </div>
              )}
              {order.discount !== null && order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border font-semibold text-lg">
                <span>Total</span>
                <span>₹{Number(order.total).toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Status */}
            <div className="flex items-center justify-between bg-accent/30 p-4 rounded-lg">
              <span className="text-muted-foreground">Payment Status</span>
              <Badge
                className={
                  order.payment_status === 'paid'
                    ? 'bg-green-500/20 text-green-500'
                    : order.payment_status === 'failed'
                    ? 'bg-red-500/20 text-red-500'
                    : order.payment_status === 'refunded'
                    ? 'bg-blue-500/20 text-blue-500'
                    : 'bg-yellow-500/20 text-yellow-500'
                }
              >
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </Badge>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
