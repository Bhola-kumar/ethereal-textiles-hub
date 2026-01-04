import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { addDays, format } from 'date-fns';

export function usePincode() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pincode', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('pincode')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data?.pincode || null;
    },
    enabled: !!user,
  });
}

export function useUpdatePincode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pincode: string | null) => {
      if (!user) throw new Error('Please sign in to save your pincode');

      const { data, error } = await supabase
        .from('profiles')
        .update({ pincode })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pincode'] });
    },
  });
}

// Utility function to calculate estimated delivery
export function getEstimatedDelivery(
  deliverablePincodes: string[] | null | undefined,
  userPincode: string | null | undefined
): { isDeliverable: boolean; estimatedDate: string; daysRange: string } {
  const defaultResult = {
    isDeliverable: true,
    estimatedDate: format(addDays(new Date(), 5), 'MMM d'),
    daysRange: '3-7 days',
  };

  if (!userPincode || userPincode.length !== 6) {
    return defaultResult;
  }

  // Check if product has specific deliverable pincodes
  if (deliverablePincodes && deliverablePincodes.length > 0) {
    const isDeliverable = deliverablePincodes.some(
      (p) => p === userPincode || p.startsWith(userPincode.slice(0, 3))
    );
    
    if (!isDeliverable) {
      return {
        isDeliverable: false,
        estimatedDate: '',
        daysRange: '',
      };
    }
  }

  // Calculate delivery estimate based on pincode zone
  const zone = userPincode.slice(0, 2);
  let minDays = 3;
  let maxDays = 7;

  // Metro zones (faster delivery)
  const metroZones = ['11', '40', '56', '60', '70', '50'];
  if (metroZones.includes(zone)) {
    minDays = 2;
    maxDays = 4;
  }

  // Remote zones (slower delivery)
  const remoteZones = ['79', '85', '86', '74', '18', '19'];
  if (remoteZones.includes(zone)) {
    minDays = 5;
    maxDays = 10;
  }

  const avgDays = Math.round((minDays + maxDays) / 2);

  return {
    isDeliverable: true,
    estimatedDate: format(addDays(new Date(), avgDays), 'MMM d'),
    daysRange: `${minDays}-${maxDays} days`,
  };
}
