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
      
      // Filter and transform to ensure required fields are present
      return (data || [])
        .filter(shop => shop.id && shop.shop_name && shop.shop_slug)
        .map(shop => ({
          id: shop.id!,
          shop_name: shop.shop_name!,
          shop_slug: shop.shop_slug!,
          description: shop.description,
          logo_url: shop.logo_url,
          banner_url: shop.banner_url,
          city: shop.city,
          state: shop.state,
          is_verified: shop.is_verified ?? false,
          is_active: shop.is_active ?? true,
          created_at: shop.created_at ?? new Date().toISOString(),
        })) as PublicShop[];
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
      if (!data || !data.id || !data.shop_name || !data.shop_slug) return null;
      
      return {
        id: data.id,
        shop_name: data.shop_name,
        shop_slug: data.shop_slug,
        description: data.description,
        logo_url: data.logo_url,
        banner_url: data.banner_url,
        city: data.city,
        state: data.state,
        is_verified: data.is_verified ?? false,
        is_active: data.is_active ?? true,
        created_at: data.created_at ?? new Date().toISOString(),
      } as PublicShop;
    },
    enabled: !!shopSlug,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicShopProducts(shopId: string) {
  return useQuery({
    queryKey: ['public-shop-products', shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_with_shop')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });
}
