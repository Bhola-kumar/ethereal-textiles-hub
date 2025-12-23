import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Store, 
  CreditCard, 
  MapPin, 
  Save,
  Building2,
  Wallet
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Shop = Tables<'shops'>;

export default function SellerSettings() {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [shopForm, setShopForm] = useState({
    shop_name: '',
    description: '',
    phone: '',
    email: '',
  });

  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    upi_id: '',
    accepts_cod: true,
    payment_instructions: '',
    gst_number: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
  });

  useEffect(() => {
    if (user) {
      fetchShopData();
    }
  }, [user]);

  const fetchShopData = async () => {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('seller_id', user!.id)
      .single();

    if (data) {
      setShop(data);
      setShopForm({
        shop_name: data.shop_name || '',
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
      });
      setAddressForm({
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
      });
      setPaymentForm({
        upi_id: data.upi_id || '',
        accepts_cod: data.accepts_cod ?? true,
        payment_instructions: data.payment_instructions || '',
        gst_number: data.gst_number || '',
        bank_account_name: data.bank_account_name || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc: data.bank_ifsc || '',
      });
    }
    setLoading(false);
  };

  const handleSaveShopInfo = async () => {
    if (!shop) return;
    setSaving(true);

    const { error } = await supabase
      .from('shops')
      .update({
        shop_name: shopForm.shop_name,
        description: shopForm.description,
        phone: shopForm.phone,
        email: shopForm.email,
      })
      .eq('id', shop.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to update shop info');
    } else {
      toast.success('Shop info updated');
    }
  };

  const handleSaveAddress = async () => {
    if (!shop) return;
    setSaving(true);

    const { error } = await supabase
      .from('shops')
      .update({
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
      })
      .eq('id', shop.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to update address');
    } else {
      toast.success('Address updated');
    }
  };

  const handleSavePayment = async () => {
    if (!shop) return;
    setSaving(true);

    const { error } = await supabase
      .from('shops')
      .update({
        upi_id: paymentForm.upi_id || null,
        accepts_cod: paymentForm.accepts_cod,
        payment_instructions: paymentForm.payment_instructions || null,
        gst_number: paymentForm.gst_number || null,
        bank_account_name: paymentForm.bank_account_name || null,
        bank_account_number: paymentForm.bank_account_number || null,
        bank_ifsc: paymentForm.bank_ifsc || null,
      })
      .eq('id', shop.id);

    setSaving(false);
    if (error) {
      toast.error('Failed to update payment settings');
    } else {
      toast.success('Payment settings updated');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="p-4 lg:p-8 text-center">
        <p className="text-muted-foreground">Shop not found</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Shop Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your shop information and payment methods
          </p>
        </div>

        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="shop" className="gap-2">
              <Store className="h-4 w-4" />
              Shop Info
            </TabsTrigger>
            <TabsTrigger value="address" className="gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
          </TabsList>

          {/* Shop Info Tab */}
          <TabsContent value="shop">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Shop Information
                </CardTitle>
                <CardDescription>
                  Basic information about your shop
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Shop Name</Label>
                  <Input
                    value={shopForm.shop_name}
                    onChange={(e) => setShopForm({ ...shopForm, shop_name: e.target.value })}
                    placeholder="Your shop name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={shopForm.description}
                    onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                    placeholder="Tell customers about your shop..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={shopForm.phone}
                      onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={shopForm.email}
                      onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                      placeholder="shop@example.com"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveShopInfo} disabled={saving} variant="hero">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address Tab */}
          <TabsContent value="address">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Business Address
                </CardTitle>
                <CardDescription>
                  Your shop's physical location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={addressForm.address}
                    onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                    placeholder="Complete address with landmark"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                      placeholder="Pincode"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveAddress} disabled={saving} variant="hero">
                  <Save className="h-4 w-4 mr-2" />
                  Save Address
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <div className="space-y-6">
              {/* UPI & COD Settings */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>
                    Configure how customers can pay you directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm">
                      <strong>Direct Payments:</strong> Customers will pay you directly using these methods. 
                      The platform does not take any commission.
                    </p>
                  </div>

                  <div>
                    <Label>UPI ID</Label>
                    <Input
                      value={paymentForm.upi_id}
                      onChange={(e) => setPaymentForm({ ...paymentForm, upi_id: e.target.value })}
                      placeholder="yourname@upi"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      e.g., name@paytm, name@gpay, name@ybl
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="accepts_cod"
                      checked={paymentForm.accepts_cod}
                      onCheckedChange={(checked) => setPaymentForm({ ...paymentForm, accepts_cod: checked as boolean })}
                    />
                    <Label htmlFor="accepts_cod" className="font-normal cursor-pointer">
                      Accept Cash on Delivery (COD)
                    </Label>
                  </div>

                  <div>
                    <Label>Payment Instructions</Label>
                    <Textarea
                      value={paymentForm.payment_instructions}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_instructions: e.target.value })}
                      placeholder="Any special instructions for customers regarding payment..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Bank Details (Optional)
                  </CardTitle>
                  <CardDescription>
                    For bank transfer payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>GST Number</Label>
                    <Input
                      value={paymentForm.gst_number}
                      onChange={(e) => setPaymentForm({ ...paymentForm, gst_number: e.target.value.toUpperCase() })}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <Label>Account Holder Name</Label>
                    <Input
                      value={paymentForm.bank_account_name}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bank_account_name: e.target.value })}
                      placeholder="Account holder name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Account Number</Label>
                      <Input
                        value={paymentForm.bank_account_number}
                        onChange={(e) => setPaymentForm({ ...paymentForm, bank_account_number: e.target.value })}
                        placeholder="Account number"
                      />
                    </div>
                    <div>
                      <Label>IFSC Code</Label>
                      <Input
                        value={paymentForm.bank_ifsc}
                        onChange={(e) => setPaymentForm({ ...paymentForm, bank_ifsc: e.target.value.toUpperCase() })}
                        placeholder="IFSC code"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSavePayment} disabled={saving} variant="hero" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Save Payment Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}