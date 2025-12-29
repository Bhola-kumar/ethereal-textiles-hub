import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore, getProductImage } from '@/store/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  MapPin, 
  CreditCard, 
  Truck, 
  ArrowLeft, 
  Plus,
  CheckCircle,
  Banknote,
  QrCode,
  ShoppingBag
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PaymentQRCode from '@/components/checkout/PaymentQRCode';
import PaymentConfirmation from '@/components/checkout/PaymentConfirmation';
import { Tables } from '@/integrations/supabase/types';

type Address = Tables<'addresses'>;

interface SellerPaymentInfo {
  seller_id: string;
  shop_name: string;
  upi_id: string | null;
  accepts_cod: boolean | null;
  payment_instructions: string | null;
  payment_qr_url: string | null;
  shipping_charge: number;
  free_shipping_above: number | null;
  gst_percentage: number;
  charge_gst: boolean;
  convenience_charge: number;
  charge_convenience: boolean;
}

interface SellerCartTotal {
  seller_id: string;
  shop_name: string;
  amount: number;
  upi_id: string | null;
  payment_qr_url: string | null;
  payment_instructions: string | null;
  accepts_cod: boolean | null;
  shipping_charge: number;
  gst_amount: number;
  convenience_charge: number;
}

const addressSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  address_line1: z.string().min(5, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Valid pincode required'),
});

