import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWebsiteRating() {
  return useQuery({
    queryKey: ['website-rating'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_ratings')
        .select('rating');

      if (error) throw error;

      const ratings = data || [];
      const total = ratings.length;
      const avg = total > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / total 
        : 0;

      return {
        averageRating: Math.round(avg * 10) / 10,
        totalRatings: total,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewsletterSubscribe() {
  const subscribe = async (email: string) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email });

    if (error) {
      if (error.code === '23505') {
        throw new Error('This email is already subscribed');
      }
      throw error;
    }

    return true;
  };

  return { subscribe };
}