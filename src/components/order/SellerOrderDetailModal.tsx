import { useState } from 'react';
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
  CreditCard,
  FileText,
  MessageCircle,
  RotateCcw,
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReturnStatusBadge } from '@/components/order/ReturnStatusBadge';
import { ReturnRequest } from '@/hooks/useReturnRequests';
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
  notes: string | null;
  tracking_id: string | null;
  decline_reason: string | null;
  declined_at: string | null;
  items: OrderItem[];
}

interface SellerOrderDetailModalProps {
  order: Order | null;
  returnRequest?: ReturnRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOrder: (orderId: string, status: string, paymentStatus: string, trackingId?: string) => Promise<void>;
  onConfirmPayment: (orderId: string) => Promise<void>;
  onDeclineOrder: (order: Order) => void;
  onViewInvoice: (order: Order) => void;
  onOpenChat: (order: Order) => void;
  onHandleReturn: (returnRequest: ReturnRequest) => void;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock, description: 'Order has been placed' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Order confirmed by seller' },
  { key: 'packed', label: 'Packed', icon: Box, description: 'Order is packed and ready' },
  { key: 'shipped', label: 'Shipped', icon: Package, description: 'Order is in transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'Order will arrive soon' },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck, description: 'Order delivered' },
];

const getStatusIndex = (status: string) => {
  if (status === 'cancelled' || status === 'returned') return -1;
  return statusSteps.findIndex((s) => s.key === status);
};

// Get allowed next statuses based on current status (sequential flow)
const getAllowedNextStatuses = (currentStatus: string) => {
  const statusOrder = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  if (currentIndex === -1) return []; // cancelled/returned - no transitions
  
  // Can only go to immediate next status or stay at current
  const allowed = [currentStatus];
  if (currentIndex < statusOrder.length - 1) {
    allowed.push(statusOrder[currentIndex + 1]);
  }
  // Can always cancel from pending/confirmed
  if (currentIndex <= 1) {
    allowed.push('cancelled');
  }
  return allowed;
};

const paymentConfig: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  paid: 'bg-green-500/20 text-green-600 dark:text-green-400',
  failed: 'bg-red-500/20 text-red-600 dark:text-red-400',
  refunded: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
};

