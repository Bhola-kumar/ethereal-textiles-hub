import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Shield,
  ShieldOff,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Shop {
  id: string;
  seller_id: string;
  shop_name: string;
  shop_slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gst_number: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export default function AdminSellers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const queryClient = useQueryClient();

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Shop[];
    },
  });

  const updateShopStatus = useMutation({
    mutationFn: async ({ shopId, field, value }: { shopId: string; field: 'is_verified' | 'is_active'; value: boolean }) => {
      const { error } = await supabase
        .from('shops')
        .update({ [field]: value })
        .eq('id', shopId);

      if (error) throw error;

      // If verifying a shop, also create a notification for the seller
      if (field === 'is_verified') {
        const shop = shops.find(s => s.id === shopId);
        if (shop) {
          await supabase.from('notifications').insert({
            user_id: shop.seller_id,
            title: value ? 'Shop Verified!' : 'Verification Revoked',
            message: value
              ? `Congratulations! Your shop "${shop.shop_name}" has been verified. You can now start selling.`
              : `Your shop "${shop.shop_name}" verification has been revoked. Please contact support.`,
            type: value ? 'success' : 'warning',
            link: '/seller',
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shops'] });
      toast.success('Shop status updated');
    },
    onError: (error) => {
      toast.error('Failed to update shop: ' + error.message);
    },
  });

  const filteredShops = shops.filter(
    (shop) =>
      shop.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingVerification = shops.filter((s) => !s.is_verified).length;

  return (
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Seller Management
            </h1>
            {pendingVerification > 0 && (
              <p className="text-muted-foreground">
                {pendingVerification} seller{pendingVerification > 1 ? 's' : ''} pending verification
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{shops.length}</p>
                  <p className="text-sm text-muted-foreground">Total Sellers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {shops.filter((s) => s.is_verified).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingVerification}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ShieldOff className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {shops.filter((s) => !s.is_active).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by shop name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sellers Table */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sellers found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Shop
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Contact
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Location
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Joined
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredShops.map((shop) => (
                      <tr key={shop.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              {shop.logo_url ? (
                                <img
                                  src={shop.logo_url}
                                  alt={shop.shop_name}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              ) : (
                                <Store className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{shop.shop_name}</p>
                              {shop.gst_number && (
                                <p className="text-xs text-muted-foreground">
                                  GST: {shop.gst_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {shop.email && (
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {shop.email}
                              </p>
                            )}
                            {shop.phone && (
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {shop.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {shop.city && shop.state && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shop.city}, {shop.state}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {format(new Date(shop.created_at), 'PP')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <Badge
                              className={
                                shop.is_verified
                                  ? 'bg-green-500/20 text-green-500'
                                  : 'bg-yellow-500/20 text-yellow-500'
                              }
                            >
                              {shop.is_verified ? 'Verified' : 'Pending'}
                            </Badge>
                            {!shop.is_active && (
                              <Badge className="bg-red-500/20 text-red-500">Inactive</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Details */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedShop(shop)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>{shop.shop_name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {shop.description && (
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Description</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {shop.description}
                                      </p>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Email</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {shop.email || 'Not provided'}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Phone</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {shop.phone || 'Not provided'}
                                      </p>
                                    </div>
                                  </div>
                                  {shop.address && (
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Address</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {shop.address}
                                        <br />
                                        {shop.city}, {shop.state} - {shop.pincode}
                                      </p>
                                    </div>
                                  )}
                                  {shop.gst_number && (
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">GST Number</h4>
                                      <p className="text-sm font-mono">{shop.gst_number}</p>
                                    </div>
                                  )}
                                </div>
                                <DialogFooter className="mt-4">
                                  {!shop.is_verified && (
                                    <Button
                                      onClick={() =>
                                        updateShopStatus.mutate({
                                          shopId: shop.id,
                                          field: 'is_verified',
                                          value: true,
                                        })
                                      }
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Verify Seller
                                    </Button>
                                  )}
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Verify/Unverify */}
                            {!shop.is_verified ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-500 hover:text-green-600"
                                onClick={() =>
                                  updateShopStatus.mutate({
                                    shopId: shop.id,
                                    field: 'is_verified',
                                    value: true,
                                  })
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-yellow-500 hover:text-yellow-600"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke Verification?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will revoke the verification status of "{shop.shop_name}".
                                      The seller will be notified.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        updateShopStatus.mutate({
                                          shopId: shop.id,
                                          field: 'is_verified',
                                          value: false,
                                        })
                                      }
                                      className="bg-yellow-600 hover:bg-yellow-700"
                                    >
                                      Revoke
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            {/* Activate/Deactivate */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={
                                    shop.is_active
                                      ? 'text-red-500 hover:text-red-600'
                                      : 'text-green-500 hover:text-green-600'
                                  }
                                >
                                  {shop.is_active ? (
                                    <XCircle className="h-4 w-4" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {shop.is_active ? 'Deactivate' : 'Activate'} Seller?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {shop.is_active
                                      ? `This will deactivate "${shop.shop_name}". Their products will no longer be visible.`
                                      : `This will activate "${shop.shop_name}". Their products will become visible again.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      updateShopStatus.mutate({
                                        shopId: shop.id,
                                        field: 'is_active',
                                        value: !shop.is_active,
                                      })
                                    }
                                    className={
                                      shop.is_active
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }
                                  >
                                    {shop.is_active ? 'Deactivate' : 'Activate'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
