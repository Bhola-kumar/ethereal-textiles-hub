import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type Order = Tables<'orders'> & {
  order_items?: (Tables<'order_items'> & {
    products?: Tables<'products'> | null;
  })[];
};

export function useOrders(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, order_items(*, products(*))');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!orderId,
  });
}

export function useAllOrders(filters?: {
  status?: Tables<'orders'>['status'];
  paymentStatus?: Tables<'orders'>['payment_status'];
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['all-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, order_items(*, products(*))');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: Omit<TablesInsert<'orders'>, 'order_number'>;
      items: Omit<TablesInsert<'order_items'>, 'order_id'>[];
    }) => {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({ ...order, order_number: 'TEMP' })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        ...item,
        order_id: orderData.id,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast.success('Order placed successfully');
    },
    onError: (error) => {
      toast.error('Failed to place order: ' + error.message);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      trackingId 
    }: { 
      orderId: string; 
      status: Tables<'orders'>['status'];
      trackingId?: string;
    }) => {
      const updateData: TablesUpdate<'orders'> = { status };
      if (trackingId) {
        updateData.tracking_id = trackingId;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    },
  });
}
