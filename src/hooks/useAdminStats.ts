import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export interface AdminStats {
  totalRevenue: number;
  previousRevenue: number;
  totalOrders: number;
  previousOrders: number;
  totalProducts: number;
  previousProducts: number;
  totalCustomers: number;
  previousCustomers: number;
  totalSellers: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  unpaidOrders: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const now = new Date();
      const last30Days = subDays(now, 30);
      const previous30Days = subDays(now, 60);

      // Fetch all orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, status, payment_status, created_at');

      if (ordersError) throw ordersError;

      // Fetch products count
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      if (productsError) throw productsError;

      // Fetch products created in last 30 days
      const { count: newProducts, error: newProductsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last30Days.toISOString());

      if (newProductsError) throw newProductsError;

      // Fetch products created in previous 30 days (30-60 days ago)
      const { count: prevProducts, error: prevProductsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', previous30Days.toISOString())
        .lt('created_at', last30Days.toISOString());

      if (prevProductsError) throw prevProductsError;

      // Fetch unique customers (users who have placed orders)
      const { data: customersData, error: customersError } = await supabase
        .from('orders')
        .select('user_id');

      if (customersError) throw customersError;

      const uniqueCustomers = new Set(customersData?.map(o => o.user_id).filter(Boolean));

      // Fetch customers from last 30 days
      const { data: newCustomersData, error: newCustomersError } = await supabase
        .from('orders')
        .select('user_id')
        .gte('created_at', last30Days.toISOString());

      if (newCustomersError) throw newCustomersError;

      const newCustomers = new Set(newCustomersData?.map(o => o.user_id).filter(Boolean));

      // Fetch customers from previous 30 days
      const { data: prevCustomersData, error: prevCustomersError } = await supabase
        .from('orders')
        .select('user_id')
        .gte('created_at', previous30Days.toISOString())
        .lt('created_at', last30Days.toISOString());

      if (prevCustomersError) throw prevCustomersError;

      const prevCustomers = new Set(prevCustomersData?.map(o => o.user_id).filter(Boolean));

      // Fetch sellers count
      const { count: totalSellers, error: sellersError } = await supabase
        .from('shops')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (sellersError) throw sellersError;

      // Calculate revenue and order stats
      const orders = allOrders || [];
      
      const currentPeriodOrders = orders.filter(
        o => new Date(o.created_at) >= last30Days
      );
      const previousPeriodOrders = orders.filter(
        o => new Date(o.created_at) >= previous30Days && new Date(o.created_at) < last30Days
      );

      const totalRevenue = orders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const currentRevenue = currentPeriodOrders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const previousRevenue = previousPeriodOrders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const paidOrders = orders.filter(o => o.payment_status === 'paid').length;
      const unpaidOrders = orders.filter(o => o.payment_status === 'pending').length;

      return {
        totalRevenue,
        previousRevenue,
        totalOrders: orders.length,
        previousOrders: previousPeriodOrders.length,
        totalProducts: totalProducts || 0,
        previousProducts: prevProducts || 0,
        totalCustomers: uniqueCustomers.size,
        previousCustomers: prevCustomers.size,
        totalSellers: totalSellers || 0,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        paidOrders,
        unpaidOrders,
      } as AdminStats;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function calculateTrend(current: number, previous: number): { value: string; isUp: boolean } {
  if (previous === 0) {
    return { value: current > 0 ? '+100%' : '0%', isUp: current > 0 };
  }
  
  const change = ((current - previous) / previous) * 100;
  const formatted = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  
  return { value: formatted, isUp: change >= 0 };
}