export default function Checkout() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items: cartItems, clearCart, getCartTotal } = useCartStore();
  
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [sellerPayments, setSellerPayments] = useState<SellerPaymentInfo[]>([]);
  const [sellerCartTotals, setSellerCartTotals] = useState<SellerCartTotal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/checkout');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      fetchSellerPaymentInfo();
    }
  }, [cartItems]);

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_default', { ascending: false });
    
    if (data) {
      setAddresses(data);
      const defaultAddr = data.find(a => a.is_default) || data[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  };

  const fetchSellerPaymentInfo = async () => {
    if (!cartItems || cartItems.length === 0) return;
    
    // First try to get seller_ids from cart items
    let sellerIds = [...new Set(cartItems.map(item => item.seller_id).filter(Boolean))] as string[];
    
    // If no seller IDs in cart items, fetch from products table using product IDs
    if (sellerIds.length === 0) {
      const productIds = cartItems.map(item => item.id);
      const { data: productData } = await supabase
        .from('products')
        .select('seller_id')
        .in('id', productIds)
        .not('seller_id', 'is', null);
      
      if (productData && productData.length > 0) {
        sellerIds = [...new Set(productData.map(p => p.seller_id).filter(Boolean))] as string[];
      }
    }
    
    if (sellerIds.length === 0) {
      // If still no seller IDs found, allow COD as fallback
      setSellerPayments([{
        seller_id: 'unknown',
        shop_name: 'Seller',
        upi_id: null,
        accepts_cod: true,
        payment_instructions: null,
        payment_qr_url: null,
        shipping_charge: 0,
        free_shipping_above: null,
        gst_percentage: 0,
        charge_gst: false,
        convenience_charge: 0,
        charge_convenience: false,
      }]);
      return;
    }

    try {
      // Use the public view that's accessible to all users for checkout
      const { data, error } = await supabase
        .from('shops_payment_public')
        .select('seller_id, shop_name, upi_id, accepts_cod, payment_instructions, payment_qr_url, shipping_charge, free_shipping_above, gst_percentage, charge_gst, convenience_charge, charge_convenience, is_active')
        .in('seller_id', sellerIds)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching seller payment info:', error);
        // Fallback to COD if query fails
        setSellerPayments([{
          seller_id: sellerIds[0],
          shop_name: 'Seller',
          upi_id: null,
          accepts_cod: true,
          payment_instructions: null,
          payment_qr_url: null,
          shipping_charge: 0,
          free_shipping_above: null,
          gst_percentage: 0,
          charge_gst: false,
          convenience_charge: 0,
          charge_convenience: false,
        }]);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        const shopData = data as unknown as Array<{
          seller_id: string;
          shop_name: string;
          upi_id: string | null;
          accepts_cod: boolean | null;
          payment_instructions: string | null;
          payment_qr_url: string | null;
          shipping_charge: number | null;
          free_shipping_above: number | null;
          gst_percentage: number | null;
          charge_gst: boolean | null;
          convenience_charge: number | null;
          charge_convenience: boolean | null;
        }>;
        
        setSellerPayments(shopData.map(s => ({
          ...s,
          shipping_charge: Number(s.shipping_charge) || 0,
          free_shipping_above: s.free_shipping_above ? Number(s.free_shipping_above) : null,
          gst_percentage: Number(s.gst_percentage) || 0,
          charge_gst: s.charge_gst ?? false,
          convenience_charge: Number(s.convenience_charge) || 0,
          charge_convenience: s.charge_convenience ?? false,
        })));
        
        // Calculate totals per seller with charges
        const totalsMap = new Map<string, number>();
        cartItems.forEach(item => {
          const sellerId = item.seller_id;
          if (sellerId) {
            const current = totalsMap.get(sellerId) || 0;
            totalsMap.set(sellerId, current + (item.price * item.quantity));
          }
        });

        const sellerTotals: SellerCartTotal[] = shopData.map(seller => {
          const sellerSubtotal = totalsMap.get(seller.seller_id) || 0;
          const shippingCharge = Number(seller.shipping_charge) || 0;
          const freeShippingAbove = seller.free_shipping_above ? Number(seller.free_shipping_above) : null;
          const chargeGst = seller.charge_gst ?? false;
          const gstPercentage = Number(seller.gst_percentage) || 0;
          const chargeConvenience = seller.charge_convenience ?? false;
          const convenienceCharge = Number(seller.convenience_charge) || 0;

          // Calculate shipping (free if above threshold)
          const finalShipping = freeShippingAbove && sellerSubtotal >= freeShippingAbove ? 0 : shippingCharge;
          
          // Calculate GST
          const gstAmount = chargeGst ? (sellerSubtotal * gstPercentage / 100) : 0;
          
          // Calculate convenience fee
          const finalConvenience = chargeConvenience ? convenienceCharge : 0;

          return {
            seller_id: seller.seller_id,
            shop_name: seller.shop_name,
            amount: sellerSubtotal,
            upi_id: seller.upi_id,
            payment_qr_url: seller.payment_qr_url,
            payment_instructions: seller.payment_instructions,
            accepts_cod: seller.accepts_cod,
            shipping_charge: finalShipping,
            gst_amount: gstAmount,
            convenience_charge: finalConvenience,
          };
        });
        
        setSellerCartTotals(sellerTotals);
      } else {
        // No seller data found - provide fallback with COD
        console.warn('No seller payment info found for sellers:', sellerIds);
        setSellerPayments([{
          seller_id: sellerIds[0],
          shop_name: 'Seller',
          upi_id: null,
          accepts_cod: true,
          payment_instructions: null,
          payment_qr_url: null,
          shipping_charge: 0,
          free_shipping_above: null,
          gst_percentage: 0,
          charge_gst: false,
          convenience_charge: 0,
          charge_convenience: false,
        }]);
      }
    } catch (err) {
      console.error('Failed to fetch seller payment info:', err);
      // Fallback to COD on any error
      setSellerPayments([{
        seller_id: sellerIds[0] || 'unknown',
        shop_name: 'Seller',
        upi_id: null,
        accepts_cod: true,
        payment_instructions: null,
        payment_qr_url: null,
        shipping_charge: 0,
        free_shipping_above: null,
        gst_percentage: 0,
        charge_gst: false,
        convenience_charge: 0,
        charge_convenience: false,
      }]);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = addressSchema.safeParse(addressForm);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    const { error } = await supabase
      .from('addresses')
      .insert({
        user_id: user!.id,
        ...addressForm,
        is_default: addresses.length === 0,
      });

    if (error) {
      toast.error('Failed to add address');
      return;
    }

    toast.success('Address added');
    setShowNewAddressForm(false);
    setAddressForm({
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
    });
    fetchAddresses();
  };

  const handlePlaceOrder = async (transactionId?: string) => {
    if (!selectedAddressId || !cartItems || cartItems.length === 0) {
      toast.error('Please select an address');
      return;
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) return;

    setIsSubmitting(true);
    try {
      // Create order with calculated totals
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: '', // Will be generated by trigger
          subtotal,
          shipping_cost: totalShipping,
          discount: 0,
          total,
          shipping_address: {
            full_name: selectedAddress.full_name,
            phone: selectedAddress.phone,
            address_line1: selectedAddress.address_line1,
            address_line2: selectedAddress.address_line2,
            city: selectedAddress.city,
            state: selectedAddress.state,
            pincode: selectedAddress.pincode,
          },
          payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
          notes: paymentMethod === 'cod' 
            ? `Cash on Delivery | GST: ₹${totalGst.toFixed(2)} | Convenience: ₹${totalConvenience.toFixed(2)}` 
            : `UPI Payment | Transaction ID: ${transactionId || 'Pending'} | GST: ₹${totalGst.toFixed(2)} | Convenience: ₹${totalConvenience.toFixed(2)}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_image: getProductImage(item),
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      clearCart();

      setOrderNumber(order.order_number);
      setOrderComplete(true);
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCODOrder = () => {
    handlePlaceOrder();
  };

  // Calculate totals including seller charges
  const subtotal = getCartTotal();
  const totalShipping = sellerCartTotals.reduce((sum, s) => sum + s.shipping_charge, 0);
  const totalGst = sellerCartTotals.reduce((sum, s) => sum + s.gst_amount, 0);
  const totalConvenience = sellerCartTotals.reduce((sum, s) => sum + s.convenience_charge, 0);
  const total = subtotal + totalShipping + totalGst + totalConvenience;

  // Check if any seller accepts COD - default to true if no seller info (fallback)
  const anyCODAvailable = sellerPayments.length === 0 || sellerPayments.some(s => s.accepts_cod !== false);
  // Check if any seller has UPI configured
  const anyUPIAvailable = sellerPayments.some(s => s.upi_id || s.payment_qr_url);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">Add some products to your cart to checkout</p>
            <Link to="/products">
              <Button variant="hero">Continue Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container max-w-2xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">Order Placed!</h1>
              <p className="text-muted-foreground mb-2">
                Your order #{orderNumber} has been placed successfully.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                {paymentMethod === 'upi' 
                  ? 'The seller will verify your payment and process your order soon.'
                  : 'Pay with cash when your order arrives.'}
              </p>

              <div className="flex gap-4 justify-center">
                <Link to="/my-orders">
                  <Button variant="hero">View Orders</Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline">Continue Shopping</Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container max-w-6xl mx-auto px-4">
          <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>

          <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[{ num: 1, label: 'Address' }, { num: 2, label: 'Payment' }, { num: 3, label: 'Review' }].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                </div>
                <span className={`text-sm hidden sm:inline ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {s.num < 3 && <div className={`w-8 sm:w-16 h-0.5 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Address */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {addresses.length > 0 && (
                        <RadioGroup
                          value={selectedAddressId || ''}
                          onValueChange={setSelectedAddressId}
                          className="space-y-3"
                        >
                          {addresses.map((addr) => (
                            <div key={addr.id} className="flex items-start gap-3 p-4 border border-border/50 rounded-lg hover:border-primary/50 transition-colors">
                              <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                              <label htmlFor={addr.id} className="flex-1 cursor-pointer">
                                <p className="font-medium">{addr.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {addr.address_line1}
                                  {addr.address_line2 && `, ${addr.address_line2}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                <p className="text-sm text-muted-foreground">{addr.phone}</p>
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {showNewAddressForm ? (
                        <form onSubmit={handleAddAddress} className="space-y-4 p-4 border border-border/50 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Full Name</Label>
                              <Input
                                value={addressForm.full_name}
                                onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <Input
                                value={addressForm.phone}
                                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Address Line 1</Label>
                            <Input
                              value={addressForm.address_line1}
                              onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label>Address Line 2 (Optional)</Label>
                            <Input
                              value={addressForm.address_line2}
                              onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label>City</Label>
                              <Input
                                value={addressForm.city}
                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label>State</Label>
                              <Input
                                value={addressForm.state}
                                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label>Pincode</Label>
                              <Input
                                value={addressForm.pincode}
                                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" variant="hero">Save Address</Button>
                            <Button type="button" variant="outline" onClick={() => setShowNewAddressForm(false)}>Cancel</Button>
                          </div>
                        </form>
                      ) : (
                        <Button variant="outline" onClick={() => setShowNewAddressForm(true)} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Address
                        </Button>
                      )}

                      <Button
                        variant="hero"
                        className="w-full mt-4"
                        onClick={() => setStep(2)}
                        disabled={!selectedAddressId}
                      >
                        Continue to Payment
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm">
                          <strong>Direct Payment to Seller:</strong> This platform connects you directly with sellers. 
                          You'll pay the seller directly using their preferred payment method.
                        </p>
                      </div>

                      <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'upi' | 'cod')}>
                        {anyUPIAvailable && (
                          <div className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                            paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50'
                          }`}>
                            <RadioGroupItem value="upi" id="upi" />
                            <label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                              <QrCode className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">UPI Payment</p>
                                <p className="text-sm text-muted-foreground">Scan QR or use UPI ID to pay</p>
                              </div>
                            </label>
                          </div>
                        )}
                        {anyCODAvailable && (
                          <div className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                            paymentMethod === 'cod' ? 'border-green-500 bg-green-500/5' : 'border-border/50 hover:border-green-500/50'
                          }`}>
                            <RadioGroupItem value="cod" id="cod" />
                            <label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                              <Banknote className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-medium">Cash on Delivery</p>
                                <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                              </div>
                            </label>
                          </div>
                        )}
                      </RadioGroup>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button variant="hero" className="flex-1" onClick={() => setStep(3)}>
                          Continue to Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Review & Pay */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  {/* Order Summary Card */}
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Order Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Shipping Address */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Shipping To:</h3>
                        {addresses.find(a => a.id === selectedAddressId) && (
                          <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <p className="font-medium">{addresses.find(a => a.id === selectedAddressId)!.full_name}</p>
                            <p className="text-muted-foreground">
                              {addresses.find(a => a.id === selectedAddressId)!.address_line1},
                              {addresses.find(a => a.id === selectedAddressId)!.city}, 
                              {addresses.find(a => a.id === selectedAddressId)!.state} - 
                              {addresses.find(a => a.id === selectedAddressId)!.pincode}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Payment Method */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Payment Method:</h3>
                        <div className="p-3 bg-muted/50 rounded-lg text-sm flex items-center gap-2">
                          {paymentMethod === 'upi' ? <QrCode className="h-4 w-4 text-primary" /> : <Banknote className="h-4 w-4 text-green-500" />}
                          {paymentMethod === 'upi' ? 'UPI Payment' : 'Cash on Delivery'}
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h3 className="text-sm font-medium mb-2">Items ({cartItems?.length}):</h3>
                        <div className="space-y-2">
                          {cartItems?.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <img
                                src={getProductImage(item)}
                                alt={item.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* UPI Payment Section */}
                  {paymentMethod === 'upi' && sellerCartTotals.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Complete Payment</h3>
                      <p className="text-sm text-muted-foreground">
                        Scan the QR code or use the UPI ID to pay the seller(s) directly. 
                        After payment, enter your transaction ID to confirm.
                      </p>
                      
                      {/* Show QR codes for each seller */}
                      <div className="grid gap-4">
                        {sellerCartTotals.map((seller) => {
                          const sellerTotal = seller.amount + seller.shipping_charge + seller.gst_amount + seller.convenience_charge;
                          return (
                            <PaymentQRCode
                              key={seller.seller_id}
                              seller={seller}
                              amount={sellerTotal}
                            />
                          );
                        })}
                      </div>

                      {/* Payment Confirmation */}
                      <PaymentConfirmation
                        onConfirm={handlePlaceOrder}
                        isSubmitting={isSubmitting}
                        total={total}
                      />
                    </div>
                  )}

                  {/* COD Confirmation */}
                  {paymentMethod === 'cod' && (
                    <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Banknote className="h-6 w-6 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-muted-foreground">
                              Pay ₹{total.toLocaleString()} when you receive your order
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="hero"
                          className="w-full"
                          onClick={handleCODOrder}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Placing Order...' : `Place Order • ₹${total.toLocaleString()}`}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                    Back to Payment Method
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-border/50 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems?.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={getProductImage(item)}
                        alt={item.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={totalShipping === 0 ? 'text-green-500' : ''}>
                        {totalShipping === 0 ? 'FREE' : `₹${totalShipping.toLocaleString()}`}
                      </span>
                    </div>
                    {totalGst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST</span>
                        <span>₹{totalGst.toFixed(2)}</span>
                      </div>
                    )}
                    {totalConvenience > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Convenience Fee</span>
                        <span>₹{totalConvenience.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-xl gradient-text">₹{total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
