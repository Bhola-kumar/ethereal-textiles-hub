import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, MapPin, CreditCard, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Shop {
  id: string;
  shop_name: string;
  shop_slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  is_verified: boolean;
  is_active: boolean;
}

const shopSchema = z.object({
  shop_name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal('')),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
});

const bankSchema = z.object({
  bank_account_name: z.string().min(3).max(100),
  bank_account_number: z.string().min(8).max(20),
  bank_ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter valid IFSC code'),
});

export default function SellerShop() {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [shopForm, setShopForm] = useState({
    shop_name: '',
    description: '',
    phone: '',
    email: '',
    logo_url: '',
    banner_url: '',
  });

  const [addressForm, setAddressForm] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    gst_number: '',
  });

  const [bankForm, setBankForm] = useState({
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
  });

  useEffect(() => {
    if (user) {
      fetchShop();
    }
  }, [user]);

  const fetchShop = async () => {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('seller_id', user!.id)
      .single();

    if (data) {
      setShop(data);
      setShopForm({
        shop_name: data.shop_name,
        description: data.description || '',
        phone: data.phone,
        email: data.email,
        logo_url: data.logo_url || '',
        banner_url: data.banner_url || '',
      });
      setAddressForm({
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        gst_number: data.gst_number || '',
      });
      setBankForm({
        bank_account_name: data.bank_account_name || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc: data.bank_ifsc || '',
      });
    }
    setLoading(false);
  };

  const handleSaveShop = async () => {
    const result = shopSchema.safeParse({
      ...shopForm,
      ...addressForm,
    });

    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          shop_name: shopForm.shop_name,
          description: shopForm.description || null,
          phone: shopForm.phone,
          email: shopForm.email,
          logo_url: shopForm.logo_url || null,
          banner_url: shopForm.banner_url || null,
          address: addressForm.address || null,
          city: addressForm.city || null,
          state: addressForm.state || null,
          pincode: addressForm.pincode || null,
          gst_number: addressForm.gst_number || null,
        })
        .eq('id', shop!.id);

      if (error) throw error;
      toast.success('Shop details updated');
      fetchShop();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async () => {
    if (!bankForm.bank_account_name || !bankForm.bank_account_number || !bankForm.bank_ifsc) {
      toast.error('Please fill all bank details');
      return;
    }

    const result = bankSchema.safeParse(bankForm);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          bank_account_name: bankForm.bank_account_name,
          bank_account_number: bankForm.bank_account_number,
          bank_ifsc: bankForm.bank_ifsc,
        })
        .eq('id', shop!.id);

      if (error) throw error;
      toast.success('Bank details updated');
      fetchShop();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSaving(false);
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
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Shop not found. Please register first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Shop Settings</h1>
            <p className="text-muted-foreground">Manage your store details</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            shop.is_verified 
              ? 'bg-green-500/20 text-green-500' 
              : 'bg-yellow-500/20 text-yellow-500'
          }`}>
            {shop.is_verified ? <CheckCircle className="h-4 w-4" /> : null}
            {shop.is_verified ? 'Verified' : 'Pending Verification'}
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-card">
            <TabsTrigger value="details" className="gap-2">
              <Store className="h-4 w-4" /> Shop Details
            </TabsTrigger>
            <TabsTrigger value="address" className="gap-2">
              <MapPin className="h-4 w-4" /> Address & GST
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-2">
              <CreditCard className="h-4 w-4" /> Bank Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Shop Information</CardTitle>
                <CardDescription>Basic details about your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Shop Name *</Label>
                    <Input
                      value={shopForm.shop_name}
                      onChange={e => setShopForm({ ...shopForm, shop_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Shop URL</Label>
                    <Input value={shop.shop_slug} disabled className="bg-muted" />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={shopForm.description}
                    onChange={e => setShopForm({ ...shopForm, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      type="tel"
                      value={shopForm.phone}
                      onChange={e => setShopForm({ ...shopForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={shopForm.email}
                      onChange={e => setShopForm({ ...shopForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Logo URL</Label>
                    <Input
                      value={shopForm.logo_url}
                      onChange={e => setShopForm({ ...shopForm, logo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Banner URL</Label>
                    <Input
                      value={shopForm.banner_url}
                      onChange={e => setShopForm({ ...shopForm, banner_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <Button onClick={handleSaveShop} variant="hero" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Business Address & GST</CardTitle>
                <CardDescription>Your registered business address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={addressForm.address}
                    onChange={e => setAddressForm({ ...addressForm, address: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={addressForm.city}
                      onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={addressForm.state}
                      onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input
                      value={addressForm.pincode}
                      onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>GST Number</Label>
                  <Input
                    value={addressForm.gst_number}
                    onChange={e => setAddressForm({ ...addressForm, gst_number: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <Button onClick={handleSaveShop} variant="hero" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle>Bank Account Details</CardTitle>
                <CardDescription>For receiving payments (settlements every week)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Account Holder Name *</Label>
                  <Input
                    value={bankForm.bank_account_name}
                    onChange={e => setBankForm({ ...bankForm, bank_account_name: e.target.value })}
                    placeholder="As per bank records"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Account Number *</Label>
                    <Input
                      value={bankForm.bank_account_number}
                      onChange={e => setBankForm({ ...bankForm, bank_account_number: e.target.value })}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <Label>IFSC Code *</Label>
                    <Input
                      value={bankForm.bank_ifsc}
                      onChange={e => setBankForm({ ...bankForm, bank_ifsc: e.target.value.toUpperCase() })}
                      placeholder="e.g., SBIN0001234"
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-500">
                    ⚠️ Please ensure bank details are correct. Incorrect details may delay your payments.
                  </p>
                </div>

                <Button onClick={handleSaveBank} variant="hero" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Bank Details'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
