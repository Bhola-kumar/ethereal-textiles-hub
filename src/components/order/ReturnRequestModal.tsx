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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, RotateCcw } from 'lucide-react';
import { useCreateReturnRequest } from '@/hooks/useReturnRequests';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/hooks/useOrders';

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

const returnReasons = [
  'Product damaged or defective',
  'Wrong item received',
  'Item not as described',
  'Quality not satisfactory',
  'Size/fit issues',
  'Changed my mind',
  'Other',
];

export function ReturnRequestModal({ isOpen, onClose, order }: ReturnRequestModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [requestRefund, setRequestRefund] = useState(true);
  const { user } = useAuth();
  const createReturnRequest = useCreateReturnRequest();

  const orderItems = order.order_items || [];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    if (!user?.id) return;

    const refundAmount = requestRefund
      ? orderItems
          .filter((item) => selectedItems.length === 0 || selectedItems.includes(item.id))
          .reduce((sum, item) => sum + item.price * item.quantity, 0)
      : undefined;

    await createReturnRequest.mutateAsync({
      order_id: order.id,
      user_id: user.id,
      order_item_id: selectedItems.length === 1 ? selectedItems[0] : undefined,
      reason: selectedReason,
      description: description || undefined,
      refund_amount: refundAmount,
    });

    onClose();
    setSelectedReason('');
    setDescription('');
    setSelectedItems([]);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="h-4 w-4" />
            Return Request - Order #{order.order_number}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Submit a return request for this order. We'll review it and get back to you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Select Items */}
          {orderItems.length > 1 && (
            <div>
              <Label className="text-sm font-medium">Select items to return (optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Leave unchecked to return all items
              </p>
              <div className="space-y-2 mt-2">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 border border-border rounded-lg"
                  >
                    <Checkbox
                      id={item.id}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                    <img
                      src={item.product_image || '/placeholder.svg'}
                      alt={item.product_name}
                      className="h-10 w-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label className="text-sm font-medium">Reason for return *</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="mt-2 space-y-2"
            >
              {returnReasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={`reason-${reason}`} />
                  <Label htmlFor={`reason-${reason}`} className="text-sm font-normal cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 text-sm"
              rows={3}
            />
          </div>

          {/* Refund checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="refund"
              checked={requestRefund}
              onCheckedChange={(checked) => setRequestRefund(checked === true)}
            />
            <Label htmlFor="refund" className="text-sm font-normal cursor-pointer">
              Request refund for returned items
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createReturnRequest.isPending || !selectedReason}
            size="sm"
          >
            {createReturnRequest.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