export function SellerOrderDetailModal({
  order,
  returnRequest,
  open,
  onOpenChange,
  onUpdateOrder,
  onConfirmPayment,
  onDeclineOrder,
  onViewInvoice,
  onOpenChat,
  onHandleReturn,
}: SellerOrderDetailModalProps) {
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';
  const needsPaymentVerification = order.status === 'pending' && order.payment_status === 'pending' && order.notes?.includes('UPI');
  const isCOD = order.status === 'pending' && order.notes?.includes('Cash on Delivery');
  const allowedStatuses = getAllowedNextStatuses(order.status);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    
    // Validate tracking ID for shipping
    if (newStatus === 'shipped' && !trackingId.trim() && !order.tracking_id) {
      toast.error('Tracking ID is required when shipping');
      return;
    }

    setUpdating(true);
    try {
      await onUpdateOrder(order.id, newStatus, newPaymentStatus || order.payment_status, trackingId || undefined);
      setNewStatus('');
      setTrackingId('');
    } finally {
      setUpdating(false);
    }
  };

  // Get the next logical action based on current status
  const getNextAction = () => {
    switch (order.status) {
      case 'pending':
        if (needsPaymentVerification) {
          return { label: 'Confirm Payment & Accept', action: () => onConfirmPayment(order.id) };
        }
        if (isCOD) {
          return { label: 'Accept Order', action: () => onUpdateOrder(order.id, 'confirmed', order.payment_status) };
        }
        return null;
      case 'confirmed':
        return { label: 'Mark as Packed', action: () => onUpdateOrder(order.id, 'packed', order.payment_status) };
      case 'packed':
        return null; // Needs tracking ID input
      case 'shipped':
        return { label: 'Out for Delivery', action: () => onUpdateOrder(order.id, 'out_for_delivery', order.payment_status) };
      case 'out_for_delivery':
        return { label: 'Mark Delivered', action: () => onUpdateOrder(order.id, 'delivered', 'paid') };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold">{order.order_number}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), 'PPP · h:mm a')}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onViewInvoice(order)}>
                <FileText className="h-4 w-4 mr-1" />
                Invoice
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onOpenChat(order)}>
                <MessageCircle className="h-4 w-4 mr-1" />
                Chat
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-4 pt-2 space-y-4">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={
                order.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                order.status === 'returned' ? 'bg-gray-500/20 text-gray-500' :
                'bg-blue-500/20 text-blue-500'
              }>
                {order.status.replace(/_/g, ' ')}
              </Badge>
              <Badge className={paymentConfig[order.payment_status]}>
                <CreditCard className="h-3 w-3 mr-1" />
                {order.payment_status}
              </Badge>
              {returnRequest && (
                <ReturnStatusBadge status={returnRequest.status} refundStatus={returnRequest.refund_status} />
              )}
            </div>

            {/* Alert Actions */}
            {(needsPaymentVerification || isCOD) && (
              <div className={`p-3 rounded-lg border ${needsPaymentVerification ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <p className={`text-xs font-medium ${needsPaymentVerification ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  {needsPaymentVerification ? '⚠️ UPI Payment - Verify & Accept' : '💵 Cash on Delivery Order'}
                </p>
                {order.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{order.notes}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button variant="default" size="sm" onClick={nextAction?.action}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {needsPaymentVerification ? 'Confirm Payment' : 'Accept Order'}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDeclineOrder(order)}>
                    <XCircle className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {/* Return Request Alert */}
            {returnRequest && returnRequest.status === 'pending' && (
              <div className="p-3 rounded-lg border bg-orange-500/10 border-orange-500/30">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  🔄 Return Request Pending
                </p>
                <p className="text-xs text-muted-foreground mt-1">Reason: {returnRequest.reason}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-orange-600"
                  onClick={() => onHandleReturn(returnRequest)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Handle Return
                </Button>
              </div>
            )}

            {/* Order Tracking Timeline - Compact with Timestamps */}
            {!isCancelled && !isReturned && (
              <div className="bg-accent/30 rounded-lg p-3">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-3">Order Progress</h4>
                <div className="relative">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const isLast = index === statusSteps.length - 1;

                    return (
                      <motion.div
                        key={step.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-3"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-2 ring-primary/30 scale-110' : ''}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-6 ${index < currentStatusIndex ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className={`pb-2 ${isLast ? 'pb-0' : ''}`}>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">Current</span>
                            )}
                          </div>
                          {isCompleted && isCurrent && (
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(order.created_at), 'dd MMM yyyy · h:mm a')}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cancelled/Returned State */}
            {(isCancelled || isReturned) && (
              <div className={`p-3 rounded-lg ${isCancelled ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
                <div className="flex items-center gap-2">
                  {isCancelled ? <XCircle className="h-5 w-5 text-red-500" /> : <RefreshCcw className="h-5 w-5 text-orange-500" />}
                  <div>
                    <p className={`text-sm font-semibold ${isCancelled ? 'text-red-500' : 'text-orange-500'}`}>
                      Order {isCancelled ? 'Cancelled' : 'Returned'}
                    </p>
                    {order.decline_reason && (
                      <p className="text-xs text-muted-foreground">Reason: {order.decline_reason}</p>
                    )}
                    {order.declined_at && (
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(order.declined_at), 'dd MMM yyyy · h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tracking ID */}
            {order.tracking_id && (
              <div className="bg-accent/50 p-2 rounded text-xs">
                <span className="text-muted-foreground">Tracking: </span>
                <span className="font-mono font-medium">{order.tracking_id}</span>
              </div>
            )}

            {/* Items */}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Items ({order.items.length})
              </h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-accent/30 p-2 rounded-lg">
                    <div className="h-12 w-12 rounded bg-secondary/50 overflow-hidden shrink-0">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × ₹{Number(item.price).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">₹{(item.quantity * Number(item.price)).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Delivery Address
              </h4>
              <div className="bg-accent/30 p-2 rounded-lg text-xs">
                <p className="font-medium">{order.shipping_address?.full_name}</p>
                <p className="text-muted-foreground">{order.shipping_address?.phone}</p>
                <p className="mt-1">{order.shipping_address?.address_line1}</p>
                {order.shipping_address?.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-accent/30 p-2 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>₹{Number(order.shipping_cost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border font-semibold text-sm">
                <span>Total</span>
                <span>₹{Number(order.total).toLocaleString()}</span>
              </div>
            </div>

            {/* Status Update Section - Sequential Flow */}
            {!isCancelled && !isReturned && order.status !== 'delivered' && (
              <div className="border-t pt-3 space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Update Status</h4>
                
                {/* Quick Action Button */}
                {nextAction && order.status !== 'packed' && (
                  <Button variant="default" size="sm" className="w-full" onClick={nextAction.action}>
                    {nextAction.label}
                  </Button>
                )}

                {/* For packed status - need tracking ID */}
                {order.status === 'packed' && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Tracking ID <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="Enter shipping tracking number"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      disabled={!trackingId.trim() || updating}
                      onClick={() => onUpdateOrder(order.id, 'shipped', order.payment_status, trackingId)}
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      {updating ? 'Updating...' : 'Ship Order'}
                    </Button>
                  </div>
                )}

                {/* Manual Status Override */}
                <div className="pt-2 border-t">
                  <p className="text-[10px] text-muted-foreground mb-2">Or manually select status:</p>
                  <div className="flex gap-2">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedStatuses.map((status) => (
                          <SelectItem key={status} value={status} className="text-xs">
                            {status.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={!newStatus || newStatus === order.status || updating}
                      onClick={handleStatusUpdate}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
