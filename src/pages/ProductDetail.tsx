import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Truck, Shield, RefreshCw, Minus, Plus, ChevronLeft, ChevronRight, Store, BadgeCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicProduct, usePublicProducts } from '@/hooks/usePublicProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, isLoading, error } = usePublicProduct(id || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { data: wishlist = [] } = useWishlist();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

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

  const inWishlist = wishlist.some(item => item.product_id === product.id);
  const productImages = product.images?.length ? product.images : ['https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=800'];

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }
    addToCart.mutate({ productId: product.id, quantity });
  };

  const handleWishlistToggle = () => {
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

      <main className="pt-14 lg:pt-16">
        {/* Breadcrumb */}
        <div className="container mx-auto px-3 py-2">
          <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
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
            <span className="text-foreground truncate max-w-[120px]">{product.name}</span>
          </nav>
        </div>

        {/* Product Section */}
        <section className="container mx-auto px-3 py-2 lg:py-3">
          <div className="grid lg:grid-cols-[40%_60%] gap-3 lg:gap-6">
            {/* Image Gallery - Ultra Compact */}
            <div className="flex gap-2 lg:flex-col">
              {/* Thumbnail Gallery - Side on desktop */}
              {productImages.length > 1 && (
                <div className="hidden lg:flex flex-col gap-1.5 order-first">
                  {productImages.slice(0, 5).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === index
                        ? 'border-primary ring-1 ring-primary/20'
                        : 'border-border/50 hover:border-border'
                        }`}
                    >
                      <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Main Image */}
              <motion.div
                ref={imageContainerRef}
                className="relative aspect-square max-h-[280px] lg:max-h-[320px] overflow-hidden rounded-lg bg-card border border-border/50 group flex-1"
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
                  transition={{ duration: 0.2 }}
                />

                {/* Navigation Arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.is_new && (
                    <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">NEW</span>
                  )}
                  {product.is_trending && (
                    <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-[10px] font-medium rounded">HOT</span>
                  )}
                  {discount > 0 && (
                    <span className="px-1.5 py-0.5 bg-green-600 text-white text-[10px] font-medium rounded">-{discount}%</span>
                  )}
                </div>
              </motion.div>

              {/* Mobile Thumbnail Gallery */}
              {productImages.length > 1 && (
                <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-1">
                  {productImages.slice(0, 4).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === index
                        ? 'border-primary ring-1 ring-primary/20'
                        : 'border-border/50'
                        }`}
                    >
                      <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info - Ultra Compact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              {/* Top Row: Shop + Rating */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                {product.shop_name && (
                  <Link
                    to={`/shop/${product.shop_slug}`}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-secondary/50 hover:bg-secondary rounded-full transition-colors"
                  >
                    <Store className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{product.shop_name}</span>
                    {product.shop_is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                  </Link>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating || 0) ? 'fill-primary text-primary' : 'fill-muted text-muted'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{product.rating || 0}</span>
                  <span className="text-xs text-muted-foreground">({product.reviews_count || 0})</span>
                </div>
              </div>

              {/* Title + Specs inline */}
              <div>
                <h1 className="text-base lg:text-lg font-display font-bold leading-tight">{product.name}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[product.fabric, product.pattern, product.color].filter(Boolean).join(' • ')}
                </p>
              </div>

              {/* Price + Stock inline */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-bold gradient-text">₹{product.price.toLocaleString()}</span>
                {product.original_price && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">₹{product.original_price.toLocaleString()}</span>
                    <span className="text-green-500 text-xs font-medium">Save ₹{(product.original_price - product.price).toLocaleString()}</span>
                  </>
                )}
                <span className={`flex items-center gap-1 text-xs ${inStock ? 'text-green-500' : 'text-destructive'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-destructive'}`} />
                  {inStock ? `In Stock (${product.stock})` : 'Out of Stock'}
                </span>
              </div>

              {/* Specs badges */}
              {(product.length || product.width || product.gsm || product.size) && (
                <div className="flex flex-wrap gap-1.5">
                  {product.length && product.width && (
                    <span className="px-2 py-1 bg-secondary rounded text-xs">{product.length}×{product.width} cm</span>
                  )}
                  {product.gsm && <span className="px-2 py-1 bg-secondary rounded text-xs">GSM: {product.gsm}</span>}
                  {product.size && <span className="px-2 py-1 bg-secondary rounded text-xs">{product.size}</span>}
                </div>
              )}

              {/* Colors & Sizes - Compact Row */}
              <div className="flex flex-wrap gap-4">
                {product.available_colors && product.available_colors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Color:</span>
                    <div className="flex gap-1">
                      {product.available_colors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                          className={`px-2 py-0.5 rounded text-xs transition-all border ${selectedColor === color
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary hover:bg-secondary/80 border-border/50'
                            }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {product.available_sizes && product.available_sizes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Size:</span>
                    <div className="flex gap-1">
                      {product.available_sizes.map((size, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                          className={`px-2 py-0.5 rounded text-xs transition-all border min-w-[28px] ${selectedSize === size
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary hover:bg-secondary/80 border-border/50'
                            }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity + Actions Row */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-secondary rounded-lg p-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))} disabled={quantity >= (product.stock || 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button variant="hero" size="sm" className="flex-1 h-9" onClick={handleAddToCart} disabled={!inStock || addToCart.isPending}>
                  <ShoppingBag className="h-4 w-4 mr-1.5" />
                  Add to Cart
                </Button>
                <Button variant="hero-outline" size="sm" className="h-9 w-9 p-0" onClick={handleWishlistToggle}>
                  <Heart className={`h-4 w-4 ${inWishlist ? 'fill-primary' : ''}`} />
                </Button>
              </div>

              {/* Features Row - Compact */}
              <div className="flex items-center justify-between gap-2 py-2 border-y border-border/50">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-center gap-1.5">
                    <feature.icon className="h-4 w-4 text-primary" />
                    <span className="text-[11px] font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>

              {/* Pincode + Payment in row */}
              <div className="grid lg:grid-cols-2 gap-3">
                <PincodeChecker deliverablePincodes={product.deliverable_pincodes} />
                <SellerPaymentInfo sellerId={product.seller_id} shopName={product.shop_name} shopIsVerified={product.shop_is_verified} />
              </div>

              {/* Description - Collapsible feel */}
              {product.description && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{product.description}</p>
                </div>
              )}

              {/* Care Instructions - Compact */}
              {product.care_instructions && product.care_instructions.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <h3 className="text-xs font-semibold mb-1.5">Care Instructions</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {product.care_instructions.map((instruction, index) => (
                      <span key={index} className="text-[11px] text-muted-foreground px-2 py-0.5 bg-secondary rounded">
                        {instruction}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Product Reviews Section */}
        <ProductReviews productId={product.id} productName={product.name} />
        
        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-4 lg:py-6 bg-secondary/50">
            <div className="container mx-auto px-3">
              <h2 className="text-sm lg:text-base font-display font-bold mb-3">You May Also Like</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                {relatedProducts.map((relatedProduct, index) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} index={index} />
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
