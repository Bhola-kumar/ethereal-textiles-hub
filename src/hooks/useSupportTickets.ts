import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  order_id?: string;
  product_id?: string;
  ticket_type: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  user_id?: string;
  content: string;
  is_ai_response: boolean;
  is_from_support: boolean;
  created_at: string;
}

export function useSupportTickets(userId?: string) {
  return useQuery({
    queryKey: ['support-tickets', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!userId,
  });
}

export function useSupportMessages(ticketId?: string) {
  return useQuery({
    queryKey: ['support-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!ticketId,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'resolved_at'>) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticket)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: (error) => {
      toast.error('Failed to create support ticket: ' + error.message);
    },
  });
}

export function useCreateSupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: Omit<SupportMessage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('support_messages')
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', variables.ticket_id] });
    },
  });
}
