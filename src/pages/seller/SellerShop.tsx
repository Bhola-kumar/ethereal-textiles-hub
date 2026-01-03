import { useState, useEffect, useRef } from 'react';
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
import { Store, MapPin, CreditCard, Save, CheckCircle, Upload, X, Loader2, Image as ImageIcon, Info } from 'lucide-react';
import { toast } from 'sonner';
import { IMAGE_GUIDELINES, processImageForUpload, formatFileSize } from '@/lib/imageUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (
    file: File,
    type: 'logo' | 'banner',
    setUploading: (val: boolean) => void
  ) => {
    if (!shop) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);

    try {
      const imageType = type === 'logo' ? 'shopLogo' : 'shopBanner';
      const { file: processedFile, wasCompressed } = await processImageForUpload(file, imageType);
      
      if (wasCompressed) {
        toast.info(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`);
      }

      const fileExt = processedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${shop.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `shop-${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, processedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const updateField = type === 'logo' ? 'logo_url' : 'banner_url';
      
      // Update local state
      setShopForm(prev => ({ ...prev, [updateField]: publicUrl }));
      
      // Update database
      await supabase
        .from('shops')
        .update({ [updateField]: publicUrl })
        .eq('id', shop.id);

      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully`);
    } catch (error: any) {
      toast.error(`Failed to upload ${type}: ` + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (type: 'logo' | 'banner') => {
    if (!shop) return;

    const updateField = type === 'logo' ? 'logo_url' : 'banner_url';
    
    setShopForm(prev => ({ ...prev, [updateField]: '' }));
    
    await supabase
      .from('shops')
      .update({ [updateField]: null })
      .eq('id', shop.id);

    toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} removed`);
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

  const logoGuidelines = IMAGE_GUIDELINES.shopLogo;
  const bannerGuidelines = IMAGE_GUIDELINES.shopBanner;

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
              <CardContent className="space-y-6">
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

                {/* Logo Upload */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Shop Logo
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="font-medium mb-1">{logoGuidelines.label}</p>
                          <p className="text-xs">{logoGuidelines.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{logoGuidelines.description}</p>
                  
                  <div className="flex items-start gap-4">
                    {shopForm.logo_url ? (
                      <div className="relative">
                        <img 
                          src={shopForm.logo_url} 
                          alt="Shop Logo" 
                          className="w-24 h-24 object-cover rounded-lg border border-border"
                          crossOrigin="anonymous"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => handleRemoveImage('logo')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Upload</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <Input
                        value={shopForm.logo_url}
                        onChange={e => setShopForm({ ...shopForm, logo_url: e.target.value })}
                        placeholder="Or paste image URL here..."
                        className="text-sm"
                      />
                      {!shopForm.logo_url && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'logo', setUploadingLogo);
                      e.target.value = '';
                    }}
                  />
                </div>

                {/* Banner Upload */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Shop Banner
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="font-medium mb-1">{bannerGuidelines.label}</p>
                          <p className="text-xs">{bannerGuidelines.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{bannerGuidelines.description}</p>
                  
                  {shopForm.banner_url ? (
                    <div className="relative">
                      <img 
                        src={shopForm.banner_url} 
                        alt="Shop Banner" 
                        className="w-full h-32 object-cover rounded-lg border border-border"
                        crossOrigin="anonymous"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => handleRemoveImage('banner')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => bannerInputRef.current?.click()}
                    >
                      {uploadingBanner ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Upload Banner Image</span>
                          <span className="text-xs text-muted-foreground">Recommended: {bannerGuidelines.maxWidth}×{bannerGuidelines.maxHeight}px</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      value={shopForm.banner_url}
                      onChange={e => setShopForm({ ...shopForm, banner_url: e.target.value })}
                      placeholder="Or paste banner image URL here..."
                      className="flex-1 text-sm"
                    />
                    {!shopForm.banner_url && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadingBanner}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingBanner ? 'Uploading...' : 'Upload'}
                      </Button>
                    )}
                  </div>
                  
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'banner', setUploadingBanner);
                      e.target.value = '';
                    }}
                  />
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
