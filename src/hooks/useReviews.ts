import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each review that has a user_id
      const userIds = reviewsData
        ?.filter(r => r.user_id)
        .map(r => r.user_id) || [];

      let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
        }
      }

      // Merge reviews with profiles
      const reviews: Review[] = (reviewsData || []).map(r => ({
        ...r,
        profiles: r.user_id ? profilesMap[r.user_id] || null : null,
      }));

      return reviews;
    },
    enabled: !!productId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      userId,
      rating,
      comment,
    }: {
      productId: string;
      userId: string;
      rating: number;
      comment: string;
    }) => {
      // Check if user already reviewed this product
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingReview) {
        throw new Error('You have already reviewed this product');
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: userId,
          rating,
          comment: comment || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update product rating and review count
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        await supabase
          .from('products')
          .update({
            rating: Math.round(avgRating * 10) / 10,
            reviews_count: reviews.length,
          })
          .eq('id', productId);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Review submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });
}

export function useUserCanReview(productId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['can-review', productId, userId],
    queryFn: async () => {
      if (!userId) return { canReview: false, hasOrdered: false, hasReviewed: false };

      // Check if user has a delivered order with this product
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          id,
          orders!inner (
            status,
            user_id
          )
        `)
        .eq('product_id', productId)
        .eq('orders.user_id', userId)
        .eq('orders.status', 'delivered');

      const hasOrdered = (orderItems?.length || 0) > 0;

      // Check if user already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle();

      const hasReviewed = !!existingReview;

      return {
        canReview: hasOrdered && !hasReviewed,
        hasOrdered,
        hasReviewed,
      };
    },
    enabled: !!productId && !!userId,
  });
}
