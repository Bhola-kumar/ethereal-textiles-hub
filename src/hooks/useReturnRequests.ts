import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  return useQuery({
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
      toast.success('Return request submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit return request: ' + error.message);
    },
  });
}
