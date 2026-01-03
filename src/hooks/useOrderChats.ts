import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface OrderChat {
  id: string;
  order_id: string;
  sender_id: string;
  sender_type: 'customer' | 'seller';
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useOrderChats(orderId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['order-chats', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('order_chats')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as OrderChat[];
    },
    enabled: !!orderId,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-chats-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_chats',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['order-chats', orderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  return query;
}

export function useSendOrderChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      senderId,
      senderType,
      message,
    }: {
      orderId: string;
      senderId: string;
      senderType: 'customer' | 'seller';
      message: string;
    }) => {
      const { data, error } = await supabase
        .from('order_chats')
        .insert({
          order_id: orderId,
          sender_id: senderId,
          sender_type: senderType,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-chats', variables.orderId] });
    },
  });
}

export function useMarkChatsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      senderType,
    }: {
      orderId: string;
      senderType: 'customer' | 'seller';
    }) => {
      // Mark messages from the other party as read
      const { error } = await supabase
        .from('order_chats')
        .update({ is_read: true })
        .eq('order_id', orderId)
        .neq('sender_type', senderType)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-chats', variables.orderId] });
    },
  });
}

export function useUnreadChatCount(orderId?: string, userType?: 'customer' | 'seller') {
  return useQuery({
    queryKey: ['unread-chats', orderId, userType],
    queryFn: async () => {
      if (!orderId || !userType) return 0;
      
      const { count, error } = await supabase
        .from('order_chats')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', orderId)
        .neq('sender_type', userType)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!orderId && !!userType,
  });
}
