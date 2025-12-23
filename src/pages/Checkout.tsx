import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useCart, useClearCart } from '@/hooks/useCart';
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
  Copy,
  Banknote,
  QrCode
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tables } from '@/integrations/supabase/types';

type Address = Tables<'addresses'>;

interface SellerPaymentInfo {
  seller_id: string;
  shop_name: string;
  upi_id: string | null;
  accepts_cod: boolean | null;
  payment_instructions: string | null;
  payment_qr_url: string | null;
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
  const { data: cartItems, isLoading: cartLoading } = useCart();
  const clearCart = useClearCart();
  
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [sellerPayments, setSellerPayments] = useState<SellerPaymentInfo[]>([]);
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
    if (!cartItems) return;
    
    const sellerIds = [...new Set(cartItems.map(item => item.products.seller_id).filter(Boolean))];
    
    if (sellerIds.length === 0) return;

    const { data } = await supabase
      .from('shops')
      .select('seller_id, shop_name, upi_id, accepts_cod, payment_instructions, payment_qr_url')
      .in('seller_id', sellerIds);

    if (data) {
      setSellerPayments(data);
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

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !cartItems || cartItems.length === 0) {
      toast.error('Please select an address');
      return;
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) return;

    setIsSubmitting(true);
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.products.price * item.quantity, 0);
      const shipping = subtotal > 999 ? 0 : 99;
      const total = subtotal + shipping;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: '', // Will be generated by trigger
          subtotal,
          shipping_cost: shipping,
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
          notes: paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.products.id,
        product_name: item.products.name,
        product_image: item.products.images?.[0] || null,
        quantity: item.quantity,
        price: item.products.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart.mutateAsync();

      setOrderNumber(order.order_number);
      setOrderComplete(true);
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const subtotal = cartItems?.reduce((sum, item) => sum + item.products.price * item.quantity, 0) || 0;
  const shipping = subtotal > 999 ? 0 : 99;
  const total = subtotal + shipping;

  if (authLoading || cartLoading) {
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
            <h1 className="text-2xl font-display font-bold mb-4">Your cart is empty</h1>
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
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-display font-bold mb-2">Order Placed!</h1>
              <p className="text-muted-foreground mb-4">
                Your order #{orderNumber} has been placed successfully.
              </p>
              
              {paymentMethod === 'upi' && sellerPayments.length > 0 && (
                <Card className="mt-8 text-left border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Complete Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Please complete the payment to the seller(s) using the UPI details below:
                    </p>
                    {sellerPayments.map((seller) => (
                      <div key={seller.seller_id} className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-medium mb-2">{seller.shop_name}</p>
                        {seller.upi_id && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">UPI: {seller.upi_id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(seller.upi_id!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Amount: ₹{total.toLocaleString()}
                        </p>
                        {seller.payment_instructions && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {seller.payment_instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4 justify-center mt-8">
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
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
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
                        <div className="flex items-center gap-3 p-4 border border-border/50 rounded-lg hover:border-primary/50">
                          <RadioGroupItem value="upi" id="upi" />
                          <label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                            <QrCode className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">UPI Payment</p>
                              <p className="text-sm text-muted-foreground">Pay directly to seller's UPI</p>
                            </div>
                          </label>
                        </div>
                        <div className="flex items-center gap-3 p-4 border border-border/50 rounded-lg hover:border-primary/50">
                          <RadioGroupItem value="cod" id="cod" />
                          <label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Banknote className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium">Cash on Delivery</p>
                              <p className="text-sm text-muted-foreground">Pay when you receive</p>
                            </div>
                          </label>
                        </div>
                      </RadioGroup>

                      {paymentMethod === 'upi' && sellerPayments.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <p className="text-sm font-medium">Seller Payment Details:</p>
                          {sellerPayments.map((seller) => (
                            <div key={seller.seller_id} className="p-4 bg-muted/50 rounded-lg">
                              <p className="font-medium">{seller.shop_name}</p>
                              {seller.upi_id ? (
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-sm font-mono bg-background px-2 py-1 rounded">{seller.upi_id}</span>
                                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(seller.upi_id!)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground mt-1">UPI not configured</p>
                              )}
                              {seller.payment_instructions && (
                                <p className="text-sm text-muted-foreground mt-2">{seller.payment_instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button variant="hero" className="flex-1" onClick={() => setStep(3)}>
                          Review Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
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
                          {paymentMethod === 'upi' ? <QrCode className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
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
                                src={item.products.images?.[0] || '/placeholder.svg'}
                                alt={item.products.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.products.name}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-medium">₹{(item.products.price * item.quantity).toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                        <Button
                          variant="hero"
                          className="flex-1"
                          onClick={handlePlaceOrder}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Placing Order...' : `Place Order • ₹${total.toLocaleString()}`}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
                        src={item.products.images?.[0] || '/placeholder.svg'}
                        alt={item.products.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.products.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium">₹{(item.products.price * item.quantity).toLocaleString()}</p>
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
                      <span className={shipping === 0 ? 'text-green-500' : ''}>
                        {shipping === 0 ? 'FREE' : `₹${shipping}`}
                      </span>
                    </div>
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