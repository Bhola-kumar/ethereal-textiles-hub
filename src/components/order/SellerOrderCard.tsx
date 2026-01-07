import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Clock, CheckCircle, Truck, XCircle, CreditCard, RotateCcw, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReturnStatusBadge } from '@/components/order/ReturnStatusBadge';
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

interface SellerOrderCardProps {
  order: Order;
  returnRequest?: ReturnRequest;
}

const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  pending: { color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30', icon: Clock },
  confirmed: { color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: CheckCircle },
  packed: { color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30', icon: Package },
  shipped: { color: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30', icon: Truck },
  out_for_delivery: { color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30', icon: Truck },
  delivered: { color: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30', icon: CheckCircle },
  cancelled: { color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30', icon: XCircle },
  returned: { color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30', icon: RotateCcw },
};

const paymentConfig: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  paid: 'bg-green-500/20 text-green-600 dark:text-green-400',
  failed: 'bg-red-500/20 text-red-600 dark:text-red-400',
  refunded: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
};

export function SellerOrderCard({ order, returnRequest }: SellerOrderCardProps) {
  const navigate = useNavigate();
  const statusInfo = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;
  const needsPaymentVerification = order.status === 'pending' && order.payment_status === 'pending' && order.notes?.includes('UPI');
  const isCOD = order.status === 'pending' && order.notes?.includes('Cash on Delivery');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <Card 
        className="bg-card/50 border-border/50 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all overflow-hidden"
        onClick={() => navigate(`/seller/orders/${order.id}`)}
      >
        <CardContent className="p-3">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{order.order_number}</span>
              <Badge className={`text-xs ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {order.status.replace(/_/g, ' ')}
              </Badge>
              <Badge className={`text-xs ${paymentConfig[order.payment_status]}`}>
                <CreditCard className="h-3 w-3 mr-1" />
                {order.payment_status}
              </Badge>
              {returnRequest && (
                <ReturnStatusBadge 
                  status={returnRequest.status}
                  refundStatus={returnRequest.refund_status}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), 'dd MMM yyyy')}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Alert indicators */}
          {needsPaymentVerification && (
            <div className="mb-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Payment verification required
            </div>
          )}
          {isCOD && (
            <div className="mb-2 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-600 dark:text-green-400">
              💵 Cash on Delivery
            </div>
          )}

          {/* Items Preview - Compact */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item, idx) => (
                <div 
                  key={item.id}
                  className="h-10 w-10 rounded border-2 border-background bg-muted overflow-hidden shrink-0"
                  style={{ zIndex: 3 - idx }}
                >
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="h-10 w-10 rounded border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {order.items[0]?.product_name}
                {order.items.length > 1 && ` + ${order.items.length - 1} more`}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-sm">₹{Number(order.total).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{order.shipping_address?.city}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
