import { useState } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
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
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { toast } from 'sonner';

// Zod schema for product validation
const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  slug: z.string().trim().max(250, 'Slug must be less than 250 characters').regex(/^[a-z0-9-]*$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional().or(z.literal('')),
  description: z.string().trim().max(5000, 'Description must be less than 5000 characters').optional().or(z.literal('')),
  price: z.number().positive('Price must be a positive number').max(10000000, 'Price is too high'),
  original_price: z.number().positive('Original price must be positive').max(10000000, 'Original price is too high').nullable().optional(),
  category_id: z.string().uuid('Invalid category').nullable().optional().or(z.literal('')),
  fabric: z.string().trim().max(100, 'Fabric must be less than 100 characters').optional().or(z.literal('')),
  color: z.string().trim().max(50, 'Color must be less than 50 characters').optional().or(z.literal('')),
  pattern: z.string().trim().max(100, 'Pattern must be less than 100 characters').optional().or(z.literal('')),
  stock: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').max(1000000, 'Stock is too high'),
  images: z.array(z.string().url('Invalid image URL')).max(20, 'Too many images'),
  is_published: z.boolean(),
  is_trending: z.boolean(),
  is_new: z.boolean(),
});

// Helper to sanitize text input (remove potential XSS vectors)
const sanitizeText = (text: string): string => {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

// Helper to generate a safe slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
};

export default function AdminProducts() {
  const { user } = useAuth();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    original_price: '',
    category_id: '',
    fabric: '',
    color: '',
    pattern: '',
    stock: '',
    images: '',
    is_published: false,
    is_trending: false,
    is_new: true,
  });

  const resetForm = () => {
    setFormData({
      name: '', slug: '', description: '', price: '', original_price: '',
      category_id: '', fabric: '', color: '', pattern: '', stock: '',
      images: '', is_published: false, is_trending: false, is_new: true,
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category_id: product.category_id || '',
      fabric: product.fabric || '',
      color: product.color || '',
      pattern: product.pattern || '',
      stock: product.stock.toString(),
      images: product.images?.join(', ') || '',
      is_published: product.is_published,
      is_trending: product.is_trending,
      is_new: product.is_new,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse and sanitize input values
    const parsedPrice = parseFloat(formData.price);
    const parsedOriginalPrice = formData.original_price ? parseFloat(formData.original_price) : null;
    const parsedStock = parseInt(formData.stock) || 0;
    const imageUrls = formData.images.split(',').map(s => s.trim()).filter(Boolean);
    
    // Build product data with sanitized values
    const rawProductData = {
      name: sanitizeText(formData.name),
      slug: formData.slug ? sanitizeText(formData.slug) : generateSlug(formData.name),
      description: sanitizeText(formData.description),
      price: parsedPrice,
      original_price: parsedOriginalPrice,
      category_id: formData.category_id || null,
      fabric: sanitizeText(formData.fabric),
      color: sanitizeText(formData.color),
      pattern: sanitizeText(formData.pattern),
      stock: parsedStock,
      images: imageUrls,
      is_published: formData.is_published,
      is_trending: formData.is_trending,
      is_new: formData.is_new,
    };

    // Validate with zod schema
    const validationResult = productSchema.safeParse(rawProductData);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors;
      const errorMessage = errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      toast.error('Validation Error', { description: errorMessage });
      return;
    }

    const productData = {
      name: validationResult.data.name,
      slug: validationResult.data.slug || generateSlug(validationResult.data.name),
      description: validationResult.data.description || null,
      price: validationResult.data.price,
      original_price: validationResult.data.original_price || null,
      category_id: validationResult.data.category_id || null,
      fabric: validationResult.data.fabric || null,
      color: validationResult.data.color || null,
      pattern: validationResult.data.pattern || null,
      stock: validationResult.data.stock,
      images: validationResult.data.images,
      is_published: validationResult.data.is_published,
      is_trending: validationResult.data.is_trending,
      is_new: validationResult.data.is_new,
      seller_id: user?.id,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
      } else {
        await createProduct.mutateAsync(productData);
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error is already handled by mutation hooks
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(id);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Products</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="hero"><Plus className="h-4 w-4 mr-2" />Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Name *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                  <div><Label>Slug</Label><Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="auto-generated" /></div>
                </div>
                <div><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Price *</Label><Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required /></div>
                  <div><Label>Original Price</Label><Input type="number" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} /></div>
                  <div><Label>Stock *</Label><Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Category</Label>
                    <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Fabric</Label><Input value={formData.fabric} onChange={e => setFormData({...formData, fabric: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Color</Label><Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} /></div>
                  <div><Label>Pattern</Label><Input value={formData.pattern} onChange={e => setFormData({...formData, pattern: e.target.value})} /></div>
                </div>
                <div><Label>Images (comma separated URLs)</Label><Textarea value={formData.images} onChange={e => setFormData({...formData, images: e.target.value})} placeholder="https://image1.jpg, https://image2.jpg" /></div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch checked={formData.is_published} onCheckedChange={v => setFormData({...formData, is_published: v})} /><Label>Published</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={formData.is_trending} onCheckedChange={v => setFormData({...formData, is_trending: v})} /><Label>Trending</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={formData.is_new} onCheckedChange={v => setFormData({...formData, is_new: v})} /><Label>New</Label></div>
                </div>
                <Button type="submit" variant="hero" className="w-full">{editingProduct ? 'Update' : 'Create'} Product</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <Card className="bg-card border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12"><Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No products found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Product</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Price</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Stock</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" crossOrigin="anonymous" />}
                            <div><p className="font-medium text-foreground">{product.name}</p><p className="text-sm text-muted-foreground">{product.fabric}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">₹{Number(product.price).toLocaleString()}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${product.stock > 10 ? 'bg-green-500/20 text-green-500' : product.stock > 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>{product.stock} in stock</span></td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${product.is_published ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>{product.is_published ? 'Published' : 'Draft'}</span></td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
