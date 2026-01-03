import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  order_item_id?: string;
  reason: string;
  description?: string;
  status: string;
  refund_amount?: number;
  refund_status?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export function useReturnRequests(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['return-requests', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReturnRequest[];
    },
    enabled: !!userId,
  });

  // Real-time subscription for return request updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('return-requests-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_requests',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['return-requests', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

export function useReturnRequestByOrder(orderId?: string) {
  return useQuery({
    queryKey: ['return-request-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ReturnRequest | null;
    },
    enabled: !!orderId,
  });
}

export function useCreateReturnRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      order_id: string;
      user_id: string;
      order_item_id?: string;
      reason: string;
      description?: string;
      refund_amount?: number;
    }) => {
      const { data, error } = await supabase
        .from('return_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Return request submitted successfully. The seller will be notified.');
    },
    onError: (error) => {
      toast.error('Failed to submit return request: ' + error.message);
    },
  });
}

export function useUpdateReturnRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
      refund_status,
    }: {
      id: string;
      status?: string;
      admin_notes?: string;
      refund_status?: string;
    }) => {
      const updateData: Record<string, any> = {};
      if (status) updateData.status = status;
      if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
      if (refund_status) updateData.refund_status = refund_status;
      if (status === 'completed' || status === 'rejected') {
        updateData.processed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('return_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['return-request-order'] });
      toast.success('Return request updated');
    },
    onError: (error) => {
      toast.error('Failed to update return request: ' + error.message);
    },
  });
}
