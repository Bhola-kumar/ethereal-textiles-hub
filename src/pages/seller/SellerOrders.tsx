import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  XCircle,
  AlertCircle,
  RotateCcw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import OrderInvoice from '@/components/order/OrderInvoice';
import { OrderChatModal } from '@/components/order/OrderChatModal';
import { SellerOrderCard } from '@/components/order/SellerOrderCard';
import { SellerOrderDetailModal } from '@/components/order/SellerOrderDetailModal';
import { useUpdateReturnRequest, ReturnRequest } from '@/hooks/useReturnRequests';

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

const declineReasons = [
  'Item not available in stock',
  'Payment amount mismatch',
  'Transaction ID not found',
  'Duplicate order',
  'Customer requested cancellation',
  'Other',
];

const statusOptions = [
  { value: 'all', label: 'All Orders', icon: ShoppingCart },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { value: 'packed', label: 'Packed', icon: Package },
  { value: 'shipped', label: 'Shipped', icon: Truck },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [shopInfo, setShopInfo] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [customDeclineReason, setCustomDeclineReason] = useState('');
  const [chatOrder, setChatOrder] = useState<{ id: string; orderNumber: string } | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [returnResponse, setReturnResponse] = useState<{ status: string; notes: string }>({ status: '', notes: '' });
  const updateReturnRequest = useUpdateReturnRequest();

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchShopInfo();
      fetchReturnRequests();
    }
  }, [user]);

  const fetchReturnRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReturnRequests(data || []);
    } catch (error) {
      console.error('Error fetching return requests:', error);
    }
  };

  const getReturnRequest = (orderId: string) => {
    return returnRequests.find(r => r.order_id === orderId);
  };

  const handleReturnResponse = async () => {
    if (!selectedReturn || !returnResponse.status) return;
    
    try {
      await updateReturnRequest.mutateAsync({
        id: selectedReturn.id,
        status: returnResponse.status,
        admin_notes: returnResponse.notes || undefined,
        refund_status: returnResponse.status === 'approved' ? 'processing' : 
                       returnResponse.status === 'completed' ? 'processed' : undefined,
      });
      
      setShowReturnDialog(false);
      setSelectedReturn(null);
      setReturnResponse({ status: '', notes: '' });
      fetchReturnRequests();
    } catch (error) {
      console.error('Error updating return request:', error);
    }
  };

  const fetchShopInfo = async () => {
    const { data } = await supabase
      .from('shops')
      .select('shop_name, address, city, state, pincode, phone, email, gst_number')
      .eq('seller_id', user!.id)
      .single();
    
    if (data) setShopInfo(data);
  };

  const fetchOrders = async () => {
    try {
      const { data: sellerProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user!.id);

      const productIds = sellerProducts?.map(p => p.id) || [];

      if (productIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

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
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const orderMap = new Map<string, Order>();
      orderItems?.forEach(item => {
        const order = item.orders as any;
        if (!orderMap.has(order.id)) {
          orderMap.set(order.id, {
            ...order,
            items: [],
          });
        }
        orderMap.get(order.id)!.items.push({
          id: item.id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          price: Number(item.price),
        });
      });

      const ordersArray = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(ordersArray);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId: string, status: string, paymentStatus: string, trackingId?: string) => {
    setUpdatingOrder(true);
    try {
      const updates: any = {
        status,
        payment_status: paymentStatus,
      };

      if (trackingId?.trim()) {
        updates.tracking_id = trackingId.trim();
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order updated successfully');
      setShowDetailModal(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order');
    } finally {
      setUpdatingOrder(false);
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed'
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Payment confirmed and order accepted');
      setShowDetailModal(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm payment');
    }
  };

  const handleDeclineOrder = async () => {
    if (!selectedOrder) return;

    const finalReason = declineReason === 'Other' ? customDeclineReason : declineReason;
    if (!finalReason) {
      toast.error('Please select or enter a reason for declining');
      return;
    }

    setUpdatingOrder(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          payment_status: 'refunded',
          decline_reason: finalReason,
          declined_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast.success('Order declined');
      setShowDeclineDialog(false);
      setShowDetailModal(false);
      setDeclineReason('');
      setCustomDeclineReason('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline order');
    } finally {
      setUpdatingOrder(false);
    }
  };

  const filteredOrders = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => 
      !searchQuery || 
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(item => item.product_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => ['confirmed', 'packed'].includes(o.status)).length,
      shipped: orders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length,
      delivered: orders.filter(o => o.status === 'delivered').length,
    };
  };

  const stats = getOrderStats();
  const ordersNeedingAction = orders.filter(
    o => (o.status === 'pending' && o.payment_status === 'pending') || 
         returnRequests.some(r => r.order_id === o.id && r.status === 'pending')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground">Orders</h1>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search orders..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Required Alert */}
        {ordersNeedingAction.length > 0 && (
          <Card className="mb-4 border-amber-500/50 bg-amber-500/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <span className="font-medium">{ordersNeedingAction.length}</span> order(s) need your attention
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Stats */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { label: 'Total', value: stats.total, icon: ShoppingCart },
            { label: 'Pending', value: stats.pending, icon: Clock },
            { label: 'Processing', value: stats.processing, icon: Package },
            { label: 'Shipped', value: stats.shipped, icon: Truck },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/50 border-border/50">
              <CardContent className="p-2 flex flex-col items-center">
                <stat.icon className="h-4 w-4 text-muted-foreground mb-1" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Orders List - Compact Cards */}
        {filteredOrders.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-8 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <SellerOrderCard
                key={order.id}
                order={order}
                returnRequest={getReturnRequest(order.id)}
                onClick={() => {
                  setSelectedOrder(order);
                  setShowDetailModal(true);
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Order Detail Modal */}
      <SellerOrderDetailModal
        order={selectedOrder}
        returnRequest={selectedOrder ? getReturnRequest(selectedOrder.id) : undefined}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onUpdateOrder={handleUpdateOrder}
        onConfirmPayment={handleConfirmPayment}
        onDeclineOrder={(order) => {
          setSelectedOrder(order);
          setShowDeclineDialog(true);
        }}
        onViewInvoice={(order) => setInvoiceOrder(order)}
        onOpenChat={(order) => setChatOrder({ id: order.id, orderNumber: order.order_number })}
        onHandleReturn={(returnReq) => {
          setSelectedReturn(returnReq);
          setShowReturnDialog(true);
        }}
      />

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

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeclineOrder}
              disabled={updatingOrder || (!declineReason || (declineReason === 'Other' && !customDeclineReason))}
            >
              {updatingOrder ? 'Declining...' : 'Decline Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <OrderInvoice
          order={{
            id: invoiceOrder.id,
            order_number: invoiceOrder.order_number,
            created_at: invoiceOrder.created_at,
            status: invoiceOrder.status,
            payment_status: invoiceOrder.payment_status,
            subtotal: invoiceOrder.subtotal,
            shipping_cost: invoiceOrder.shipping_cost,
            total: invoiceOrder.total,
            shipping_address: invoiceOrder.shipping_address,
            notes: invoiceOrder.notes,
            tracking_id: invoiceOrder.tracking_id,
            items: invoiceOrder.items,
          }}
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

      {/* Handle Return Request Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="h-4 w-4 text-orange-500" />
              Handle Return Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-3 py-2">
              <div className="bg-accent/30 p-2 rounded text-xs">
                <p className="font-medium">Reason: {selectedReturn.reason}</p>
                {selectedReturn.description && (
                  <p className="text-muted-foreground mt-1">{selectedReturn.description}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Decision</Label>
                <Select value={returnResponse.status} onValueChange={(v) => setReturnResponse(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved" className="text-sm">Approve Return</SelectItem>
                    <SelectItem value="rejected" className="text-sm">Reject Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Notes (Optional)</Label>
                <Input
                  placeholder="Add notes..."
                  value={returnResponse.notes}
                  onChange={(e) => setReturnResponse(prev => ({ ...prev, notes: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowReturnDialog(false)}>
              Cancel
            </Button>
            <Button 
              size="sm"
              disabled={!returnResponse.status || updateReturnRequest.isPending}
              onClick={handleReturnResponse}
            >
              {updateReturnRequest.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
