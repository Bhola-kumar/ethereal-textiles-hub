import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Search, FolderOpen, X, Save, ImagePlus, Upload, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { IMAGE_GUIDELINES, processImageForUpload, formatFileSize } from '@/lib/imageUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFormPersistence, createFormKey } from '@/hooks/useFormPersistence';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  image_url: string;
}

const initialFormData: CategoryFormData = {
  name: '',
  description: '',
  image_url: '',
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Form persistence
  const { formData, setFormData, clearPersistedData } = useFormPersistence<CategoryFormData>(
    createFormKey('admin_category', editingCategory?.id),
    initialFormData
  );

  const guidelines = IMAGE_GUIDELINES.category;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 200);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    clearPersistedData();
    setEditingCategory(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const { file: processedFile, wasCompressed } = await processImageForUpload(file, 'category');
      if (wasCompressed) {
        toast.info(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`);
      }

      const fileExt = processedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `category-${Date.now()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error('Failed to upload: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryData = {
        name: formData.name.trim(),
        slug: editingCategory?.slug || generateSlug(formData.name) + '-' + Date.now(),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);
        if (error) throw error;
        toast.success('Category created successfully');
      }

      resetForm();
      setShowForm(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Products using this category will have their category unset.')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete category');
    } else {
      toast.success('Category deleted');
      if (editingCategory?.id === id) {
        handleCloseForm();
      }
      fetchCategories();
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
      {/* Left Panel - Categories List */}
      <motion.div
        className={`flex-1 flex flex-col min-w-0 ${showForm ? 'hidden lg:flex' : 'flex'}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Categories</h1>
          <Button variant="hero" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />Add Category
          </Button>
        </div>

        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
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
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No categories yet</p>
                <Button variant="outline" onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Category
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="divide-y divide-border">
                  {filteredCategories.map(category => (
                    <motion.div
                      key={category.id}
                      className={`p-4 hover:bg-accent/30 cursor-pointer transition-colors ${
                        editingCategory?.id === category.id ? 'bg-accent/50 border-l-2 border-primary' : ''
                      }`}
                      onClick={() => handleEdit(category)}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-4">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-14 h-14 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                            <FolderOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{category.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {category.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
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

      {/* Right Panel - Category Form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <Card className="h-full bg-card border-border/50 flex flex-col">
              <CardHeader className="flex-shrink-0 border-b border-border/50 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-display">
                    {editingCategory ? 'Edit Category' : 'New Category'}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Traditional Gamchhas"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this category..."
                      rows={3}
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="image_url">Category Image</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="text-xs">{guidelines.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground">{guidelines.description}</p>
                    
                    {formData.image_url ? (
                      <div className="relative">
                        <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-border" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {uploadingImage ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="Or paste image URL..."
                        className="flex-1"
                      />
                    </div>
                    
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
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
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-background" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingCategory ? 'Update' : 'Create'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
