import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, addToCart } = useCartStore();

  const handleRemove = (productId: string) => {
    removeFromWishlist(productId);
    toast.info('Removed from wishlist');
  };

  const handleAddToCart = (product: typeof wishlist[0]) => {
    addToCart(product);
    toast.success('Added to cart', { description: product.name });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
              My <span className="gradient-text">Wishlist</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              {wishlist.length === 0
                ? 'Your wishlist is empty'
                : `${wishlist.length} item${wishlist.length > 1 ? 's' : ''} saved`}
            </p>
          </motion.div>

          {wishlist.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-display font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Save items you love by clicking the heart icon.
              </p>
              <Link to="/products">
                <Button variant="hero" size="lg">
                  Explore Products
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              <AnimatePresence>
                {wishlist.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-card overflow-hidden group"
                  >
                    {/* Image */}
                    <Link to={`/product/${item.id}`}>
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemove(item.id);
                          }}
                          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-4">
                      <Link to={`/product/${item.id}`}>
                        <h3 className="font-display font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-muted-foreground mb-3">
                        {item.fabric} • {item.pattern}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">
                            ₹{item.price.toLocaleString()}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              ₹{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="hero"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.inStock}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
