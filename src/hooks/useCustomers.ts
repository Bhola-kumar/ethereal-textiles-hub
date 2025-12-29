import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  orders_count: number;
  total_spent: number;
}

export function useCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async (): Promise<Customer[]> => {
      // Get all profiles with customer role
      const { data: customerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'customer');

      if (rolesError) {
        console.error('Error fetching customer roles:', rolesError);
        return [];
      }

      if (!customerRoles || customerRoles.length === 0) {
        return [];
      }

      const customerUserIds = customerRoles.map(r => r.user_id);

      // Get profiles for these customers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', customerUserIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Get order stats for each customer
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total')
        .in('user_id', customerUserIds);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }

      // Calculate order stats per customer
      const orderStats = new Map<string, { count: number; total: number }>();
      (orders || []).forEach(order => {
        if (order.user_id) {
          const existing = orderStats.get(order.user_id) || { count: 0, total: 0 };
          orderStats.set(order.user_id, {
            count: existing.count + 1,
            total: existing.total + Number(order.total || 0)
          });
        }
      });

      return (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        orders_count: orderStats.get(profile.user_id)?.count || 0,
        total_spent: orderStats.get(profile.user_id)?.total || 0,
      }));
    },
  });
}
