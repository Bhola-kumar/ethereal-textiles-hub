import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CreditCard,
  Shield
} from 'lucide-react';

interface PaymentConfirmationProps {
  onConfirm: (transactionId: string) => void;
  isSubmitting: boolean;
  total: number;
}

export default function PaymentConfirmation({ 
  onConfirm, 
  isSubmitting,
  total
}: PaymentConfirmationProps) {
  const [transactionId, setTransactionId] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = () => {
    if (!transactionId.trim()) {
      toast.error('Please enter the UPI Transaction ID');
      return;
    }
    if (!confirmed) {
      toast.error('Please confirm that you have completed the payment');
      return;
    }
    onConfirm(transactionId);
  };

  return (
    <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-500" />
          Confirm Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Complete payment before proceeding
              </p>
              <p className="text-muted-foreground mt-1">
                Please scan the QR code or use the UPI ID above to make the payment, 
                then enter your transaction ID below.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="txn-id" className="text-sm font-medium">
              UPI Transaction ID / Reference Number
            </Label>
            <Input
              id="txn-id"
              placeholder="e.g., 123456789012"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can find this in your UPI app under payment history
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Checkbox 
              id="payment-confirm" 
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <label 
              htmlFor="payment-confirm" 
              className="text-sm cursor-pointer leading-tight"
            >
              I confirm that I have completed the payment of{' '}
              <span className="font-semibold text-primary">₹{total.toLocaleString()}</span>{' '}
              to the seller(s)
            </label>
          </div>
        </div>

        <Button
          variant="hero"
          className="w-full gap-2"
          onClick={handleSubmit}
          disabled={isSubmitting || !transactionId || !confirmed}
        >
          {isSubmitting ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Confirm Payment & Place Order
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          Your payment details are secure
        </div>
      </CardContent>
    </Card>
  );
}
