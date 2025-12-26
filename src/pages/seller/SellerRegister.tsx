import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Store, ArrowRight, CheckCircle, CreditCard } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const shopSchema = z.object({
  shop_name: z.string().min(3, 'Shop name must be at least 3 characters').max(100),
  description: z.string().max(1000).optional(),
  phone: z.string().min(10, 'Enter a valid phone number').max(15),
  email: z.string().email('Enter a valid email'),
  address: z.string().min(10, 'Enter complete address').max(500),
  city: z.string().min(2, 'Enter city name').max(100),
  state: z.string().min(2, 'Enter state name').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Enter valid GST number').optional().or(z.literal('')),
  upi_id: z.string().regex(/^[\w.-]+@[\w]+$/, 'Enter valid UPI ID (e.g., name@upi)').optional().or(z.literal('')),
  accepts_cod: z.boolean(),
  payment_instructions: z.string().max(500).optional(),
});

export default function SellerRegister() {
  const { user, isSeller, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingShop, setIsCheckingShop] = useState(true);
  const [canRegister, setCanRegister] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
    upi_id: '',
    accepts_cod: true,
    payment_instructions: '',
  });

  // Redirect logic - only run once after loading completes
  useEffect(() => {
    if (loading) return;

    let isMounted = true;

    const checkAndRedirect = async () => {
      if (!user) {
        navigate('/auth?redirect=/seller/register');
        return;
      }

      // If already a seller, redirect to dashboard
      if (isSeller) {
        navigate('/seller');
        return;
      }

      try {
        // Check if user has a shop but role not yet updated
        const { data: existingShop } = await supabase
          .from('shops')
          .select('id')
          .eq('seller_id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (existingShop) {
          navigate('/seller');
          return;
        }

        setCanRegister(true);
        setIsCheckingShop(false);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error checking shop:', error);
        setIsCheckingShop(false);
      }
    };

    checkAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [user, isSeller, loading, navigate]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = shopSchema.safeParse(formData);
    if (!result.success) {
      const error = result.error.errors[0];
      toast.error(error.message);
      return;
    }

    setIsSubmitting(true);
    try {
      // Create shop with payment details
      const { error: shopError } = await supabase
        .from('shops')
        .insert({
          seller_id: user!.id,
          shop_name: formData.shop_name,
          shop_slug: generateSlug(formData.shop_name) + '-' + Date.now(),
          description: formData.description || null,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          gst_number: formData.gst_number || null,
          upi_id: formData.upi_id || null,
          accepts_cod: formData.accepts_cod,
          payment_instructions: formData.payment_instructions || null,
        });

      if (shopError) throw shopError;

      // Add seller role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user!.id,
          role: 'seller',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      toast.success('Shop registered successfully!');
      setStep(4);

      // Refresh session to get new role
      setTimeout(() => {
        window.location.href = '/seller';
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to register shop');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isCheckingShop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!canRegister) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16">
          <div className="container max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-xl font-medium mb-4">Become a Seller</h2>
            <p className="text-muted-foreground mb-6">
              Registration is not available right now. If you are already signed in and think this is an error,
              please try reloading the page or contact support.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => window.location.reload()}>Reload</Button>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  {step === 3 ? <CreditCard className="h-8 w-8 text-primary" /> : <Store className="h-8 w-8 text-primary" />}
                </div>
                <CardTitle className="text-2xl font-display">
                  {step === 1 && 'Register Your Shop'}
                  {step === 2 && 'Business Details'}
                  {step === 3 && 'Payment Methods'}
                  {step === 4 && 'Registration Complete!'}
                </CardTitle>
                <CardDescription>
                  {step === 1 && 'Start selling your gamchhas to customers across India'}
                  {step === 2 && 'Add your business address and GST details'}
                  {step === 3 && 'Add your payment details so customers can pay you directly'}
                  {step === 4 && 'Your shop is ready. Start adding products!'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {step === 4 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Redirecting to your seller dashboard...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); setStep(step + 1); }}>
                    {step === 1 && (
                      <div className="space-y-4">
                        <div>
                          <Label>Shop Name *</Label>
                          <Input
                            value={formData.shop_name}
                            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                            placeholder="e.g., Bengal Handloom House"
                            required
                          />
                        </div>
                        <div>
                          <Label>Shop Description</Label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Tell customers about your shop and products..."
                            rows={4}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Phone *</Label>
                            <Input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="9876543210"
                              required
                            />
                          </div>
                          <div>
                            <Label>Email *</Label>
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="shop@example.com"
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" variant="hero" className="w-full">
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <div>
                          <Label>Business Address *</Label>
                          <Textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Complete address with landmark"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>City *</Label>
                            <Input
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="Kolkata"
                              required
                            />
                          </div>
                          <div>
                            <Label>State *</Label>
                            <Input
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                              placeholder="West Bengal"
                              required
                            />
                          </div>
                          <div>
                            <Label>Pincode *</Label>
                            <Input
                              value={formData.pincode}
                              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                              placeholder="700001"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label>GST Number (Optional)</Label>
                          <Input
                            value={formData.gst_number}
                            onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                            placeholder="22AAAAA0000A1Z5"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Required for orders above ₹50,000
                          </p>
                        </div>
                        <div className="flex gap-4">
                          <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                            Back
                          </Button>
                          <Button type="submit" variant="hero" className="flex-1">
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                          <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Direct Payments:</strong> Customers will pay you directly using these methods. No commission is taken by the platform.
                          </p>
                        </div>

                        <div>
                          <Label>UPI ID</Label>
                          <Input
                            value={formData.upi_id}
                            onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                            placeholder="yourname@upi"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            e.g., name@paytm, name@gpay, name@ybl
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="accepts_cod"
                            checked={formData.accepts_cod}
                            onCheckedChange={(checked) => setFormData({ ...formData, accepts_cod: checked as boolean })}
                          />
                          <Label htmlFor="accepts_cod" className="font-normal cursor-pointer">
                            Accept Cash on Delivery (COD)
                          </Label>
                        </div>

                        <div>
                          <Label>Payment Instructions (Optional)</Label>
                          <Textarea
                            value={formData.payment_instructions}
                            onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                            placeholder="Any special instructions for customers regarding payment..."
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-4">
                          <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                            Back
                          </Button>
                          <Button type="submit" variant="hero" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? 'Registering...' : 'Complete Registration'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Benefits */}
            {step < 4 && (
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                {[
                  { title: '0% Commission', desc: 'Direct payments' },
                  { title: 'Pan India', desc: 'Shipping support' },
                  { title: 'UPI/COD', desc: 'Your payment methods' },
                ].map((benefit) => (
                  <div key={benefit.title} className="p-4 bg-card/50 rounded-lg border border-border/50">
                    <p className="font-semibold text-foreground">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
