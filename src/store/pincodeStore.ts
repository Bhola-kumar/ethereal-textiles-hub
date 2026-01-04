import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format, isWeekend, nextMonday } from 'date-fns';

interface PincodeStore {
  pincode: string | null;
  setPincode: (pincode: string) => void;
  clearPincode: () => void;
}

export const usePincodeStore = create<PincodeStore>()(
  persist(
    (set) => ({
      pincode: null,
      setPincode: (pincode) => set({ pincode }),
      clearPincode: () => set({ pincode: null }),
    }),
    {
      name: 'user-pincode',
    }
  )
);

// Utility function to calculate estimated delivery date
export function getEstimatedDelivery(
  deliverablePincodes: string[] | null | undefined,
  userPincode: string | null
): { isDeliverable: boolean; estimatedDate: string | null; daysRange: string | null } {
  if (!userPincode) {
    return { isDeliverable: false, estimatedDate: null, daysRange: null };
  }

  // If no pincodes specified, product delivers everywhere
  const isDeliverable = !deliverablePincodes || 
    deliverablePincodes.length === 0 || 
    deliverablePincodes.includes(userPincode);

  if (!isDeliverable) {
    return { isDeliverable: false, estimatedDate: null, daysRange: null };
  }

  // Calculate delivery estimate based on pincode patterns
  // Local delivery (same first 2 digits): 2-4 days
  // Regional delivery (same first 1 digit): 4-6 days  
  // National delivery: 5-8 days
  
  const today = new Date();
  let minDays: number;
  let maxDays: number;

  // Simple heuristic based on pincode proximity
  if (deliverablePincodes && deliverablePincodes.length > 0) {
    const matchingPrefix = deliverablePincodes.some(p => p.slice(0, 2) === userPincode.slice(0, 2));
    const sameRegion = deliverablePincodes.some(p => p.slice(0, 1) === userPincode.slice(0, 1));
    
    if (matchingPrefix) {
      minDays = 2;
      maxDays = 4;
    } else if (sameRegion) {
      minDays = 4;
      maxDays = 6;
    } else {
      minDays = 5;
      maxDays = 8;
    }
  } else {
    // Default for products that ship everywhere
    minDays = 3;
    maxDays = 6;
  }

  // Calculate the estimated delivery date (using max days for safety)
  let deliveryDate = addDays(today, maxDays);
  
  // Skip weekends for delivery
  if (isWeekend(deliveryDate)) {
    deliveryDate = nextMonday(deliveryDate);
  }

  return {
    isDeliverable: true,
    estimatedDate: format(deliveryDate, 'EEE, MMM d'),
    daysRange: `${minDays}-${maxDays} days`,
  };
}
