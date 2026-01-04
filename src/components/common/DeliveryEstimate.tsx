import { Truck, AlertCircle } from 'lucide-react';
import { usePincode, getEstimatedDelivery } from '@/hooks/usePincode';
import { cn } from '@/lib/utils';

interface DeliveryEstimateProps {
  deliverablePincodes?: string[] | null;
  compact?: boolean;
  className?: string;
}

export default function DeliveryEstimate({ 
  deliverablePincodes, 
  compact = false,
  className 
}: DeliveryEstimateProps) {
  const { data: pincode } = usePincode();
  
  if (!pincode) {
    return null;
  }

  const { isDeliverable, estimatedDate, daysRange } = getEstimatedDelivery(
    deliverablePincodes,
    pincode
  );

  if (compact) {
    if (!isDeliverable) {
      return (
        <div className={cn("flex items-center gap-1 text-[9px] text-destructive", className)}>
          <AlertCircle className="h-2.5 w-2.5" />
          <span>Not available</span>
        </div>
      );
    }

    return (
      <div className={cn("flex items-center gap-1 text-[9px] text-green-600", className)}>
        <Truck className="h-2.5 w-2.5" />
        <span>By {estimatedDate}</span>
      </div>
    );
  }

  if (!isDeliverable) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded", className)}>
        <AlertCircle className="h-3 w-3" />
        <span>Not deliverable to {pincode}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded", className)}>
      <Truck className="h-3 w-3" />
      <span>
        Delivery by <strong>{estimatedDate}</strong>
        <span className="text-muted-foreground ml-1">({daysRange})</span>
      </span>
    </div>
  );
}
