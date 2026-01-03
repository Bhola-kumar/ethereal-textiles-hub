import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Search, Image, X, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useFormPersistence, createFormKey } from '@/hooks/useFormPersistence';

interface FeaturedCollection {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string;
  link_text: string;
  badge_text: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

interface CollectionFormData {
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  link_url: string;
  link_text: string;
  badge_text: string;
  display_order: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const initialFormData: CollectionFormData = {
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  link_url: '/products',
  link_text: 'Explore Collection',
  badge_text: '',
  display_order: '0',
  is_active: true,
  start_date: '',
  end_date: '',
};

export default function AdminCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<FeaturedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<FeaturedCollection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form persistence
  const { formData, setFormData, clearPersistedData } = useFormPersistence<CollectionFormData>(
    createFormKey('admin_collection', editingCollection?.id),
    initialFormData
  );

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    const { data, error } = await supabase
      .from('featured_collections')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setCollections(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    clearPersistedData();
    setEditingCollection(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (collection: FeaturedCollection) => {
    setEditingCollection(collection);
    setFormData({
      title: collection.title,
      subtitle: collection.subtitle || '',
      description: collection.description || '',
      image_url: collection.image_url || '',
      link_url: collection.link_url,
      link_text: collection.link_text,
      badge_text: collection.badge_text || '',
      display_order: collection.display_order.toString(),
      is_active: collection.is_active,
      start_date: collection.start_date ? collection.start_date.slice(0, 16) : '',
      end_date: collection.end_date ? collection.end_date.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const collectionData = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim() || null,
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        link_url: formData.link_url.trim() || '/products',
        link_text: formData.link_text.trim() || 'Explore Collection',
        badge_text: formData.badge_text.trim() || null,
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active,
        start_date: formData.start_date || new Date().toISOString(),
        end_date: formData.end_date || null,
        created_by: user!.id,
      };

      if (editingCollection) {
        const { error } = await supabase
          .from('featured_collections')
          .update(collectionData)
          .eq('id', editingCollection.id);
        if (error) throw error;
        toast.success('Collection updated successfully');
      } else {
        const { error } = await supabase
          .from('featured_collections')
          .insert(collectionData);
        if (error) throw error;
        toast.success('Collection created successfully');
      }

      resetForm();
      setShowForm(false);
      fetchCollections();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    const { error } = await supabase
      .from('featured_collections')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete collection');
    } else {
      toast.success('Collection deleted');
      if (editingCollection?.id === id) {
        handleCloseForm();
      }
      fetchCollections();
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('featured_collections')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      fetchCollections();
    }
  };

  const filteredCollections = collections.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
      {/* Left Panel - Collections List */}
      <motion.div
        className={`flex-1 flex flex-col min-w-0 ${showForm ? 'hidden lg:flex' : 'flex'}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Featured Collections</h1>
            <p className="text-muted-foreground text-sm">Manage promotional banners on the homepage</p>
          </div>
          <Button variant="hero" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />Add Collection
          </Button>
        </div>

        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
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
            ) : filteredCollections.length === 0 ? (
              <div className="text-center py-12">
                <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No collections yet</p>
                <Button variant="outline" onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" /> Create Your First Collection
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="divide-y divide-border">
                  {filteredCollections.map(collection => (
                    <motion.div
                      key={collection.id}
                      className={`p-4 hover:bg-accent/30 cursor-pointer transition-colors ${
                        editingCollection?.id === collection.id ? 'bg-accent/50 border-l-2 border-primary' : ''
                      }`}
                      onClick={() => handleEdit(collection)}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-4">
                        {collection.image_url ? (
                          <img
                            src={collection.image_url}
                            alt={collection.title}
                            className="w-20 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Image className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">{collection.title}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              collection.is_active 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {collection.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {collection.subtitle || collection.link_url}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleEdit(collection); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); handleDelete(collection.id); }}
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

      {/* Right Panel - Collection Form */}
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
                    {editingCollection ? 'Edit Collection' : 'New Collection'}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1">
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Assamese Gamosa Collection"
                      required
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={formData.subtitle}
                      onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g., Traditional Bihu Gamosa"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this collection..."
                      rows={3}
                    />
                  </div>

                  {/* Badge Text */}
                  <div className="space-y-2">
                    <Label>Badge Text</Label>
                    <Input
                      value={formData.badge_text}
                      onChange={e => setFormData({ ...formData, badge_text: e.target.value })}
                      placeholder="e.g., Featured Collection"
                    />
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <Label>Banner Image URL</Label>
                    <Input
                      value={formData.image_url}
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                    />
                    {formData.image_url && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/800x300?text=Invalid+Image';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Link Settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Link URL *</Label>
                      <Input
                        value={formData.link_url}
                        onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                        placeholder="/products?category=..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        value={formData.link_text}
                        onChange={e => setFormData({ ...formData, link_text: e.target.value })}
                        placeholder="Explore Collection"
                      />
                    </div>
                  </div>

                  {/* Display Order */}
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={e => setFormData({ ...formData, display_order: e.target.value })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                    <div>
                      <Label>Active</Label>
                      <p className="text-xs text-muted-foreground">Show this collection on homepage</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={checked => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>

                  {/* Submit Buttons */}
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
                          {editingCollection ? 'Update' : 'Create'}
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
