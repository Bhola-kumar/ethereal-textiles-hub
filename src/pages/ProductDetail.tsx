import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Truck, Shield, RefreshCw, Minus, Plus, ChevronLeft, ChevronRight, Store, BadgeCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicProduct, usePublicProducts } from '@/hooks/usePublicProducts';
import { useCartStore } from '@/store/cartStore';
import ProductCard from '@/components/product/ProductCard';
import ProductReviews from '@/components/product/ProductReviews';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import SellerPaymentInfo from '@/components/product/SellerPaymentInfo';
import PincodeChecker from '@/components/product/PincodeChecker';

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading, error } = usePublicProduct(id || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, isInCart } = useCartStore();

  // Fetch related products (same category)
  const { data: allProducts = [] } = usePublicProducts({ category: product?.category_id || undefined });
  const relatedProducts = allProducts.filter(p => p.id !== product?.id).slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 lg:pt-20">
          <div className="container mx-auto px-4 py-4 lg:py-6">
            <div className="grid lg:grid-cols-[45%_55%] gap-4 lg:gap-8">
              {/* Skeleton matching actual image size */}
              <div className="space-y-3">
                <Skeleton className="aspect-[4/5] lg:aspect-square max-h-[400px] lg:max-h-[450px] rounded-xl mx-auto w-full" />
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="w-14 h-14 lg:w-16 lg:h-16 rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">This product may no longer be available or the shop is inactive.</p>
            <Link to="/products">
              <Button variant="hero">Back to Shop</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const productImages = product.images?.length ? product.images : ['https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=800'];

  const handleAddToCart = () => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.original_price || undefined,
      image: productImages[0],
      images: product.images || undefined,
      category: product.categories?.name || 'Uncategorized',
      fabric: product.fabric || undefined,
      color: product.color || undefined,
      pattern: product.pattern || undefined,
      description: product.description || '',
      rating: product.rating || 0,
      reviews: product.reviews_count || 0,
      isNew: product.is_new || false,
      isTrending: product.is_trending || false,
      inStock: (product.stock || 0) > 0,
      care: product.care_instructions || [],
      seller_id: product.seller_id || undefined,
      shop_name: product.shop_name || undefined,
      shop_slug: product.shop_slug || undefined,
      shop_is_verified: product.shop_is_verified || undefined,
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(cartProduct);
    }
    toast.success(`Added ${quantity} item(s) to cart`, {
      description: product.name,
    });
  };

  const handleWishlistToggle = () => {
    const wishlistProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.original_price || undefined,
      image: productImages[0],
      category: product.categories?.name || 'Uncategorized',
      fabric: product.fabric || undefined,
      color: product.color || undefined,
      pattern: product.pattern || undefined,
      description: product.description || '',
      rating: product.rating || 0,
      reviews: product.reviews_count || 0,
      isNew: product.is_new || false,
      isTrending: product.is_trending || false,
      inStock: (product.stock || 0) > 0,
      care: product.care_instructions || [],
      seller_id: product.seller_id || undefined,
      shop_name: product.shop_name || undefined,
      shop_slug: product.shop_slug || undefined,
      shop_is_verified: product.shop_is_verified || undefined,
    };

    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info('Removed from wishlist');
    } else {
      addToWishlist(wishlistProduct);
      toast.success('Added to wishlist');
    }
  };

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const features = [
    { icon: Truck, title: 'Free Shipping', description: 'On orders above ₹999' },
    { icon: Shield, title: 'Secure Payment', description: '100% secure checkout' },
    { icon: RefreshCw, title: 'Easy Returns', description: '7 days return policy' },
  ];

  const inStock = (product.stock || 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16 lg:pt-20">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary transition-colors">Shop</Link>
            {product.categories && (
              <>
                <span>/</span>
                <Link to={`/products?category=${product.category_id}`} className="hover:text-primary transition-colors">
                  {product.categories.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground truncate max-w-[150px]">{product.name}</span>
          </nav>
        </div>

        {/* Product Section */}
        <section className="container mx-auto px-4 py-4 lg:py-6">
          <div className="grid lg:grid-cols-[45%_55%] gap-4 lg:gap-8">
            {/* Image Gallery - Compact */}
            <div className="space-y-3">
              {/* Main Image */}
              <motion.div
                ref={imageContainerRef}
                className="relative aspect-[4/5] lg:aspect-square max-h-[400px] lg:max-h-[450px] overflow-hidden rounded-xl bg-card border border-border/50 group mx-auto w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.img
                  key={selectedImageIndex}
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Navigation Arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {product.is_new && (
                    <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-md">
                      NEW
                    </span>
                  )}
                  {product.is_trending && (
                    <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded-md">
                      TRENDING
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-md">
                      -{discount}% OFF
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Thumbnail Gallery */}
              {productImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/50 hover:border-border'
                        }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {/* Shop Info */}
              {product.shop_name && (
                <Link
                  to={`/shop/${product.shop_slug}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-full transition-colors"
                >
                  <Store className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{product.shop_name}</span>
                  {product.shop_is_verified && (
                    <BadgeCheck className="h-4 w-4 text-primary" />
                  )}
                </Link>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(product.rating || 0)
                        ? 'fill-primary text-primary'
                        : 'fill-muted text-muted'
                        }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating || 0}</span>
                <span className="text-muted-foreground">({product.reviews_count || 0} reviews)</span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-xl lg:text-2xl font-display font-bold mb-1">
                  {product.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {[product.fabric, product.pattern, product.color].filter(Boolean).join(' • ')}
                </p>
              </div>

              {/* Product Specifications */}
              {(product.length || product.width || product.gsm || product.size) && (
                <div className="flex flex-wrap gap-3">
                  {product.length && product.width && (
                    <span className="px-3 py-1.5 bg-secondary rounded-lg text-sm">
                      <span className="text-muted-foreground">Size:</span> {product.length} × {product.width} cm
                    </span>
                  )}
                  {product.gsm && (
                    <span className="px-3 py-1.5 bg-secondary rounded-lg text-sm">
                      <span className="text-muted-foreground">GSM:</span> {product.gsm}
                    </span>
                  )}
                  {product.size && (
                    <span className="px-3 py-1.5 bg-secondary rounded-lg text-sm">
                      <span className="text-muted-foreground">Size:</span> {product.size}
                    </span>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold gradient-text">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.original_price && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      ₹{product.original_price.toLocaleString()}
                    </span>
                    <span className="text-green-500 text-sm font-medium">
                      Save ₹{(product.original_price - product.price).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Available Colors */}
              {product.available_colors && product.available_colors.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium">Select Color:</span>
                  <div className="flex flex-wrap gap-2">
                    {product.available_colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                        className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all border ${selectedColor === color
                          ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20'
                          : 'bg-secondary hover:bg-secondary/80 border-border/50'
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Sizes */}
              {product.available_sizes && product.available_sizes.length > 0 && (
                <div className="space-y-2">
                  <span className="font-medium">Select Size:</span>
                  <div className="flex flex-wrap gap-2">
                    {product.available_sizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                        className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-all border min-w-[40px] ${selectedSize === size
                          ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20'
                          : 'bg-secondary hover:bg-secondary/80 border-border/50'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Variant Display */}
              {(selectedColor || selectedSize) && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Selected: </span>
                    <span className="font-medium">
                      {[selectedColor, selectedSize].filter(Boolean).join(' / ')}
                    </span>
                  </p>
                </div>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-destructive'
                    }`}
                />
                <span className={inStock ? 'text-green-500' : 'text-destructive'}>
                  {inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
                    disabled={quantity >= (product.stock || 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {inCart ? 'Add More' : 'Add to Cart'}
                </Button>
                <Button
                  variant="hero-outline"
                  size="lg"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={`h-4 w-4 ${inWishlist ? 'fill-primary' : ''}`} />
                </Button>
              </div>

              {/* Pincode Availability Check */}
              <div className="pt-4">
                <PincodeChecker />
              </div>

              {/* Seller Payment Info */}
              <SellerPaymentInfo
                sellerId={product.seller_id}
                shopName={product.shop_name}
                shopIsVerified={product.shop_is_verified}
              />

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
                {features.map((feature) => (
                  <div key={feature.title} className="text-center">
                    <feature.icon className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                    <p className="text-xs font-medium">{feature.title}</p>
                    <p className="text-[10px] text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* Care Instructions */}
              {product.care_instructions && product.care_instructions.length > 0 && (
                <div className="pt-6 border-t border-border/50">
                  <h3 className="font-display font-semibold mb-3">Care Instructions</h3>
                  <ul className="space-y-2">
                    {product.care_instructions.map((instruction, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Product Reviews Section */}
        <ProductReviews productId={product.id} productName={product.name} />
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-6 lg:py-8 bg-secondary/50">
            <div className="container mx-auto px-3">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-lg lg:text-xl font-display font-bold mb-4"
              >
                You May Also Like
              </motion.h2>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 auto-rows-fr">
                {relatedProducts.map((relatedProduct, index) => (
                  <div key={relatedProduct.id} className="h-full">
                    <ProductCard product={relatedProduct} index={index} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
