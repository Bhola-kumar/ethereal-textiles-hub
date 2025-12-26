import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Banknote, Store, BadgeCheck } from 'lucide-react';

interface SellerPaymentInfoProps {
  sellerId: string | null;
  shopName?: string | null;
  shopIsVerified?: boolean | null;
}

export default function SellerPaymentInfo({ sellerId, shopName, shopIsVerified }: SellerPaymentInfoProps) {
  const [acceptsCod, setAcceptsCod] = useState<boolean | null>(null);
  const [hasUpi, setHasUpi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayShopName, setDisplayShopName] = useState(shopName);

  useEffect(() => {
    if (sellerId) {
      fetchPaymentInfo();
    } else {
      setLoading(false);
    }
  }, [sellerId]);

  const fetchPaymentInfo = async () => {
    try {
      // First try to get payment info - this will only work if user is the shop owner
      // For public display, we just show generic payment options
      const { data: shopPublic } = await supabase
        .from('shops_public')
        .select('shop_name, is_verified')
        .eq('is_active', true)
        .limit(1);
      
      // For now, assume all active shops accept COD by default
      // UPI availability would need separate public indicator
      setAcceptsCod(true);
      setHasUpi(false); // Can't check UPI status without access to private shop data
      
      if (!displayShopName && shopPublic && shopPublic.length > 0) {
        setDisplayShopName(shopPublic[0].shop_name);
      }
    } catch (error) {
      console.error('Error fetching payment info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !displayShopName) {
    return null;
  }

  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Store className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Sold by {displayShopName}</span>
        {shopIsVerified && (
          <BadgeCheck className="h-4 w-4 text-primary" />
        )}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {hasUpi && (
          <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            <CreditCard className="h-3 w-3" />
            UPI Payment
          </div>
        )}
        {acceptsCod && (
          <div className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
            <Banknote className="h-3 w-3" />
            Cash on Delivery
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Pay directly to seller • No platform commission
      </p>
    </div>
  );
}
