import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, CheckCircle2, QrCode, Smartphone, BadgeCheck } from 'lucide-react';

interface SellerPaymentInfo {
  seller_id: string;
  shop_name: string;
  upi_id: string | null;
  accepts_cod: boolean | null;
  payment_instructions: string | null;
  payment_qr_url: string | null;
  amount: number;
  shipping_charge: number;
  gst_amount: number;
  convenience_charge: number;
}

interface PaymentQRCodeProps {
  seller: SellerPaymentInfo;
  amount: number;
}

export default function PaymentQRCode({ seller, amount }: PaymentQRCodeProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate UPI deep link for direct payment
  const upiDeepLink = seller.upi_id 
    ? `upi://pay?pa=${encodeURIComponent(seller.upi_id)}&pn=${encodeURIComponent(seller.shop_name)}&am=${amount}&cu=INR`
    : null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            {seller.shop_name}
            <BadgeCheck className="h-4 w-4 text-primary" />
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            ₹{amount.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        {seller.payment_qr_url ? (
          <div className="flex flex-col items-center p-4 bg-white rounded-lg">
            <img 
              src={seller.payment_qr_url} 
              alt={`QR Code for ${seller.shop_name}`}
              className="w-48 h-48 object-contain"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Scan with any UPI app to pay
            </p>
          </div>
        ) : seller.upi_id ? (
          <div className="flex flex-col items-center p-6 bg-muted/50 rounded-lg border-2 border-dashed border-primary/30">
            <QrCode className="h-16 w-16 text-primary/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              QR Code not available. Please use UPI ID below.
            </p>
          </div>
        ) : null}

        {/* UPI ID Section */}
        {seller.upi_id && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              UPI ID
            </p>
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border border-border">
              <code className="flex-1 text-sm font-mono">{seller.upi_id}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(seller.upi_id!)}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Pay via UPI App Button */}
        {upiDeepLink && (
          <a href={upiDeepLink} className="block">
            <Button variant="hero" className="w-full gap-2">
              <Smartphone className="h-4 w-4" />
              Pay ₹{amount.toLocaleString()} via UPI App
            </Button>
          </a>
        )}

        {/* Payment Instructions */}
        {seller.payment_instructions && (
          <div className="p-3 bg-accent/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Payment Instructions</p>
            <p className="text-sm">{seller.payment_instructions}</p>
          </div>
        )}

        {/* Amount Breakdown */}
        <div className="space-y-2 p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{seller.amount.toLocaleString()}</span>
          </div>
          {seller.shipping_charge > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span>₹{seller.shipping_charge.toLocaleString()}</span>
            </div>
          )}
          {seller.gst_amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <span>₹{seller.gst_amount.toFixed(2)}</span>
            </div>
          )}
          {seller.convenience_charge > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Convenience Fee</span>
              <span>₹{seller.convenience_charge.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-primary/20">
            <span className="text-sm font-medium">Total to Pay</span>
            <span className="text-lg font-bold text-primary">₹{amount.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
