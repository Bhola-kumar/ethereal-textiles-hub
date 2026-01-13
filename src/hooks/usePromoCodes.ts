import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_by: string;
  seller_id: string | null;
  applies_to: 'all' | 'seller_products';
  created_at: string;
  updated_at: string;
}

export interface PromoCodeUse {
  id: string;
  promo_code_id: string;
  order_id: string;
  user_id: string;
  discount_applied: number;
  created_at: string;
  order?: {
    order_number: string;
    total: number;
    created_at: string;
  };
}

export interface CreatePromoCodeData {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  max_uses?: number;
  max_uses_per_user?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  applies_to?: 'all' | 'seller_products';
}

export interface ValidatePromoCodeResult {
  valid: boolean;
  error?: string;
  promo_code_id?: string;
  code?: string;
  discount?: number;
  discount_type?: string;
  discount_value?: number;
  description?: string;
}

// Hook to fetch promo codes for admin/seller
export const usePromoCodes = () => {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['promo-codes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PromoCode[];
    },
    enabled: !!user,
  });
};

// Hook to fetch promo code usage stats
export const usePromoCodeStats = (promoCodeId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['promo-code-stats', promoCodeId],
    queryFn: async () => {
      let query = supabase
        .from('promo_code_uses')
        .select(`
          *,
          order:orders(order_number, total, created_at)
        `)
        .order('created_at', { ascending: false });

      if (promoCodeId) {
        query = query.eq('promo_code_id', promoCodeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PromoCodeUse[];
    },
    enabled: !!user && !!promoCodeId,
  });
};

// Hook to fetch all promo code uses for dashboard
export const useAllPromoCodeUses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-promo-code-uses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_code_uses')
        .select(`
          *,
          order:orders(order_number, total, created_at),
          promo_code:promo_codes(code, discount_type, discount_value)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

// Hook to create a promo code
export const useCreatePromoCode = () => {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  return useMutation({
    mutationFn: async (data: CreatePromoCodeData) => {
      if (!user) throw new Error('User not authenticated');

      const promoData = {
        ...data,
        code: data.code.toUpperCase(),
        created_by: user.id,
        seller_id: isAdmin ? null : user.id,
        applies_to: isAdmin ? 'all' : (data.applies_to || 'seller_products'),
      };

      const { data: result, error } = await supabase
        .from('promo_codes')
        .insert(promoData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code created successfully!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('A promo code with this code already exists');
      } else {
        toast.error('Failed to create promo code');
      }
    },
  });
};

// Hook to update a promo code
export const useUpdatePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PromoCode> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('promo_codes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update promo code');
    },
  });
};

// Hook to delete a promo code
export const useDeletePromoCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success('Promo code deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete promo code');
    },
  });
};

// Hook to validate a promo code at checkout
export const useValidatePromoCode = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      code,
      subtotal,
      sellerIds,
    }: {
      code: string;
      subtotal: number;
      sellerIds: string[];
    }): Promise<ValidatePromoCodeResult> => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: code,
        p_user_id: user.id,
        p_subtotal: subtotal,
        p_seller_ids: sellerIds,
      });

      if (error) throw error;
      return data as unknown as ValidatePromoCodeResult;
    },
  });
};

// Hook to record promo code usage after order
export const useRecordPromoCodeUse = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      promoCodeId,
      orderId,
      discountApplied,
    }: {
      promoCodeId: string;
      orderId: string;
      discountApplied: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Insert the usage record
      const { error: useError } = await supabase
        .from('promo_code_uses')
        .insert({
          promo_code_id: promoCodeId,
          order_id: orderId,
          user_id: user.id,
          discount_applied: discountApplied,
        });

      if (useError) throw useError;

      // Increment uses_count manually
      const { data: currentPromo } = await supabase
        .from('promo_codes')
        .select('uses_count')
        .eq('id', promoCodeId)
        .single();

      if (currentPromo) {
        await supabase
          .from('promo_codes')
          .update({ uses_count: (currentPromo.uses_count || 0) + 1 })
          .eq('id', promoCodeId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
    },
  });
};
