import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  originalPrice?: number; // For backward compatibility
  image?: string;
  images?: string[] | null;
  category?: string;
  category_id?: string | null;
  fabric?: string | null;
  color?: string | null;
  pattern?: string | null;
  rating?: number | null;
  reviews?: number;
  reviews_count?: number | null;
  description?: string | null;
  care?: string[];
  care_instructions?: string[] | null;
  inStock?: boolean;
  stock?: number | null;
  is_new?: boolean | null;
  isNew?: boolean;
  is_trending?: boolean | null;
  isTrending?: boolean;
  slug?: string;
  seller_id?: string | null;
  shop_name?: string;
  shop_slug?: string;
  shop_logo_url?: string | null;
  shop_is_verified?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface WishlistItem extends Product {}

// Helper to get the main image from a product
export const getProductImage = (product: Product): string => {
  if (product.image) return product.image;
  if (product.images && product.images.length > 0) return product.images[0];
  return '/placeholder.svg';
};

// Helper to check if product is in stock
export const isProductInStock = (product: Product): boolean => {
  if (typeof product.inStock === 'boolean') return product.inStock;
  if (typeof product.stock === 'number') return product.stock > 0;
  return true;
};

// Helper to get original price
export const getOriginalPrice = (product: Product): number | undefined => {
  return product.originalPrice || product.original_price || undefined;
};

// Helper to check if new
export const isProductNew = (product: Product): boolean => {
  return product.isNew || product.is_new || false;
};

// Helper to check if trending
export const isProductTrending = (product: Product): boolean => {
  return product.isTrending || product.is_trending || false;
};

// Helper to get reviews count
export const getReviewsCount = (product: Product): number => {
  return product.reviews || product.reviews_count || 0;
};

// Helper to get care instructions
export const getCareInstructions = (product: Product): string[] => {
  return product.care || product.care_instructions || [];
};

interface CartStore {
  items: CartItem[];
  wishlist: WishlistItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isInCart: (productId: string) => boolean;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      
      addToCart: (product) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      addToWishlist: (product) => {
        set((state) => {
          if (state.wishlist.find((item) => item.id === product.id)) {
            return state;
          }
          return { wishlist: [...state.wishlist, product] };
        });
      },

      removeFromWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== productId),
        }));
      },

      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.id === productId);
      },

      isInCart: (productId) => {
        return get().items.some((item) => item.id === productId);
      },

      getCartTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'gamchha-cart',
    }
  )
);
