import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Link, X, Loader2, ImagePlus, Info, GripVertical, Palette } from 'lucide-react';
import { IMAGE_GUIDELINES, processImageForUpload, formatFileSize } from '@/lib/imageUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ProductImage {
  url: string;
  color?: string;
  size?: string;
}

interface ProductImageUploadAdvancedProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  availableColors: string[];
  availableSizes: string[];
}

export default function ProductImageUploadAdvanced({ 
  images, 
  onImagesChange,
  availableColors,
  availableSizes,
}: ProductImageUploadAdvancedProps) {
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const guidelines = IMAGE_GUIDELINES.product;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: ProductImage[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        const { file: processedFile, wasCompressed } = await processImageForUpload(file, 'product');
        
        if (wasCompressed) {
          toast.info(`${file.name} was compressed: ${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)}`);
        }

        const fileExt = processedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, processedFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push({ url: publicUrl });
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} image(s) uploaded`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddUrl = () => {
    const urls = urlInput.split(',').map(s => s.trim()).filter(Boolean);
    if (urls.length === 0) return;

    const validUrls = urls.filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    if (validUrls.length < urls.length) {
      toast.error('Some URLs are invalid');
    }

    if (validUrls.length > 0) {
      const newImages: ProductImage[] = validUrls.map(url => ({ url }));
      onImagesChange([...images, ...newImages]);
      setUrlInput('');
      toast.success(`${validUrls.length} image URL(s) added`);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
    if (editingImageIndex === index) {
      setEditingImageIndex(null);
    }
  };

  const updateImageMetadata = (index: number, field: 'color' | 'size', value: string) => {
    const newImages = [...images];
    newImages[index] = { 
      ...newImages[index], 
      [field]: value === '__none__' ? undefined : value 
    };
    onImagesChange(newImages);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    onImagesChange(newImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <ImagePlus className="h-4 w-4" /> Product Images
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-medium mb-1">{guidelines.label}</p>
              <p className="text-xs">{guidelines.description}</p>
              <p className="text-xs mt-1 text-primary">Drag images to reorder. First image is the main display image.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Size Guidelines Info */}
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">📏 Size Guidelines:</span> {guidelines.description}
          <br />
          <span className="text-primary">Drag to reorder • Link images to colors/sizes for variants</span>
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="text-xs">
            <Upload className="h-3 w-3 mr-1" /> Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs">
            <Link className="h-3 w-3 mr-1" /> URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-3">
          <div 
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading & compressing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag images here
                </p>
                <p className="text-xs text-muted-foreground">
                  Auto-compressed to max {guidelines.maxWidth}×{guidelines.maxHeight}px, {guidelines.maxSizeKB}KB
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-3">
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={handleAddUrl}>
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Separate multiple URLs with commas
          </p>
        </TabsContent>
      </Tabs>

      {/* Image Preview Grid with Drag & Drop */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div
                key={`${img.url}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group aspect-square rounded-lg border-2 overflow-hidden transition-all cursor-move ${
                  draggedIndex === index 
                    ? 'opacity-50 border-primary scale-95' 
                    : 'border-border hover:border-primary/50'
                } ${editingImageIndex === index ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setEditingImageIndex(editingImageIndex === index ? null : index)}
              >
                <img
                  src={img.url}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                
                {/* Drag Handle */}
                <div className="absolute top-1 left-1 p-1 bg-background/80 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                  className="absolute top-1 right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                
                {/* Main Badge */}
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    Main
                  </span>
                )}
                
                {/* Variant Badge */}
                {(img.color || img.size) && (
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    {img.color && (
                      <span className="text-[9px] bg-secondary text-secondary-foreground px-1 py-0.5 rounded">
                        {img.color}
                      </span>
                    )}
                    {img.size && (
                      <span className="text-[9px] bg-accent text-accent-foreground px-1 py-0.5 rounded">
                        {img.size}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Variant Editor Panel */}
          {editingImageIndex !== null && images[editingImageIndex] && (
            <div className="p-3 bg-secondary/50 rounded-lg border border-border space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Palette className="h-4 w-4" />
                Link Image #{editingImageIndex + 1} to Variant
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Color Variant</Label>
                  <Select
                    value={images[editingImageIndex]?.color || '__none__'}
                    onValueChange={(v) => updateImageMetadata(editingImageIndex, 'color', v)}
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No specific color</SelectItem>
                      {availableColors.map((color) => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Size Variant</Label>
                  <Select
                    value={images[editingImageIndex]?.size || '__none__'}
                    onValueChange={(v) => updateImageMetadata(editingImageIndex, 'size', v)}
                  >
                    <SelectTrigger className="mt-1 h-8 text-xs">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No specific size</SelectItem>
                      {availableSizes.map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Linked images will be shown when customers select this color/size combination.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
