import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductWithShop } from './usePublicProducts';

export interface FeaturedProductEntry {
  id: string;
  product_id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  display_order: number;
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async (): Promise<ProductWithShop[]> => {
      // Fetch active featured products
      const { data: featuredEntries, error: featuredError } = await supabase
        .from('featured_products')
        .select('product_id, display_order')
        .eq('is_active', true)
        .or('end_date.is.null,end_date.gt.now()')
        .order('display_order', { ascending: true });

      if (featuredError) {
        console.error('Error fetching featured products:', featuredError);
        return [];
      }

      if (!featuredEntries || featuredEntries.length === 0) {
        return [];
      }

      const productIds = featuredEntries.map(f => f.product_id);

      // Fetch product details from the public view
      const { data: products, error: productsError } = await supabase
        .from('products_with_shop')
        .select('*')
        .in('id', productIds);

      if (productsError) {
        console.error('Error fetching product details:', productsError);
        return [];
      }

      if (!products) return [];

      // Sort products by the display_order from featured_products
      const orderMap = new Map(featuredEntries.map(f => [f.product_id, f.display_order]));
      
      const sortedProducts = products.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999;
        const orderB = orderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });

      return sortedProducts.map(p => ({
        id: p.id!,
        name: p.name!,
        slug: p.slug!,
        description: p.description,
        price: p.price!,
        original_price: p.original_price,
        images: p.images,
        category_id: p.category_id,
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
        seller_id: p.seller_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
        length: p.length,
        width: p.width,
        gsm: p.gsm,
        size: p.size,
        available_colors: p.available_colors,
        available_sizes: p.available_sizes,
        shop_id: p.shop_id,
        shop_name: p.shop_name,
        shop_slug: p.shop_slug,
        shop_logo_url: p.shop_logo_url,
        shop_is_verified: p.shop_is_verified,
        shop_city: p.shop_city,
        shop_state: p.shop_state,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}