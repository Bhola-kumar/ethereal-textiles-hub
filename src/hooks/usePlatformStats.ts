import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  totalProducts: number;
  totalShops: number;
  totalOrders: number;
  avgRating: number;
}

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      // Fetch multiple counts in parallel
      const [productsRes, shopsRes, ordersRes, reviewsRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('shops_public').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('rating')
      ]);

      const totalProducts = productsRes.count || 0;
      const totalShops = shopsRes.count || 0;
      const totalOrders = ordersRes.count || 0;
      
      // Calculate average rating
      const reviews = reviewsRes.data || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
        : 0;

      return {
        totalProducts,
        totalShops,
        totalOrders,
        avgRating: Math.round(avgRating * 10) / 10,
      } as PlatformStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
