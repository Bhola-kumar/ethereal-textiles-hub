import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HomeSection {
  id: string;
  section_key: string;
  section_name: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export function useHomeSections() {
  return useQuery({
    queryKey: ['home-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as HomeSection[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVisibleHomeSections() {
  return useQuery({
    queryKey: ['visible-home-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as HomeSection[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateHomeSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HomeSection> }) => {
      const { data, error } = await supabase
        .from('home_sections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-sections'] });
      queryClient.invalidateQueries({ queryKey: ['visible-home-sections'] });
    },
  });
}

export function useReorderHomeSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sections: { id: string; display_order: number }[]) => {
      const promises = sections.map(({ id, display_order }) =>
        supabase
          .from('home_sections')
          .update({ display_order })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-sections'] });
      queryClient.invalidateQueries({ queryKey: ['visible-home-sections'] });
    },
  });
}
