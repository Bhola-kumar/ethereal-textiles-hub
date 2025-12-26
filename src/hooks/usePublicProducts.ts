import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ProductWithShop = Tables<'products'> & {
  categories?: Tables<'categories'> | null;
  shop_id?: string;
  shop_name?: string;
  shop_slug?: string;
  shop_logo_url?: string | null;
  shop_is_verified?: boolean;
  shop_city?: string | null;
  shop_state?: string | null;
};

// Helper to fetch shop data for products
async function enrichProductsWithShops(products: any[]) {
  if (!products.length) return [];
  
  // Get unique seller IDs
  const sellerIds = [...new Set(products.map(p => p.seller_id).filter(Boolean))];
  
  if (!sellerIds.length) return products;
  
  // Fetch active shops for these sellers
  const { data: shops } = await supabase
    .from('shops')
    .select('id, seller_id, shop_name, shop_slug, logo_url, is_verified, city, state, is_active')
    .in('seller_id', sellerIds)
    .eq('is_active', true);
  
  // Create a map of seller_id to shop
  const shopMap = new Map(shops?.map(s => [s.seller_id, s]) || []);
  
  // Filter products to only include those from active shops and enrich with shop data
  return products
    .filter(p => shopMap.has(p.seller_id))
    .map(product => ({
      ...product,
      shop_id: shopMap.get(product.seller_id)?.id,
      shop_name: shopMap.get(product.seller_id)?.shop_name,
      shop_slug: shopMap.get(product.seller_id)?.shop_slug,
      shop_logo_url: shopMap.get(product.seller_id)?.logo_url,
      shop_is_verified: shopMap.get(product.seller_id)?.is_verified,
      shop_city: shopMap.get(product.seller_id)?.city,
      shop_state: shopMap.get(product.seller_id)?.state,
    }));
}

// Fetch products from active shops only (for customer-facing pages)
export function usePublicProducts(filters?: {
  category?: string;
  fabric?: string;
  color?: string;
  pattern?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['public-products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(*)')
        .eq('is_published', true)
        .not('seller_id', 'is', null);

      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters?.fabric) {
        query = query.eq('fabric', filters.fabric);
      }

      if (filters?.color) {
        query = query.eq('color', filters.color);
      }

      if (filters?.pattern) {
        query = query.eq('pattern', filters.pattern);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      return enrichProductsWithShops(data || []) as Promise<ProductWithShop[]>;
    },
  });
}

// Fetch a single public product by slug
export function usePublicProduct(slug: string) {
  return useQuery({
    queryKey: ['public-product', slug],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      if (!product?.seller_id) throw new Error('Product not found');
      
      // Fetch shop details
      const { data: shop } = await supabase
        .from('shops')
        .select('id, shop_name, shop_slug, logo_url, is_verified, city, state, is_active, upi_id, payment_qr_url, accepts_cod, payment_instructions')
        .eq('seller_id', product.seller_id)
        .eq('is_active', true)
        .single();
      
      if (!shop) throw new Error('Product shop not found');
      
      return {
        ...product,
        shop_id: shop.id,
        shop_name: shop.shop_name,
        shop_slug: shop.shop_slug,
        shop_logo_url: shop.logo_url,
        shop_is_verified: shop.is_verified,
        shop_city: shop.city,
        shop_state: shop.state,
        shop_upi_id: shop.upi_id,
        shop_payment_qr_url: shop.payment_qr_url,
        shop_accepts_cod: shop.accepts_cod,
        shop_payment_instructions: shop.payment_instructions,
      } as ProductWithShop & {
        shop_upi_id?: string | null;
        shop_payment_qr_url?: string | null;
        shop_accepts_cod?: boolean | null;
        shop_payment_instructions?: string | null;
      };
    },
    enabled: !!slug,
  });
}

// Fetch trending products from active shops
export function useTrendingPublicProducts() {
  return useQuery({
    queryKey: ['public-products', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('is_published', true)
        .eq('is_trending', true)
        .not('seller_id', 'is', null)
        .limit(10);

      if (error) throw error;
      
      return enrichProductsWithShops(data || []) as Promise<ProductWithShop[]>;
    },
  });
}

// Fetch new products from active shops
export function useNewPublicProducts() {
  return useQuery({
    queryKey: ['public-products', 'new'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('is_published', true)
        .eq('is_new', true)
        .not('seller_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      return enrichProductsWithShops(data || []) as Promise<ProductWithShop[]>;
    },
  });
}

// Fetch products by shop slug
export function useShopProducts(shopSlug: string) {
  return useQuery({
    queryKey: ['shop-products', shopSlug],
    queryFn: async () => {
      // First get the shop
      const { data: shop } = await supabase
        .from('shops')
        .select('id, seller_id, shop_name, shop_slug, logo_url, is_verified, city, state')
        .eq('shop_slug', shopSlug)
        .eq('is_active', true)
        .single();
      
      if (!shop) return [];
      
      // Then get products for this seller
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('seller_id', shop.seller_id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(product => ({
        ...product,
        shop_id: shop.id,
        shop_name: shop.shop_name,
        shop_slug: shop.shop_slug,
        shop_logo_url: shop.logo_url,
        shop_is_verified: shop.is_verified,
        shop_city: shop.city,
        shop_state: shop.state,
      })) as ProductWithShop[];
    },
    enabled: !!shopSlug,
  });
}
