import { useState } from 'react';
import { Tag, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useValidatePromoCode, ValidatePromoCodeResult } from '@/hooks/usePromoCodes';
import { cn } from '@/lib/utils';

interface PromoCodeInputProps {
  subtotal: number;
  sellerIds: string[];
  onApply: (result: ValidatePromoCodeResult) => void;
  onRemove: () => void;
  appliedPromo: ValidatePromoCodeResult | null;
  disabled?: boolean;
}

export function PromoCodeInput({
  subtotal,
  sellerIds,
  onApply,
  onRemove,
  appliedPromo,
  disabled,
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const validateMutation = useValidatePromoCode();

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setError(null);
    
    try {
      const result = await validateMutation.mutateAsync({
        code: code.trim(),
        subtotal,
        sellerIds,
      });

      if (result.valid) {
        onApply(result);
        setCode('');
      } else {
        setError(result.error || 'Invalid promo code');
      }
    } catch (err) {
      setError('Failed to validate promo code');
    }
  };

  if (appliedPromo?.valid) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-700 dark:text-green-300">
                  {appliedPromo.code}
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">applied</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                {appliedPromo.discount_type === 'percentage' 
                  ? `${appliedPromo.discount_value}% off`
                  : `₹${appliedPromo.discount_value} off`}
                {appliedPromo.description && ` - ${appliedPromo.description}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-green-700 hover:text-red-600 hover:bg-red-50 dark:text-green-400 dark:hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 text-right">
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            -₹{appliedPromo.discount?.toFixed(2)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApply();
              }
            }}
            className={cn(
              'pl-10',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            disabled={disabled || validateMutation.isPending}
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={disabled || validateMutation.isPending || !code.trim()}
          variant="outline"
        >
          {validateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
