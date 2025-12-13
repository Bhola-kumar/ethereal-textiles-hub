import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star, Truck, Shield, RefreshCw, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { products } from '@/data/products';
import { useCartStore } from '@/store/cartStore';
import ProductCard from '@/components/product/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist, isInCart } = useCartStore();

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Product Not Found</h1>
          <Link to="/products">
            <Button variant="hero">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const productImages = product.images || [product.image];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast.success(`Added ${quantity} item(s) to cart`, {
      description: product.name,
    });
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.info('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist');
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const features = [
    { icon: Truck, title: 'Free Shipping', description: 'On orders above ₹999' },
    { icon: Shield, title: 'Secure Payment', description: '100% secure checkout' },
    { icon: RefreshCw, title: 'Easy Returns', description: '7 days return policy' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-24">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary transition-colors">Shop</Link>
            <span>/</span>
            <Link to={`/products?category=${product.category.toLowerCase()}`} className="hover:text-primary transition-colors">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>

        {/* Product Section */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div
                ref={imageContainerRef}
                className="relative aspect-square overflow-hidden rounded-2xl bg-card border border-border/50 group"
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
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isNew && (
                    <span className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg">
                      NEW
                    </span>
                  )}
                  {product.isTrending && (
                    <span className="px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg">
                      TRENDING
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg">
                      -{discount}% OFF
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Thumbnail Gallery */}
              {productImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
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
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? 'fill-primary text-primary'
                          : 'fill-muted text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
                  {product.name}
                </h1>
                <p className="text-muted-foreground">
                  {product.fabric} • {product.pattern} • {product.color}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold gradient-text">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-green-500 font-medium">
                      Save ₹{(product.originalPrice - product.price).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    product.inStock ? 'bg-green-500' : 'bg-destructive'
                  }`}
                />
                <span className={product.inStock ? 'text-green-500' : 'text-destructive'}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
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
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="hero"
                  size="xl"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {inCart ? 'Add More' : 'Add to Cart'}
                </Button>
                <Button
                  variant="hero-outline"
                  size="xl"
                  onClick={handleWishlistToggle}
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? 'fill-primary' : ''}`} />
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
                {features.map((feature) => (
                  <div key={feature.title} className="text-center">
                    <feature.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>

              {/* Care Instructions */}
              <div className="pt-6 border-t border-border/50">
                <h3 className="font-display font-semibold mb-3">Care Instructions</h3>
                <ul className="space-y-2">
                  {product.care.map((instruction, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12 lg:py-20 bg-charcoal-dark">
            <div className="container mx-auto px-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl lg:text-4xl font-display font-bold mb-8"
              >
                You May Also Like
              </motion.h2>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {relatedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
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
