/**
 * Image compression and size validation utilities
 */

export interface ImageSizeGuidelines {
  maxWidth: number;
  maxHeight: number;
  maxSizeKB: number;
  label: string;
  description: string;
}

export const IMAGE_GUIDELINES: Record<string, ImageSizeGuidelines> = {
  product: {
    maxWidth: 1200,
    maxHeight: 1200,
    maxSizeKB: 500,
    label: 'Product Image',
    description: 'Recommended: 800×800 to 1200×1200px, max 500KB. Square or 3:4 aspect ratio works best.',
  },
  shopLogo: {
    maxWidth: 400,
    maxHeight: 400,
    maxSizeKB: 200,
    label: 'Shop Logo',
    description: 'Recommended: 200×200 to 400×400px, max 200KB. Square format required.',
  },
  shopBanner: {
    maxWidth: 1920,
    maxHeight: 600,
    maxSizeKB: 800,
    label: 'Shop Banner',
    description: 'Recommended: 1200×400 to 1920×600px, max 800KB. Wide 3:1 aspect ratio.',
  },
  category: {
    maxWidth: 800,
    maxHeight: 1000,
    maxSizeKB: 400,
    label: 'Category Image',
    description: 'Recommended: 600×750 to 800×1000px, max 400KB. 4:5 portrait aspect ratio.',
  },
  collection: {
    maxWidth: 1600,
    maxHeight: 800,
    maxSizeKB: 600,
    label: 'Collection Banner',
    description: 'Recommended: 1200×600 to 1600×800px, max 600KB. 2:1 wide aspect ratio.',
  },
  qrCode: {
    maxWidth: 500,
    maxHeight: 500,
    maxSizeKB: 100,
    label: 'Payment QR Code',
    description: 'Recommended: 300×300 to 500×500px, max 100KB. Square format.',
  },
};

/**
 * Compress an image file to specified dimensions and quality
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Use high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create a new file from the blob
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              { type: 'image/jpeg' }
            );
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}

/**
 * Process image: compress if needed based on guidelines
 */
export async function processImageForUpload(
  file: File,
  imageType: keyof typeof IMAGE_GUIDELINES
): Promise<{ file: File; wasCompressed: boolean }> {
  const guidelines = IMAGE_GUIDELINES[imageType];
  
  if (!guidelines) {
    return { file, wasCompressed: false };
  }
  
  const maxSizeBytes = guidelines.maxSizeKB * 1024;
  
  // If file is already small enough, return as-is
  if (file.size <= maxSizeBytes) {
    return { file, wasCompressed: false };
  }
  
  // Compress the image
  const compressedFile = await compressImage(
    file,
    guidelines.maxWidth,
    guidelines.maxHeight,
    0.85
  );
  
  // If still too large, try with lower quality
  if (compressedFile.size > maxSizeBytes) {
    const furtherCompressed = await compressImage(
      file,
      guidelines.maxWidth,
      guidelines.maxHeight,
      0.7
    );
    return { file: furtherCompressed, wasCompressed: true };
  }
  
  return { file: compressedFile, wasCompressed: true };
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
