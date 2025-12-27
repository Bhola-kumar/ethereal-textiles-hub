import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string | null;
  is_seller: boolean;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

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
  replies?: ReviewReply[];
  likes_count?: number;
  user_has_liked?: boolean;
}

export function useProductReviews(productId: string, currentUserId?: string) {
  return useQuery({
    queryKey: ['reviews', productId, currentUserId],
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

      // Fetch replies for all reviews
      const reviewIds = reviewsData?.map(r => r.id) || [];
      let repliesMap: Record<string, ReviewReply[]> = {};
      
      if (reviewIds.length > 0) {
        const { data: repliesData } = await supabase
          .from('review_replies')
          .select('*')
          .in('review_id', reviewIds)
          .order('created_at', { ascending: true });

        if (repliesData && repliesData.length > 0) {
          // Get profiles for reply authors
          const replyUserIds = repliesData.filter(r => r.user_id).map(r => r.user_id);
          let replyProfilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
          
          if (replyUserIds.length > 0) {
            const { data: replyProfiles } = await supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url')
              .in('user_id', replyUserIds);

            if (replyProfiles) {
              replyProfilesMap = replyProfiles.reduce((acc, p) => {
                acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
                return acc;
              }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
            }
          }

          repliesData.forEach(reply => {
            if (!repliesMap[reply.review_id]) {
              repliesMap[reply.review_id] = [];
            }
            repliesMap[reply.review_id].push({
              ...reply,
              profiles: reply.user_id ? replyProfilesMap[reply.user_id] || null : null,
            });
          });
        }
      }

      // Fetch likes count and user's like status
      let likesMap: Record<string, { count: number; userLiked: boolean }> = {};
      
      if (reviewIds.length > 0) {
        const { data: likesData } = await supabase
          .from('review_likes')
          .select('review_id, user_id')
          .in('review_id', reviewIds);

        if (likesData) {
          likesData.forEach(like => {
            if (!likesMap[like.review_id]) {
              likesMap[like.review_id] = { count: 0, userLiked: false };
            }
            likesMap[like.review_id].count++;
            if (currentUserId && like.user_id === currentUserId) {
              likesMap[like.review_id].userLiked = true;
            }
          });
        }
      }

      // Merge reviews with profiles, replies, and likes
      const reviews: Review[] = (reviewsData || []).map(r => ({
        ...r,
        profiles: r.user_id ? profilesMap[r.user_id] || null : null,
        replies: repliesMap[r.id] || [],
        likes_count: likesMap[r.id]?.count || 0,
        user_has_liked: likesMap[r.id]?.userLiked || false,
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

export function useCreateReviewReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      userId,
      content,
      isSeller,
      productId,
    }: {
      reviewId: string;
      userId: string;
      content: string;
      isSeller: boolean;
      productId: string;
    }) => {
      const { data, error } = await supabase
        .from('review_replies')
        .insert({
          review_id: reviewId,
          user_id: userId,
          content,
          is_seller: isSeller,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, productId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', result.productId] });
      toast.success('Reply posted successfully!');
    },
    onError: () => {
      toast.error('Failed to post reply');
    },
  });
}

export function useToggleReviewLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      userId,
      isLiked,
      productId,
    }: {
      reviewId: string;
      userId: string;
      isLiked: boolean;
      productId: string;
    }) => {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('review_likes')
          .insert({
            review_id: reviewId,
            user_id: userId,
          });

        if (error) throw error;
      }
      return { productId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', result.productId] });
    },
    onError: () => {
      toast.error('Failed to update like');
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

export function useIsProductSeller(productId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['is-product-seller', productId, userId],
    queryFn: async () => {
      if (!userId) return false;

      const { data } = await supabase
        .from('products')
        .select('seller_id')
        .eq('id', productId)
        .maybeSingle();

      return data?.seller_id === userId;
    },
    enabled: !!productId && !!userId,
  });
}
