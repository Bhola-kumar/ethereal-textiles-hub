import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Package, Search, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  images: string[] | null;
  is_published: boolean;
  is_trending: boolean;
  is_new: boolean;
  fabric: string | null;
  color: string | null;
  pattern: string | null;
  category_id: string | null;
  care_instructions: string[] | null;
}

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive('Price must be positive'),
  original_price: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0),
  fabric: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  pattern: z.string().max(100).optional(),
  care_instructions: z.string().max(1000).optional(),
});

export default function SellerProducts() {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category_id: '',
    fabric: '',
    color: '',
    pattern: '',
    stock: '',
    images: '',
    care_instructions: '',
    is_published: false,
    is_trending: false,
    is_new: true,
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', price: '', original_price: '',
      category_id: '', fabric: '', color: '', pattern: '', stock: '',
      images: '', care_instructions: '', is_published: false, is_trending: false, is_new: true,
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category_id: product.category_id || '',
      fabric: product.fabric || '',
      color: product.color || '',
      pattern: product.pattern || '',
      stock: product.stock.toString(),
      images: product.images?.join(', ') || '',
      care_instructions: product.care_instructions?.join(', ') || '',
      is_published: product.is_published || false,
      is_trending: product.is_trending || false,
      is_new: product.is_new || false,
    });
    setIsDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedPrice = parseFloat(formData.price);
    const parsedOriginalPrice = formData.original_price ? parseFloat(formData.original_price) : null;
    const parsedStock = parseInt(formData.stock) || 0;
    
    const result = productSchema.safeParse({
      name: formData.name,
      description: formData.description,
      price: parsedPrice,
      original_price: parsedOriginalPrice,
      stock: parsedStock,
      fabric: formData.fabric,
      color: formData.color,
      pattern: formData.pattern,
      care_instructions: formData.care_instructions,
    });

    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrls = formData.images.split(',').map(s => s.trim()).filter(Boolean);
      const careInstructions = formData.care_instructions.split(',').map(s => s.trim()).filter(Boolean);

      const productData = {
        name: formData.name.trim(),
        slug: editingProduct?.slug || generateSlug(formData.name) + '-' + Date.now(),
        description: formData.description.trim() || null,
        price: parsedPrice,
        original_price: parsedOriginalPrice,
        category_id: formData.category_id || null,
        fabric: formData.fabric.trim() || null,
        color: formData.color.trim() || null,
        pattern: formData.pattern.trim() || null,
        stock: parsedStock,
        images: imageUrls.length > 0 ? imageUrls : null,
        care_instructions: careInstructions.length > 0 ? careInstructions : null,
        is_published: formData.is_published,
        is_trending: formData.is_trending,
        is_new: formData.is_new,
        seller_id: user!.id,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
        toast.success('Product created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted');
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">My Products</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="hero"><Plus className="h-4 w-4 mr-2" />Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g., Traditional Bengali Gamchha"
                    required 
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Describe your product in detail..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Price (₹) *</Label>
                    <Input 
                      type="number" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      placeholder="299"
                      required 
                    />
                  </div>
                  <div>
                    <Label>Original Price (₹)</Label>
                    <Input 
                      type="number" 
                      value={formData.original_price} 
                      onChange={e => setFormData({...formData, original_price: e.target.value})} 
                      placeholder="499"
                    />
                  </div>
                  <div>
                    <Label>Stock *</Label>
                    <Input 
                      type="number" 
                      value={formData.stock} 
                      onChange={e => setFormData({...formData, stock: e.target.value})} 
                      placeholder="50"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fabric</Label>
                    <Input 
                      value={formData.fabric} 
                      onChange={e => setFormData({...formData, fabric: e.target.value})} 
                      placeholder="100% Cotton"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Color</Label>
                    <Input 
                      value={formData.color} 
                      onChange={e => setFormData({...formData, color: e.target.value})} 
                      placeholder="Red & White"
                    />
                  </div>
                  <div>
                    <Label>Pattern</Label>
                    <Input 
                      value={formData.pattern} 
                      onChange={e => setFormData({...formData, pattern: e.target.value})} 
                      placeholder="Checkered"
                    />
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" /> Image URLs
                  </Label>
                  <Textarea 
                    value={formData.images} 
                    onChange={e => setFormData({...formData, images: e.target.value})} 
                    placeholder="https://image1.jpg, https://image2.jpg"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separate multiple URLs with commas</p>
                </div>

                <div>
                  <Label>Care Instructions</Label>
                  <Input 
                    value={formData.care_instructions} 
                    onChange={e => setFormData({...formData, care_instructions: e.target.value})} 
                    placeholder="Machine wash cold, Tumble dry low"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
                </div>

                <div className="flex flex-wrap gap-6 py-2">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={formData.is_published} 
                      onCheckedChange={v => setFormData({...formData, is_published: v})} 
                    />
                    <Label>Published</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={formData.is_new} 
                      onCheckedChange={v => setFormData({...formData, is_new: v})} 
                    />
                    <Label>Mark as New</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={formData.is_trending} 
                      onCheckedChange={v => setFormData({...formData, is_trending: v})} 
                    />
                    <Label>Trending</Label>
                  </div>
                </div>

                <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search your products..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>

        <Card className="bg-card border-border/50">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No products yet</p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Price</th>
                      <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Stock</th>
                      <th className="text-left px-4 lg:px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-4 lg:px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.fabric}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 hidden sm:table-cell">
                          <div>
                            <p className="font-medium text-foreground">₹{Number(product.price).toLocaleString()}</p>
                            {product.original_price && (
                              <p className="text-xs text-muted-foreground line-through">
                                ₹{Number(product.original_price).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 hidden md:table-cell">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.stock > 10 
                              ? 'bg-green-500/20 text-green-500' 
                              : product.stock > 0 
                                ? 'bg-yellow-500/20 text-yellow-500' 
                                : 'bg-red-500/20 text-red-500'
                          }`}>
                            {product.stock} in stock
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.is_published 
                              ? 'bg-green-500/20 text-green-500' 
                              : 'bg-gray-500/20 text-gray-500'
                          }`}>
                            {product.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
