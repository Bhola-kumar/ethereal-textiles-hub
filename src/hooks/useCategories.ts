import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Category = Tables<'categories'>;

export interface CategoryWithCount extends Category {
  product_count: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCategoriesWithProductCount() {
  return useQuery({
    queryKey: ['categories-with-count'],
    queryFn: async () => {
      // Get all categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catError) throw catError;

      // Get product counts per category
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_published', true);

      if (prodError) throw prodError;

      // Count products per category
      const countMap = new Map<string, number>();
      products?.forEach((p) => {
        if (p.category_id) {
          countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
        }
      });

      // Merge counts with categories
      const categoriesWithCount: CategoryWithCount[] = (categories || []).map((cat) => ({
        ...cat,
        product_count: countMap.get(cat.id) || 0,
      }));

      return categoriesWithCount;
    },
    staleTime: 5 * 60 * 1000,
  });
}
