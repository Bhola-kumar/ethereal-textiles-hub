import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ProductWithShop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  images: string[] | null;
  fabric: string | null;
  color: string | null;
  pattern: string | null;
  care_instructions: string[] | null;
  stock: number;
  is_published: boolean | null;
  is_new: boolean | null;
  is_trending: boolean | null;
  rating: number | null;
  reviews_count: number | null;
  category_id: string | null;
  seller_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: Tables<'categories'> | null;
  shop_id?: string | null;
  shop_name?: string | null;
  shop_slug?: string | null;
  shop_logo_url?: string | null;
  shop_is_verified?: boolean | null;
  shop_city?: string | null;
  shop_state?: string | null;
};

// Fetch products from active shops only (for customer-facing pages)
// Uses the products_with_shop view which automatically filters for active shops
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
        .from('products_with_shop')
        .select('*')
        .eq('is_published', true);

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
      
      // Map view columns to our ProductWithShop type
      return (data || []).map(p => ({
        id: p.id!,
        name: p.name!,
        slug: p.slug!,
        description: p.description,
        price: p.price!,
        original_price: p.original_price,
        images: p.images,
        fabric: p.fabric,
        color: p.color,
        pattern: p.pattern,
        care_instructions: p.care_instructions,
        stock: p.stock!,
        is_published: p.is_published,
        is_new: p.is_new,
        is_trending: p.is_trending,
        rating: p.rating,
        reviews_count: p.reviews_count,
        category_id: p.category_id,
        seller_id: p.seller_id,
        created_at: p.created_at!,
        updated_at: p.updated_at!,
        shop_id: p.shop_id,
        shop_name: p.shop_name,
        shop_slug: p.shop_slug,
        shop_logo_url: p.shop_logo_url,
        shop_is_verified: p.shop_is_verified,
        shop_city: p.shop_city,
        shop_state: p.shop_state,
      })) as ProductWithShop[];
    },
  });
}

// Fetch a single public product by slug
export function usePublicProduct(slug: string) {
  return useQuery({
    queryKey: ['public-product', slug],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from('products_with_shop')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      if (!product?.shop_id) throw new Error('Product not found or shop is not active');
      
      // For single product, also fetch payment info from the shop
      // Only sellers can see their own shop's sensitive data, so we use shops_public for general info
      // Payment info needs to be fetched separately using the seller_id
      const { data: shop } = await supabase
        .from('shops')
        .select('upi_id, payment_qr_url, accepts_cod, payment_instructions')
        .eq('id', product.shop_id)
        .single();
      
      return {
        id: product.id!,
        name: product.name!,
        slug: product.slug!,
        description: product.description,
        price: product.price!,
        original_price: product.original_price,
        images: product.images,
        fabric: product.fabric,
        color: product.color,
        pattern: product.pattern,
        care_instructions: product.care_instructions,
        stock: product.stock!,
        is_published: product.is_published,
        is_new: product.is_new,
        is_trending: product.is_trending,
        rating: product.rating,
        reviews_count: product.reviews_count,
        category_id: product.category_id,
        seller_id: product.seller_id,
        created_at: product.created_at!,
        updated_at: product.updated_at!,
        shop_id: product.shop_id,
        shop_name: product.shop_name,
        shop_slug: product.shop_slug,
        shop_logo_url: product.shop_logo_url,
        shop_is_verified: product.shop_is_verified,
        shop_city: product.shop_city,
        shop_state: product.shop_state,
        shop_upi_id: shop?.upi_id || null,
        shop_payment_qr_url: shop?.payment_qr_url || null,
        shop_accepts_cod: shop?.accepts_cod ?? true,
        shop_payment_instructions: shop?.payment_instructions || null,
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
        .from('products_with_shop')
        .select('*')
        .eq('is_published', true)
        .eq('is_trending', true)
        .limit(10);

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id!,
        name: p.name!,
        slug: p.slug!,
        description: p.description,
        price: p.price!,
        original_price: p.original_price,
        images: p.images,
        fabric: p.fabric,
        color: p.color,
        pattern: p.pattern,
        care_instructions: p.care_instructions,
        stock: p.stock!,
        is_published: p.is_published,
        is_new: p.is_new,
        is_trending: p.is_trending,
        rating: p.rating,
        reviews_count: p.reviews_count,
        category_id: p.category_id,
        seller_id: p.seller_id,
        created_at: p.created_at!,
        updated_at: p.updated_at!,
        shop_id: p.shop_id,
        shop_name: p.shop_name,
        shop_slug: p.shop_slug,
        shop_logo_url: p.shop_logo_url,
        shop_is_verified: p.shop_is_verified,
        shop_city: p.shop_city,
        shop_state: p.shop_state,
      })) as ProductWithShop[];
    },
  });
}

// Fetch new products from active shops
export function useNewPublicProducts() {
  return useQuery({
    queryKey: ['public-products', 'new'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_with_shop')
        .select('*')
        .eq('is_published', true)
        .eq('is_new', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id!,
        name: p.name!,
        slug: p.slug!,
        description: p.description,
        price: p.price!,
        original_price: p.original_price,
        images: p.images,
        fabric: p.fabric,
        color: p.color,
        pattern: p.pattern,
        care_instructions: p.care_instructions,
        stock: p.stock!,
        is_published: p.is_published,
        is_new: p.is_new,
        is_trending: p.is_trending,
        rating: p.rating,
        reviews_count: p.reviews_count,
        category_id: p.category_id,
        seller_id: p.seller_id,
        created_at: p.created_at!,
        updated_at: p.updated_at!,
        shop_id: p.shop_id,
        shop_name: p.shop_name,
        shop_slug: p.shop_slug,
        shop_logo_url: p.shop_logo_url,
        shop_is_verified: p.shop_is_verified,
        shop_city: p.shop_city,
        shop_state: p.shop_state,
      })) as ProductWithShop[];
    },
  });
}

// Fetch products by shop slug
export function useShopProducts(shopSlug: string) {
  return useQuery({
    queryKey: ['shop-products', shopSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_with_shop')
        .select('*')
        .eq('shop_slug', shopSlug)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id!,
        name: p.name!,
        slug: p.slug!,
        description: p.description,
        price: p.price!,
        original_price: p.original_price,
        images: p.images,
        fabric: p.fabric,
        color: p.color,
        pattern: p.pattern,
        care_instructions: p.care_instructions,
        stock: p.stock!,
        is_published: p.is_published,
        is_new: p.is_new,
        is_trending: p.is_trending,
        rating: p.rating,
        reviews_count: p.reviews_count,
        category_id: p.category_id,
        seller_id: p.seller_id,
        created_at: p.created_at!,
        updated_at: p.updated_at!,
        shop_id: p.shop_id,
        shop_name: p.shop_name,
        shop_slug: p.shop_slug,
        shop_logo_url: p.shop_logo_url,
        shop_is_verified: p.shop_is_verified,
        shop_city: p.shop_city,
        shop_state: p.shop_state,
      })) as ProductWithShop[];
    },
    enabled: !!shopSlug,
  });
}
