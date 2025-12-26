import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicShop {
  id: string;
  shop_name: string;
  shop_slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  city: string | null;
  state: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export function usePublicShops(limit?: number) {
  return useQuery({
    queryKey: ['public-shops', limit],
    queryFn: async () => {
      let query = supabase
        .from('shops_public')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PublicShop[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicShop(shopSlug: string) {
  return useQuery({
    queryKey: ['public-shop', shopSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops_public')
        .select('*')
        .eq('shop_slug', shopSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as PublicShop | null;
    },
    enabled: !!shopSlug,
    staleTime: 5 * 60 * 1000,
  });
}
