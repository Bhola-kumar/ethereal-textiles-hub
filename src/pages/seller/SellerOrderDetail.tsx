import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ReturnStatusBadge } from '@/components/order/ReturnStatusBadge';
import { ReturnRequest, useUpdateReturnRequest } from '@/hooks/useReturnRequests';
import OrderInvoice from '@/components/order/OrderInvoice';
import { OrderChatModal } from '@/components/order/OrderChatModal';
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

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Clock, description: 'Order has been placed' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Order confirmed by seller' },
  { key: 'packed', label: 'Packed', icon: Box, description: 'Order is packed and ready' },
  { key: 'shipped', label: 'Shipped', icon: Package, description: 'Order is in transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'Order will arrive soon' },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck, description: 'Order delivered' },
];

const declineReasons = [
  'Item not available in stock',
  'Payment amount mismatch',
  'Transaction ID not found',
  'Duplicate order',
  'Customer requested cancellation',
  'Other',
];

const getStatusIndex = (status: string) => {
  if (status === 'cancelled' || status === 'returned') return -1;
  return statusSteps.findIndex((s) => s.key === status);
};

const getAllowedNextStatuses = (currentStatus: string) => {
  const statusOrder = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  if (currentIndex === -1) return [];
  
  const allowed = [currentStatus];
  if (currentIndex < statusOrder.length - 1) {
    allowed.push(statusOrder[currentIndex + 1]);
  }
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

export default function SellerOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [customDeclineReason, setCustomDeclineReason] = useState('');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [chatOrder, setChatOrder] = useState<{ id: string; orderNumber: string } | null>(null);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnResponse, setReturnResponse] = useState<{ status: string; notes: string }>({ status: '', notes: '' });
  const updateReturnRequest = useUpdateReturnRequest();

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
      fetchShopInfo();
    }
  }, [user, orderId]);

  const fetchShopInfo = async () => {
    const { data } = await supabase
      .from('shops')
      .select('shop_name, address, city, state, pincode, phone, email, gst_number')
      .eq('seller_id', user!.id)
      .single();
    
    if (data) setShopInfo(data);
  };

  const fetchOrder = async () => {
    try {
      // Get seller products first
      const { data: sellerProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user!.id);

      const productIds = sellerProducts?.map(p => p.id) || [];

      if (productIds.length === 0) {
        navigate('/seller/orders');
        return;
      }

      // Fetch order items for this order that belong to seller
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
        .eq('order_id', orderId)
        .in('product_id', productIds);

      if (error) throw error;

      if (!orderItems || orderItems.length === 0) {
        toast.error('Order not found or access denied');
        navigate('/seller/orders');
        return;
      }

      const orderData = orderItems[0].orders as any;
      const items = orderItems.map(item => ({
        id: item.id,
        product_name: item.product_name,
        product_image: item.product_image,
        quantity: item.quantity,
        price: Number(item.price),
      }));

      setOrder({
        ...orderData,
        items,
      });

      // Fetch return request
      const { data: returnData } = await supabase
        .from('return_requests')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (returnData) setReturnRequest(returnData);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (status: string, paymentStatus: string, trackingIdValue?: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const updates: any = {
        status,
        payment_status: paymentStatus,
      };

      if (trackingIdValue?.trim()) {
        updates.tracking_id = trackingIdValue.trim();
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Order updated successfully');
      fetchOrder();
      setNewStatus('');
      setTrackingId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed'
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Payment confirmed and order accepted');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm payment');
    }
  };

  const handleDeclineOrder = async () => {
    if (!order) return;

    const finalReason = declineReason === 'Other' ? customDeclineReason : declineReason;
    if (!finalReason) {
      toast.error('Please select or enter a reason for declining');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          payment_status: 'refunded',
          decline_reason: finalReason,
          declined_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Order declined');
      setShowDeclineDialog(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline order');
    } finally {
      setUpdating(false);
    }
  };

  const handleReturnResponse = async () => {
    if (!returnRequest || !returnResponse.status) return;
    
    try {
      await updateReturnRequest.mutateAsync({
        id: returnRequest.id,
        status: returnResponse.status,
        admin_notes: returnResponse.notes || undefined,
        refund_status: returnResponse.status === 'approved' ? 'processing' : 
                       returnResponse.status === 'completed' ? 'processed' : undefined,
      });
      
      setShowReturnDialog(false);
      setReturnResponse({ status: '', notes: '' });
      fetchOrder();
    } catch (error) {
      console.error('Error updating return request:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Order not found</p>
        <Button variant="ghost" onClick={() => navigate('/seller/orders')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';
  const needsPaymentVerification = order.status === 'pending' && order.payment_status === 'pending' && order.notes?.includes('UPI');
  const isCOD = order.status === 'pending' && order.notes?.includes('Cash on Delivery');
  const allowedStatuses = getAllowedNextStatuses(order.status);

  const getNextAction = () => {
    switch (order.status) {
      case 'pending':
        if (needsPaymentVerification) {
          return { label: 'Confirm Payment & Accept', action: () => handleConfirmPayment() };
        }
        if (isCOD) {
          return { label: 'Accept Order', action: () => handleUpdateOrder('confirmed', order.payment_status) };
        }
        return null;
      case 'confirmed':
        return { label: 'Mark as Packed', action: () => handleUpdateOrder('packed', order.payment_status) };
      case 'packed':
        return null;
      case 'shipped':
        return { label: 'Out for Delivery', action: () => handleUpdateOrder('out_for_delivery', order.payment_status) };
      case 'out_for_delivery':
        return { label: 'Mark Delivered', action: () => handleUpdateOrder('delivered', 'paid') };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/seller/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-display font-bold">{order.order_number}</h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(order.created_at), 'PPP · h:mm a')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setInvoiceOrder(order)}>
              <FileText className="h-4 w-4 mr-1" />
              Invoice
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChatOrder({ id: order.id, orderNumber: order.order_number })}>
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Status Badges */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3">
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
              </CardContent>
            </Card>

            {/* Alert Actions */}
            {(needsPaymentVerification || isCOD) && (
              <Card className={`border ${needsPaymentVerification ? 'border-amber-500/50 bg-amber-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
                <CardContent className="p-3">
                  <p className={`text-sm font-medium ${needsPaymentVerification ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                    {needsPaymentVerification ? '⚠️ UPI Payment - Verify & Accept' : '💵 Cash on Delivery Order'}
                  </p>
                  {order.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{order.notes}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button variant="default" size="sm" onClick={nextAction?.action}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {needsPaymentVerification ? 'Confirm Payment' : 'Accept Order'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setShowDeclineDialog(true)}>
                      <XCircle className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Return Request Alert */}
            {returnRequest && returnRequest.status === 'pending' && (
              <Card className="border-orange-500/50 bg-orange-500/10">
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    🔄 Return Request Pending
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Reason: {returnRequest.reason}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-orange-600"
                    onClick={() => setShowReturnDialog(true)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Handle Return
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Order Tracking Timeline */}
            {!isCancelled && !isReturned && (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">Order Progress</h4>
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
                          className="flex gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isCompleted
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              } ${isCurrent ? 'ring-2 ring-primary/30 scale-110' : ''}`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 h-8 ${index < currentStatusIndex ? 'bg-primary' : 'bg-border'}`} />
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
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                            {isCompleted && isCurrent && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {format(new Date(order.created_at), 'dd MMM yyyy · h:mm a')}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancelled/Returned State */}
            {(isCancelled || isReturned) && (
              <Card className={isCancelled ? 'bg-red-500/10' : 'bg-orange-500/10'}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {isCancelled ? <XCircle className="h-6 w-6 text-red-500" /> : <RefreshCcw className="h-6 w-6 text-orange-500" />}
                    <div>
                      <p className={`text-base font-semibold ${isCancelled ? 'text-red-500' : 'text-orange-500'}`}>
                        Order {isCancelled ? 'Cancelled' : 'Returned'}
                      </p>
                      {order.decline_reason && (
                        <p className="text-sm text-muted-foreground">Reason: {order.decline_reason}</p>
                      )}
                      {order.declined_at && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.declined_at), 'dd MMM yyyy · h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  Items to Deliver ({order.items.length})
                </h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-accent/30 p-3 rounded-lg">
                      <div className="h-14 w-14 rounded bg-secondary/50 overflow-hidden shrink-0">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ₹{Number(item.price).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">₹{(item.quantity * Number(item.price)).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Details */}
          <div className="space-y-4">
            {/* Status Update */}
            {!isCancelled && !isReturned && order.status !== 'delivered' && (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Update Status</h4>
                  
                  {nextAction && order.status !== 'packed' && (
                    <Button variant="default" size="sm" className="w-full" onClick={nextAction.action}>
                      {nextAction.label}
                    </Button>
                  )}

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
                        onClick={() => handleUpdateOrder('shipped', order.payment_status, trackingId)}
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        {updating ? 'Updating...' : 'Ship Order'}
                      </Button>
                    </div>
                  )}

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
                        onClick={() => handleUpdateOrder(newStatus, order.payment_status)}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tracking ID */}
            {order.tracking_id && (
              <Card className="bg-accent/50">
                <CardContent className="p-3 text-sm">
                  <span className="text-muted-foreground">Tracking: </span>
                  <span className="font-mono font-medium">{order.tracking_id}</span>
                </CardContent>
              </Card>
            )}

            {/* Shipping Address */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Delivery Address
                </h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shipping_address?.full_name}</p>
                  <p className="text-muted-foreground">{order.shipping_address?.phone}</p>
                  <p>{order.shipping_address?.address_line1}</p>
                  {order.shipping_address?.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                  <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-sm space-y-2">
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Order Summary</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>₹{Number(order.shipping_cost || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-semibold text-base">
                  <span>Total</span>
                  <span>₹{Number(order.total).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            {order.notes && (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>

      {/* Decline Order Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive text-base">Decline Order</DialogTitle>
            <DialogDescription className="text-xs">
              This will cancel the order and notify the customer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Reason for Declining</Label>
              <Select value={declineReason} onValueChange={setDeclineReason}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {declineReasons.map(reason => (
                    <SelectItem key={reason} value={reason} className="text-sm">{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {declineReason === 'Other' && (
              <div className="space-y-1">
                <Label className="text-xs">Custom Reason</Label>
                <Input
                  placeholder="Enter reason"
                  value={customDeclineReason}
                  onChange={(e) => setCustomDeclineReason(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              disabled={updating || (!declineReason || (declineReason === 'Other' && !customDeclineReason))}
              onClick={handleDeclineOrder}
            >
              {updating ? 'Declining...' : 'Decline Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Handle Return Request</DialogTitle>
            <DialogDescription className="text-xs">
              Review and respond to the customer's return request.
            </DialogDescription>
          </DialogHeader>

          {returnRequest && (
            <div className="space-y-3 py-2">
              <div className="bg-muted/50 p-2 rounded text-xs">
                <p><strong>Reason:</strong> {returnRequest.reason}</p>
                {returnRequest.description && <p className="mt-1">{returnRequest.description}</p>}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Action</Label>
                <Select value={returnResponse.status} onValueChange={(v) => setReturnResponse(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved" className="text-sm">Approve Return</SelectItem>
                    <SelectItem value="rejected" className="text-sm">Reject Return</SelectItem>
                    <SelectItem value="completed" className="text-sm">Mark as Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes..."
                  value={returnResponse.notes}
                  onChange={(e) => setReturnResponse(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-16 text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button 
              size="sm"
              disabled={!returnResponse.status || updateReturnRequest.isPending}
              onClick={handleReturnResponse}
            >
              {updateReturnRequest.isPending ? 'Updating...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice */}
      {invoiceOrder && shopInfo && (
        <OrderInvoice
          order={invoiceOrder as any}
          shopInfo={shopInfo}
          open={!!invoiceOrder}
          onOpenChange={(open) => !open && setInvoiceOrder(null)}
        />
      )}

      {/* Chat Modal */}
      {chatOrder && (
        <OrderChatModal
          isOpen={!!chatOrder}
          onClose={() => setChatOrder(null)}
          orderId={chatOrder.id}
          orderNumber={chatOrder.orderNumber}
          userType="seller"
        />
      )}
    </div>
  );
}
