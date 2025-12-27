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
        <div className="relative overflow-hidden rounded-xl bg-card border border-border/50 transition-all duration-500 hover:border-primary/30 hover:shadow-card-hover">
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
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {isNew && (
                <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-md">
                  NEW
                </span>
              )}
              {isTrending && (
                <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded-md">
                  TRENDING
                </span>
              )}
              {discount > 0 && (
                <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-md">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <motion.div
              className="absolute top-3 right-3 flex flex-col gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="glass"
                size="icon"
                className="h-9 w-9"
                onClick={handleWishlistToggle}
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    inWishlist ? 'fill-primary text-primary' : ''
                  }`}
                />
              </Button>
              <Button
                variant="glass"
                size="icon"
                className="h-9 w-9"
                asChild
              >
                <Link to={productLink} onClick={(e) => e.stopPropagation()}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Add to Cart Button */}
            <motion.div
              className="absolute bottom-3 left-3 right-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant={inCart ? 'secondary' : 'hero'}
                className="w-full"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {!inStock ? 'Out of Stock' : inCart ? 'Add More' : 'Add to Cart'}
              </Button>
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Shop Info */}
            {product.shop_name && (
              <Link 
                to={`/shop/${product.shop_slug}`} 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Store className="h-3 w-3" />
                <span className="truncate">{product.shop_name}</span>
                {product.shop_is_verified && (
                  <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                )}
              </Link>
            )}

            <div className="flex items-center gap-1 mb-2">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-sm font-medium">{product.rating || 0}</span>
              <span className="text-xs text-muted-foreground">
                ({reviewsCount} reviews)
              </span>
            </div>

            <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            <p className="text-xs text-muted-foreground mb-3">
              {product.fabric || 'Cotton'} • {product.pattern || 'Classic'}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                ₹{product.price.toLocaleString()}
              </span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
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
