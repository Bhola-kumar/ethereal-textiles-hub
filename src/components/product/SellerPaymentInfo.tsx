import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Banknote, Store } from 'lucide-react';

interface SellerPaymentInfoProps {
  sellerId: string | null;
}

interface ShopInfo {
  shop_name: string;
  upi_id: string | null;
  accepts_cod: boolean | null;
}

export default function SellerPaymentInfo({ sellerId }: SellerPaymentInfoProps) {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sellerId) {
      fetchShopInfo();
    } else {
      setLoading(false);
    }
  }, [sellerId]);

  const fetchShopInfo = async () => {
    const { data } = await supabase
      .from('shops')
      .select('shop_name, upi_id, accepts_cod')
      .eq('seller_id', sellerId)
      .single();

    if (data) {
      setShop(data);
    }
    setLoading(false);
  };

  if (loading || !shop) {
    return null;
  }

  const hasUPI = shop.upi_id;
  const hasCOD = shop.accepts_cod;

  if (!hasUPI && !hasCOD) {
    return null;
  }

  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Store className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Sold by {shop.shop_name}</span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {hasUPI && (
          <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            <CreditCard className="h-3 w-3" />
            UPI Payment
          </div>
        )}
        {hasCOD && (
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