import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Percent, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { CreatePromoCodeData, PromoCode } from '@/hooks/usePromoCodes';

const formSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code must be at most 20 characters'),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0.01, 'Discount value must be greater than 0'),
  min_order_amount: z.number().min(0).optional(),
  max_discount_amount: z.number().min(0).optional(),
  max_uses: z.number().min(1).optional(),
  max_uses_per_user: z.number().min(1).optional(),
  start_date: z.date(),
  end_date: z.date().optional(),
  is_active: z.boolean(),
  applies_to: z.enum(['all', 'seller_products']),
});

type FormData = z.infer<typeof formSchema>;

interface PromoCodeFormProps {
  initialData?: PromoCode;
  onSubmit: (data: CreatePromoCodeData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PromoCodeForm({ initialData, onSubmit, onCancel, isLoading }: PromoCodeFormProps) {
  const { isAdmin } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: initialData?.code || '',
      description: initialData?.description || '',
      discount_type: initialData?.discount_type || 'percentage',
      discount_value: initialData?.discount_value || 10,
      min_order_amount: initialData?.min_order_amount || 0,
      max_discount_amount: initialData?.max_discount_amount || undefined,
      max_uses: initialData?.max_uses || undefined,
      max_uses_per_user: initialData?.max_uses_per_user || 1,
      start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
      end_date: initialData?.end_date ? new Date(initialData.end_date) : undefined,
      is_active: initialData?.is_active ?? true,
      applies_to: initialData?.applies_to || (isAdmin ? 'all' : 'seller_products'),
    },
  });

  const discountType = form.watch('discount_type');

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      start_date: data.start_date.toISOString(),
      end_date: data.end_date?.toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promo Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="SUMMER20" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>Unique code customers will enter</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>Enable or disable this promo code</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Get 20% off on your summer purchase!" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discount_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <span className="flex items-center gap-2">
                        <Percent className="h-4 w-4" /> Percentage
                      </span>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <span className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" /> Fixed Amount
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_order_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Order Amount (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0"
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Leave 0 for no minimum</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {discountType === 'percentage' && (
            <FormField
              control={form.control}
              name="max_discount_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Discount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="No limit"
                      {...field} 
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>Cap on discount amount</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="max_uses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Uses Limit</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="Unlimited"
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>Leave empty for unlimited uses</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_uses_per_user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Uses Per Customer</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="1"
                    {...field} 
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                  />
                </FormControl>
                <FormDescription>How many times each customer can use</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>No end date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isAdmin && (
          <FormField
            control={form.control}
            name="applies_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Applies To</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Products (Platform-wide)</SelectItem>
                    <SelectItem value="seller_products">Seller Products Only</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Platform-wide codes work on all products
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update Promo Code' : 'Create Promo Code'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
