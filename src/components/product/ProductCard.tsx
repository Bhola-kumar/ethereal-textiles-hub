import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Store, CheckCircle, Zap, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddToCart } from '@/hooks/useCart';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import DeliveryEstimate from '@/components/common/DeliveryEstimate';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  images?: string[] | null;
  category_id?: string | null;
  fabric?: string | null;
  color?: string | null;
  pattern?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  description?: string | null;
  stock?: number | null;
  is_new?: boolean | null;
  is_trending?: boolean | null;
  slug?: string;
  seller_id?: string | null;
  shop_name?: string | null;
  shop_slug?: string | null;
  shop_logo_url?: string | null;
  shop_is_verified?: boolean | null;
  deliverable_pincodes?: string[] | null;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: wishlist = [] } = useWishlist();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const inWishlist = wishlist.some(item => item.product_id === product.id);
  const productImage = product.images?.[0] || '/placeholder.svg';
  const inStock = (product.stock || 0) > 0;
  const originalPrice = product.original_price;
  const isNew = product.is_new;
  const isTrending = product.is_trending;
  const reviewsCount = product.reviews_count || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }
    addToCart.mutate({ productId: product.id });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to purchase');
      navigate('/auth');
      return;
    }
    addToCart.mutate({ productId: product.id }, {
      onSuccess: () => navigate('/checkout'),
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add items to wishlist');
      navigate('/auth');
      return;
    }
    if (inWishlist) {
      removeFromWishlist.mutate(product.id);
    } else {
      addToWishlist.mutate(product.id);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/product/${product.slug || product.id}`;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ₹${product.price.toLocaleString()}`,
      url: shareUrl,
    };

    try {
      if (navigator.share && isMobile) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Product link copied to clipboard!');
      }
    } catch (error) {
      // User cancelled or share failed, copy to clipboard as fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Product link copied to clipboard!');
      } catch {
        toast.error('Could not share product');
      }
    }
  };

  const discount = originalPrice
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  // Use slug for product link, fallback to id
  const productLink = `/product/${product.slug || product.id}`;
  
  // Show actions on hover for desktop, always visible for mobile
  const showActions = isHovered || isMobile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={productLink} className="h-full block">
        <div className="relative overflow-hidden rounded-lg bg-card border border-border/50 transition-all duration-500 hover:border-primary/30 hover:shadow-card-hover h-full flex flex-col">
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden flex-shrink-0">
            <motion.img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.08 : 1 }}
              transition={{ duration: 0.6 }}
            />

            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"
              animate={{ opacity: isHovered ? 1 : 0.6 }}
              transition={{ duration: 0.3 }}
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isNew && (
                <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
                  NEW
                </span>
              )}
              {isTrending && (
                <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-medium rounded">
                  HOT
                </span>
              )}
              {discount > 0 && (
                <span className="px-1.5 py-0.5 bg-green-600 text-white text-[10px] font-medium rounded">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Quick Actions - Always visible on mobile */}
            <motion.div
              className="absolute top-2 right-2 flex flex-col gap-1"
              initial={{ opacity: isMobile ? 1 : 0, x: isMobile ? 0 : 10 }}
              animate={{ opacity: showActions ? 1 : 0, x: showActions ? 0 : 10 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="glass"
                size="icon"
                className="h-7 w-7"
                onClick={handleWishlistToggle}
                disabled={addToWishlist.isPending || removeFromWishlist.isPending}
              >
                <Heart
                  className={`h-3 w-3 transition-colors ${inWishlist ? 'fill-primary text-primary' : ''
                    }`}
                />
              </Button>
              <Button
                variant="glass"
                size="icon"
                className="h-7 w-7"
                onClick={handleShare}
              >
                <Share2 className="h-3 w-3" />
              </Button>
            </motion.div>

            {/* Desktop Action Buttons - Inside image on hover */}
            {!isMobile && (
              <motion.div
                className="absolute bottom-2 left-2 right-2 flex flex-col gap-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="hero"
                  size="sm"
                  className="w-full text-xs h-6"
                  onClick={handleBuyNow}
                  disabled={!inStock || addToCart.isPending}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Buy Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-6 bg-background/80 backdrop-blur-sm"
                  onClick={handleAddToCart}
                  disabled={!inStock || addToCart.isPending}
                >
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  {!inStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Product Info - Fixed height section */}
          <div className="p-2 flex-1 flex flex-col min-h-[120px]">
            {/* Shop Info - Fixed height */}
            <div className="h-[14px] mb-1">
              {product.shop_name && (
                <Link
                  to={`/shop/${product.shop_slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <Store className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">{product.shop_name}</span>
                  {product.shop_is_verified && (
                    <CheckCircle className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                  )}
                </Link>
              )}
            </div>

            {/* Rating - Fixed height */}
            <div className="flex items-center gap-1 mb-1 h-[16px]">
              <Star className="h-3 w-3 fill-primary text-primary flex-shrink-0" />
              <span className="text-xs font-medium">{product.rating || 0}</span>
              <span className="text-[10px] text-muted-foreground">
                ({reviewsCount})
              </span>
            </div>

            {/* Product Name - Fixed height */}
            <h3 className="font-display text-xs font-semibold text-foreground mb-0.5 line-clamp-1 group-hover:text-primary transition-colors h-[16px]">
              {product.name}
            </h3>

            {/* Fabric/Pattern - Fixed height */}
            <p className="text-[10px] text-muted-foreground mb-1.5 h-[14px] truncate">
              {product.fabric || 'Cotton'} • {product.pattern || 'Classic'}
            </p>

            {/* Price - Fixed height at bottom */}
            <div className="flex items-center gap-1.5 h-[20px]">
              <span className="text-sm font-bold text-primary">
                ₹{product.price.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-[10px] text-muted-foreground line-through">
                  ₹{originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Delivery Estimate */}
            <div className="mt-auto pt-1">
              <DeliveryEstimate 
                deliverablePincodes={product.deliverable_pincodes} 
                compact 
              />
            </div>

            {/* Mobile Action Buttons - Outside image to prevent tap issues */}
            {isMobile && (
              <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-[10px] h-7"
                  onClick={handleAddToCart}
                  disabled={!inStock || addToCart.isPending}
                >
                  <ShoppingBag className="h-3 w-3 mr-1" />
                  {!inStock ? 'Out of Stock' : 'Add'}
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  className="flex-1 text-[10px] h-7"
                  onClick={handleBuyNow}
                  disabled={!inStock || addToCart.isPending}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Buy
                </Button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;