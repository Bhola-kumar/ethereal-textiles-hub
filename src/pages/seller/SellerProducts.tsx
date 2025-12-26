import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Package, Search, ImagePlus, X, Save } from 'lucide-react';
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
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
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
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

      resetForm();
      setShowForm(false);
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
      if (editingProduct?.id === id) {
        handleCloseForm();
      }
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
      {/* Left Panel - Products List */}
      <motion.div 
        className={`flex-1 flex flex-col min-w-0 ${showForm ? 'hidden lg:flex' : 'flex'}`}
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">My Products</h1>
          <Button variant="hero" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />Add Product
          </Button>
        </div>

        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>

        <Card className="flex-1 bg-card border-border/50 overflow-hidden">
          <CardContent className="p-0 h-full">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No products yet</p>
                <Button variant="outline" onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Product
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="divide-y divide-border">
                  {filteredProducts.map(product => (
                    <motion.div
                      key={product.id}
                      className={`p-4 hover:bg-accent/30 cursor-pointer transition-colors ${
                        editingProduct?.id === product.id ? 'bg-accent/50 border-l-2 border-primary' : ''
                      }`}
                      onClick={() => handleEdit(product)}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-4">
                        {product.images?.[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name} 
                            className="w-14 h-14 object-cover rounded-lg" 
                          />
                        ) : (
                          <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-primary font-semibold">
                              ₹{Number(product.price).toLocaleString()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              product.stock > 10 
                                ? 'bg-green-500/20 text-green-500' 
                                : product.stock > 0 
                                  ? 'bg-yellow-500/20 text-yellow-500' 
                                  : 'bg-red-500/20 text-red-500'
                            }`}>
                              {product.stock} stock
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              product.is_published 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {product.is_published ? 'Live' : 'Draft'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Right Panel - Product Form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <Card className="h-full bg-card border-border/50 flex flex-col">
              <CardHeader className="flex-shrink-0 border-b border-border/50 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-display">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <Label className="text-sm font-medium">Product Name *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        placeholder="e.g., Traditional Bengali Gamchha"
                        className="mt-1.5"
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Describe your product in detail..."
                        rows={3}
                        className="mt-1.5"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Price (₹) *</Label>
                        <Input 
                          type="number" 
                          value={formData.price} 
                          onChange={e => setFormData({...formData, price: e.target.value})} 
                          placeholder="299"
                          className="mt-1.5"
                          required 
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">MRP (₹)</Label>
                        <Input 
                          type="number" 
                          value={formData.original_price} 
                          onChange={e => setFormData({...formData, original_price: e.target.value})} 
                          placeholder="499"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Stock *</Label>
                        <Input 
                          type="number" 
                          value={formData.stock} 
                          onChange={e => setFormData({...formData, stock: e.target.value})} 
                          placeholder="50"
                          className="mt-1.5"
                          required 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Fabric</Label>
                        <Input 
                          value={formData.fabric} 
                          onChange={e => setFormData({...formData, fabric: e.target.value})} 
                          placeholder="100% Cotton"
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Color</Label>
                        <Input 
                          value={formData.color} 
                          onChange={e => setFormData({...formData, color: e.target.value})} 
                          placeholder="Red & White"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Pattern</Label>
                        <Input 
                          value={formData.pattern} 
                          onChange={e => setFormData({...formData, pattern: e.target.value})} 
                          placeholder="Checkered"
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <ImagePlus className="h-4 w-4" /> Image URLs
                      </Label>
                      <Textarea 
                        value={formData.images} 
                        onChange={e => setFormData({...formData, images: e.target.value})} 
                        placeholder="https://image1.jpg, https://image2.jpg"
                        rows={2}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Separate multiple URLs with commas</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Care Instructions</Label>
                      <Input 
                        value={formData.care_instructions} 
                        onChange={e => setFormData({...formData, care_instructions: e.target.value})} 
                        placeholder="Machine wash cold, Tumble dry low"
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Separate with commas</p>
                    </div>

                    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                      <Label className="text-sm font-medium text-foreground">Visibility</Label>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Published</Label>
                        <Switch 
                          checked={formData.is_published} 
                          onCheckedChange={v => setFormData({...formData, is_published: v})} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Mark as New</Label>
                        <Switch 
                          checked={formData.is_new} 
                          onCheckedChange={v => setFormData({...formData, is_new: v})} 
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Trending</Label>
                        <Switch 
                          checked={formData.is_trending} 
                          onCheckedChange={v => setFormData({...formData, is_trending: v})} 
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={handleCloseForm}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        variant="hero" 
                        className="flex-1" 
                        disabled={isSubmitting}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State for Desktop when form is hidden */}
      {!showForm && (
        <div className="hidden lg:flex w-[480px] xl:w-[520px] flex-shrink-0 items-center justify-center">
          <Card className="bg-card/50 border-dashed border-2 border-border/50 w-full h-full flex items-center justify-center">
            <div className="text-center p-8">
              <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Select a product to edit<br/>or add a new one</p>
              <Button variant="outline" onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
