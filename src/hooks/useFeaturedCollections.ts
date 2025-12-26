import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturedCollection {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string;
  link_text: string;
  badge_text: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export function useFeaturedCollections() {
  return useQuery({
    queryKey: ['featured-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_collections')
        .select('*')
        .eq('is_active', true)
        .or('end_date.is.null,end_date.gt.now()')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FeaturedCollection[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllFeaturedCollections() {
  return useQuery({
    queryKey: ['all-featured-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_collections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FeaturedCollection[];
    },
  });
}
