import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, MapPin, Bell, Shield, Save, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type Address = Tables<'addresses'>;

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // Profile State
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
  });

  // Address Form State
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
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch Profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  // Fetch Addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!user,
  });

  // Update profile form when data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  // Update Profile Mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  // Add Address Mutation
  const addAddress = useMutation({
    mutationFn: async (data: Omit<Tables<'addresses'>, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('addresses').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      toast.success('Address added successfully');
      setIsAddressDialogOpen(false);
      resetAddressForm();
    },
    onError: (error) => {
      toast.error('Failed to add address: ' + error.message);
    },
  });

  // Delete Address Mutation
  const deleteAddress = useMutation({
    mutationFn: async (addressId: string) => {
      const { error } = await supabase.from('addresses').delete().eq('id', addressId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      toast.success('Address deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete address: ' + error.message);
    },
  });

  // Set Default Address
  const setDefaultAddress = useMutation({
    mutationFn: async (addressId: string) => {
      if (!user) throw new Error('Not authenticated');
      // First, unset all defaults
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
      // Then set the new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', user?.id] });
      toast.success('Default address updated');
    },
  });

  const resetAddressForm = () => {
    setAddressForm({
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
    });
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(profileForm);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    addAddress.mutate({
      ...addressForm,
      user_id: user.id,
      is_default: addresses?.length === 0,
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Addresses</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="bg-secondary/30"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>
                    <Button type="submit" variant="hero" disabled={updateProfile.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card className="glass-card border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Saved Addresses</CardTitle>
                    <CardDescription>Manage your delivery addresses</CardDescription>
                  </div>
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                              value={addressForm.full_name}
                              onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Address Line 1</Label>
                          <Input
                            value={addressForm.address_line1}
                            onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                            placeholder="House/Flat No., Building Name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Address Line 2</Label>
                          <Input
                            value={addressForm.address_line2}
                            onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                            placeholder="Street, Area (Optional)"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>State</Label>
                            <Input
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Pincode</Label>
                            <Input
                              value={addressForm.pincode}
                              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" variant="hero" className="w-full" disabled={addAddress.isPending}>
                          {addAddress.isPending ? 'Adding...' : 'Add Address'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {addressesLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : addresses && addresses.length > 0 ? (
                    <div className="grid gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`p-4 rounded-lg border ${
                            address.is_default
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-border/50 bg-secondary/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{address.full_name}</p>
                                {address.is_default && (
                                  <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{address.phone}</p>
                              <p className="text-sm">
                                {address.address_line1}
                                {address.address_line2 && `, ${address.address_line2}`}
                              </p>
                              <p className="text-sm">
                                {address.city}, {address.state} - {address.pincode}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {!address.is_default && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDefaultAddress.mutate(address.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteAddress.mutate(address.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No addresses saved yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what updates you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order Updates</p>
                      <p className="text-sm text-muted-foreground">Get notified about your order status</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Promotional Emails</p>
                      <p className="text-sm text-muted-foreground">Receive offers and discounts</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Arrivals</p>
                      <p className="text-sm text-muted-foreground">Be first to know about new products</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/50 mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Shield className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-sm text-muted-foreground">Sign out from your account</p>
                    </div>
                    <Button variant="outline" onClick={() => signOut()}>
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
