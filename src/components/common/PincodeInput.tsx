import { useState } from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePincodeStore } from '@/store/pincodeStore';
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
  const { pincode, setPincode, clearPincode } = usePincodeStore();
  const [inputValue, setInputValue] = useState(pincode || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (!inputValue || inputValue.length !== 6 || !/^\d+$/.test(inputValue)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    setPincode(inputValue);
    setIsOpen(false);
    toast.success(`Delivery location set to ${inputValue}`);
  };

  const handleClear = () => {
    clearPincode();
    setInputValue('');
    setIsOpen(false);
  };

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
            <MapPin className="h-3 w-3" />
            {pincode ? pincode : 'Set Location'}
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
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSave}>
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              {pincode && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleClear}>
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
      />
      <Button size="sm" variant="secondary" className="h-8" onClick={handleSave}>
        Check
      </Button>
    </div>
  );
}
