import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}

const cancelReasons = [
  'Changed my mind',
  'Found a better price elsewhere',
  'Ordered by mistake',
  'Delivery time too long',
  'Payment issues',
  'Other',
];

export function CancelOrderModal({ isOpen, onClose, orderId, orderNumber }: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleCancel = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for cancellation');
      return;
    }

    setIsLoading(true);
    try {
      const cancelReason = selectedReason === 'Other' 
        ? additionalDetails || 'Other reason' 
        : `${selectedReason}${additionalDetails ? `: ${additionalDetails}` : ''}`;

      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          customer_cancel_reason: cancelReason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: 'customer',
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      onClose();
    } catch (error: any) {
      console.error('Cancel order error:', error);
      toast.error('Failed to cancel order: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Cancel Order #{orderNumber}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Are you sure you want to cancel this order? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div>
            <Label className="text-sm font-medium">Reason for cancellation</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="mt-2 space-y-2"
            >
              {cancelReasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="text-sm font-normal cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="details" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Tell us more about why you're cancelling..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="mt-1.5 text-sm"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading} size="sm">
            Keep Order
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading || !selectedReason}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
