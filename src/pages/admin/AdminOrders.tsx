import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAllOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Search, Eye, Package, Truck } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

const statusOptions: Tables<'orders'>['status'][] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
];

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: orders = [], isLoading } = useAllOrders(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );
  const updateStatus = useUpdateOrderStatus();

  const filteredOrders = orders.filter(order => 
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusUpdate = (orderId: string, newStatus: Tables<'orders'>['status']) => {
    updateStatus.mutate({ orderId, status: newStatus });
  };

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Orders
          </h1>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Order
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Items
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Total
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Payment
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-foreground">
                            {order.order_number}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {format(new Date(order.created_at), 'PP')}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {order.order_items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          ₹{Number(order.total).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleStatusUpdate(order.id, value as Tables<'orders'>['status'])}
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-500'
                              : order.payment_status === 'failed'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details - {order.order_number}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div>
                                  <h4 className="font-medium mb-2">Shipping Address</h4>
                                  <div className="bg-accent/50 p-4 rounded-lg text-sm">
                                    {typeof order.shipping_address === 'object' && order.shipping_address && (
                                      <>
                                        <p>{(order.shipping_address as any).full_name}</p>
                                        <p>{(order.shipping_address as any).address_line1}</p>
                                        {(order.shipping_address as any).address_line2 && (
                                          <p>{(order.shipping_address as any).address_line2}</p>
                                        )}
                                        <p>
                                          {(order.shipping_address as any).city}, {(order.shipping_address as any).state} - {(order.shipping_address as any).pincode}
                                        </p>
                                        <p>Phone: {(order.shipping_address as any).phone}</p>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {order.order_items?.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center gap-4 bg-accent/50 p-3 rounded-lg"
                                      >
                                        {item.product_image && (
                                          <img
                                            src={item.product_image}
                                            alt={item.product_name}
                                            className="w-12 h-12 object-cover rounded"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <p className="font-medium">{item.product_name}</p>
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

                                <div className="border-t border-border pt-4">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{Number(order.subtotal).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>₹{Number(order.shipping_cost || 0).toLocaleString()}</span>
                                  </div>
                                  {order.discount && Number(order.discount) > 0 && (
                                    <div className="flex justify-between text-sm mb-2">
                                      <span className="text-muted-foreground">Discount</span>
                                      <span className="text-green-500">-₹{Number(order.discount).toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-lg font-bold mt-4">
                                    <span>Total</span>
                                    <span>₹{Number(order.total).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
