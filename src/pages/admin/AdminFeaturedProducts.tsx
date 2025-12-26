import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Star, 
  Plus, 
  Trash2, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  ArrowUpDown,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FeaturedProduct {
  id: string;
  product_id: string;
  added_by: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  display_order: number;
  notes: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
    shop_name?: string;
  };
}

interface FeatureRequest {
  id: string;
  product_id: string;
  seller_id: string;
  request_message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[] | null;
  };
  seller_profile?: {
    full_name: string;
    email: string;
  };
}

interface ProductForSelection {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  shop_name: string | null;
  seller_id: string;
}

export default function AdminFeaturedProducts() {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [allProducts, setAllProducts] = useState<ProductForSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Add featured product form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchFeaturedProducts(),
      fetchFeatureRequests(),
      fetchAllProducts()
    ]);
    setLoading(false);
  };

  const fetchFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from('featured_products')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching featured products:', error);
      return;
    }

    // Fetch product details for each featured product
    if (data && data.length > 0) {
      const productIds = data.map(fp => fp.product_id);
      const { data: products } = await supabase
        .from('products_with_shop')
        .select('id, name, price, images, shop_name')
        .in('id', productIds);

      const enrichedData = data.map(fp => ({
        ...fp,
        product: products?.find(p => p.id === fp.product_id)
      }));

      setFeaturedProducts(enrichedData);
    } else {
      setFeaturedProducts([]);
    }
  };

  const fetchFeatureRequests = async () => {
    const { data, error } = await supabase
      .from('featured_product_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching feature requests:', error);
      return;
    }

    if (data && data.length > 0) {
      // Fetch product and seller details
      const productIds = data.map(r => r.product_id);
      const sellerIds = [...new Set(data.map(r => r.seller_id))];

      const [productsRes, profilesRes] = await Promise.all([
        supabase.from('products').select('id, name, price, images').in('id', productIds),
        supabase.from('profiles').select('user_id, full_name, email').in('user_id', sellerIds)
      ]);

      const enrichedData = data.map(r => ({
        ...r,
        status: r.status as 'pending' | 'approved' | 'rejected',
        product: productsRes.data?.find(p => p.id === r.product_id),
        seller_profile: profilesRes.data?.find(p => p.user_id === r.seller_id)
      }));

      setFeatureRequests(enrichedData);
    } else {
      setFeatureRequests([]);
    }
  };

  const fetchAllProducts = async () => {
    const { data, error } = await supabase
      .from('products_with_shop')
      .select('id, name, price, images, shop_name, seller_id')
      .eq('is_published', true);

    if (!error && data) {
      setAllProducts(data as ProductForSelection[]);
    }
  };

  const handleAddFeaturedProduct = async () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    const { error } = await supabase
      .from('featured_products')
      .insert({
        product_id: selectedProductId,
        added_by: user!.id,
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || null,
        display_order: parseInt(displayOrder) || 0,
        notes: notes || null,
        is_active: true
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('This product is already featured');
      } else {
        toast.error('Failed to add featured product');
      }
      return;
    }

    toast.success('Product added to featured list');
    setShowAddDialog(false);
    resetForm();
    fetchFeaturedProducts();
  };

  const handleRemoveFeaturedProduct = async (id: string) => {
    const { error } = await supabase
      .from('featured_products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove featured product');
      return;
    }

    toast.success('Product removed from featured list');
    fetchFeaturedProducts();
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('featured_products')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    fetchFeaturedProducts();
  };

  const handleReviewRequest = (request: FeatureRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setShowReviewDialog(true);
  };

  const sendNotificationEmail = async (
    sellerEmail: string,
    sellerName: string,
    productName: string,
    status: 'approved' | 'rejected',
    notes: string
  ) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-feature-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            sellerEmail,
            sellerName,
            productName,
            status,
            adminNotes: notes,
          }),
        }
      );

      if (!response.ok) {
        console.error('Failed to send notification email');
      } else {
        console.log('Notification email sent successfully');
      }
    } catch (error) {
      console.error('Error sending notification email:', error);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    // Update request status
    const { error: updateError } = await supabase
      .from('featured_product_requests')
      .update({
        status: 'approved',
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user!.id
      })
      .eq('id', selectedRequest.id);

    if (updateError) {
      toast.error('Failed to approve request');
      return;
    }

    // Add to featured products
    const { error: insertError } = await supabase
      .from('featured_products')
      .insert({
        product_id: selectedRequest.product_id,
        added_by: user!.id,
        is_active: true,
        notes: `Approved from seller request: ${adminNotes || 'No notes'}`
      });

    if (insertError && insertError.code !== '23505') {
      console.error('Error adding to featured:', insertError);
    }

    // Send notification email to seller
    if (selectedRequest.seller_profile?.email) {
      sendNotificationEmail(
        selectedRequest.seller_profile.email,
        selectedRequest.seller_profile.full_name || 'Seller',
        selectedRequest.product?.name || 'Your product',
        'approved',
        adminNotes
      );
    }

    toast.success('Request approved and product featured');
    setShowReviewDialog(false);
    setSelectedRequest(null);
    fetchData();
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    const { error } = await supabase
      .from('featured_product_requests')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user!.id
      })
      .eq('id', selectedRequest.id);

    if (error) {
      toast.error('Failed to reject request');
      return;
    }

    // Send notification email to seller
    if (selectedRequest.seller_profile?.email) {
      sendNotificationEmail(
        selectedRequest.seller_profile.email,
        selectedRequest.seller_profile.full_name || 'Seller',
        selectedRequest.product?.name || 'Your product',
        'rejected',
        adminNotes
      );
    }

    toast.success('Request rejected');
    setShowReviewDialog(false);
    setSelectedRequest(null);
    fetchFeatureRequests();
  };

  const resetForm = () => {
    setSelectedProductId('');
    setStartDate('');
    setEndDate('');
    setDisplayOrder('0');
    setNotes('');
  };

  const pendingRequests = featureRequests.filter(r => r.status === 'pending');
  const processedRequests = featureRequests.filter(r => r.status !== 'pending');

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.shop_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Featured Products</h1>
          <p className="text-muted-foreground">Manage featured products and review seller requests</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Featured Product
        </Button>
      </div>

      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList>
          <TabsTrigger value="featured" className="gap-2">
            <Star className="h-4 w-4" />
            Featured Products ({featuredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            Seller Requests 
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Currently Featured</CardTitle>
              <CardDescription>Products displayed in the featured section on the homepage</CardDescription>
            </CardHeader>
            <CardContent>
              {featuredProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No featured products yet.</p>
                  <p className="text-sm">Add products to display them on the homepage.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featuredProducts.map((fp) => (
                      <TableRow key={fp.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {fp.product?.images?.[0] && (
                              <img 
                                src={fp.product.images[0]} 
                                alt={fp.product.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{fp.product?.name || 'Unknown Product'}</p>
                              <p className="text-sm text-muted-foreground">₹{fp.product?.price}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{fp.product?.shop_name || '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>From: {format(new Date(fp.start_date), 'MMM dd, yyyy')}</p>
                            {fp.end_date ? (
                              <p className="text-muted-foreground">To: {format(new Date(fp.end_date), 'MMM dd, yyyy')}</p>
                            ) : (
                              <p className="text-muted-foreground">No end date</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{fp.display_order}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={fp.is_active}
                            onCheckedChange={() => handleToggleActive(fp.id, fp.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveFeaturedProduct(fp.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-6">
            {/* Pending Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Requests ({pendingRequests.length})
                </CardTitle>
                <CardDescription>Seller requests awaiting your review</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No pending requests</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {request.product?.images?.[0] && (
                                <img 
                                  src={request.product.images[0]} 
                                  alt={request.product.name}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{request.product?.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">₹{request.product?.price}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.seller_profile?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{request.seller_profile?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {request.request_message || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(request.requested_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReviewRequest(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Request History</CardTitle>
                  <CardDescription>Previously reviewed requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reviewed</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>{request.product?.name || 'Unknown'}</TableCell>
                          <TableCell>{request.seller_profile?.full_name || 'Unknown'}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {request.reviewed_at 
                              ? format(new Date(request.reviewed_at), 'MMM dd, yyyy')
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {request.admin_notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Featured Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Featured Product</DialogTitle>
            <DialogDescription>
              Select a product to feature on the homepage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product or shop name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="max-h-[200px] overflow-y-auto border rounded-lg">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors ${
                    selectedProductId === product.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                  onClick={() => setSelectedProductId(product.id)}
                >
                  {product.images?.[0] && (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.shop_name} • ₹{product.price}</p>
                  </div>
                  {selectedProductId === product.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFeaturedProduct}>
                Add to Featured
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Request Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Feature Request</DialogTitle>
            <DialogDescription>
              Approve or reject this seller's request to feature their product
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-accent rounded-lg">
                {selectedRequest.product?.images?.[0] && (
                  <img 
                    src={selectedRequest.product.images[0]} 
                    alt={selectedRequest.product.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{selectedRequest.product?.name}</p>
                  <p className="text-sm text-muted-foreground">₹{selectedRequest.product?.price}</p>
                  <p className="text-sm text-muted-foreground">
                    By: {selectedRequest.seller_profile?.full_name}
                  </p>
                </div>
              </div>

              {selectedRequest.request_message && (
                <div>
                  <Label>Seller's Message</Label>
                  <p className="text-sm p-3 bg-muted rounded-lg mt-1">
                    {selectedRequest.request_message}
                  </p>
                </div>
              )}

              <div>
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for this decision..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReviewDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleRejectRequest}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button onClick={handleApproveRequest}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve & Feature
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}