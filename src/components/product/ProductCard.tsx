import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Eye, Store, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  useCartStore, 
  Product, 
  getProductImage, 
  isProductInStock, 
  getOriginalPrice,
  isProductNew,
  isProductTrending,
  getReviewsCount 
} from '@/store/cartStore';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, isInCart } = useCartStore();

  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const productImage = getProductImage(product);
  const inStock = isProductInStock(product);
  const originalPrice = getOriginalPrice(product);
  const isNew = isProductNew(product);
  const isTrending = isProductTrending(product);
  const reviewsCount = getReviewsCount(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success('Added to cart', {
      description: product.name,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist', {
        description: product.name,
      });
    }
  };

  const discount = originalPrice
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  // Use slug for product link, fallback to id
  const productLink = `/product/${product.slug || product.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={productLink}>
<div className="relative overflow-hidden rounded-lg bg-card border border-border/50 transition-all duration-500 hover:border-primary/30 hover:shadow-card-hover">
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden">
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

            {/* Quick Actions */}
            <motion.div
              className="absolute top-2 right-2 flex flex-col gap-1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="glass"
                size="icon"
                className="h-7 w-7"
                onClick={handleWishlistToggle}
              >
                <Heart
                  className={`h-3 w-3 transition-colors ${
                    inWishlist ? 'fill-primary text-primary' : ''
                  }`}
                />
              </Button>
              <Button
                variant="glass"
                size="icon"
                className="h-7 w-7"
                asChild
              >
                <Link to={productLink} onClick={(e) => e.stopPropagation()}>
                  <Eye className="h-3 w-3" />
                </Link>
              </Button>
            </motion.div>

            {/* Add to Cart Button */}
            <motion.div
              className="absolute bottom-2 left-2 right-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant={inCart ? 'secondary' : 'hero'}
                size="sm"
                className="w-full text-xs h-7"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                {!inStock ? 'Out of Stock' : inCart ? 'Add More' : 'Add to Cart'}
              </Button>
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="p-2">
            {/* Shop Info */}
            {product.shop_name && (
              <Link 
                to={`/shop/${product.shop_slug}`} 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 mb-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                <Store className="h-2.5 w-2.5" />
                <span className="truncate">{product.shop_name}</span>
                {product.shop_is_verified && (
                  <CheckCircle className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                )}
              </Link>
            )}

            <div className="flex items-center gap-1 mb-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-xs font-medium">{product.rating || 0}</span>
              <span className="text-[10px] text-muted-foreground">
                ({reviewsCount})
              </span>
            </div>

            <h3 className="font-display text-xs font-semibold text-foreground mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            <p className="text-[10px] text-muted-foreground mb-1.5">
              {product.fabric || 'Cotton'} • {product.pattern || 'Classic'}
            </p>

            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-primary">
                ₹{product.price.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-[10px] text-muted-foreground line-through">
                  ₹{originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
