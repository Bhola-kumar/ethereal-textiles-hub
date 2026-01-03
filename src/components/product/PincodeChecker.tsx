import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Truck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PincodeCheckerProps {
    deliverablePincodes?: string[] | null;
}

export default function PincodeChecker({ deliverablePincodes }: PincodeCheckerProps) {
    const [pincode, setPincode] = useState('');
    const [status, setStatus] = useState<'idle' | 'available' | 'unavailable' | 'error'>('idle');

    const checkAvailability = () => {
        if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
            setStatus('error');
            toast.error('Please enter a valid 6-digit pincode');
            return;
        }

        // If deliverablePincodes is null or empty, it means available everywhere
        if (!deliverablePincodes || deliverablePincodes.length === 0) {
            setStatus('available');
            return;
        }

        if (deliverablePincodes.includes(pincode)) {
            setStatus('available');
        } else {
            setStatus('unavailable');
        }
    };

    return (
        <div className="p-4 bg-secondary/30 rounded-lg border border-border/50 space-y-3">
            <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Check Delivery Availability</span>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="Enter Pincode"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPincode(val);
                        if (status !== 'idle') setStatus('idle');
                    }}
                    className="bg-background"
                />
                <Button onClick={checkAvailability} variant="secondary">
                    Check
                </Button>
            </div>

            {status === 'available' && (
                <div className="flex items-center gap-2 text-green-600 text-sm animate-in fade-in slide-in-from-top-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>Delivery available for {pincode}</span>
                </div>
            )}

            {status === 'unavailable' && (
                <div className="flex items-center gap-2 text-destructive text-sm animate-in fade-in slide-in-from-top-1">
                    <XCircle className="h-4 w-4" />
                    <span>Delivery not available for {pincode}</span>
                </div>
            )}
        </div>
    );
}
