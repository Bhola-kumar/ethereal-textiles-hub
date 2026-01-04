import { useState, useEffect } from 'react';
import { MapPin, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePincode, useUpdatePincode } from '@/hooks/usePincode';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface PincodeInputProps {
  compact?: boolean;
}

export default function PincodeInput({ compact = false }: PincodeInputProps) {
  const { user } = useAuth();
  const { data: pincode, isLoading } = usePincode();
  const updatePincode = useUpdatePincode();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pincode) {
      setInputValue(pincode);
    }
  }, [pincode]);

  const handleSave = () => {
    if (!user) {
      toast.error('Please sign in to save your delivery location');
      return;
    }

    if (!inputValue || inputValue.length !== 6 || !/^\d+$/.test(inputValue)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    updatePincode.mutate(inputValue, {
      onSuccess: () => {
        setIsOpen(false);
        toast.success(`Delivery location set to ${inputValue}`);
      },
      onError: () => {
        toast.error('Failed to save pincode');
      },
    });
  };

  const handleClear = () => {
    if (!user) return;
    
    updatePincode.mutate(null, {
      onSuccess: () => {
        setInputValue('');
        setIsOpen(false);
      },
    });
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            <MapPin className="h-3 w-3" />
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : pincode ? pincode : 'Set Location'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Delivery Location</span>
            </div>
            <Input
              placeholder="Enter 6-digit pincode"
              maxLength={6}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
              className="h-8 text-sm"
              disabled={updatePincode.isPending}
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex-1 h-7 text-xs" 
                onClick={handleSave}
                disabled={updatePincode.isPending}
              >
                {updatePincode.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </>
                )}
              </Button>
              {pincode && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs" 
                  onClick={handleClear}
                  disabled={updatePincode.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Enter pincode"
        maxLength={6}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
        className="w-24 h-8 text-sm"
        disabled={updatePincode.isPending || isLoading}
      />
      <Button 
        size="sm" 
        variant="secondary" 
        className="h-8" 
        onClick={handleSave}
        disabled={updatePincode.isPending}
      >
        {updatePincode.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Check'}
      </Button>
    </div>
  );
}
