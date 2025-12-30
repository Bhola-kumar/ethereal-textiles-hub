import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCartStore();

  const subtotal = getCartTotal();
  const shipping = subtotal > 999 ? 0 : 99;
  const total = subtotal + shipping;

  const handleRemove = (productId: string, productName: string) => {
    removeFromCart(productId);
    toast.info('Removed from cart', { description: productName });
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
              Shopping <span className="gradient-text">Cart</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              {items.length === 0
                ? 'Your cart is empty'
                : `${items.length} item${items.length > 1 ? 's' : ''} in your cart`}
            </p>
          </motion.div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-display font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added any items yet.
              </p>
              <Link to="/products">
                <Button variant="hero" size="lg">
                  Start Shopping
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card p-4 lg:p-6"
                    >
                      <div className="flex gap-4 lg:gap-6">
                        {/* Image */}
                        <Link to={`/product/${item.slug || item.id}`} className="flex-shrink-0">
                          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-secondary">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${item.slug || item.id}`}>
                            <h3 className="font-display font-semibold text-lg mb-1 hover:text-primary transition-colors line-clamp-1">
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.fabric} • {item.color}
                          </p>

                          {/* Price */}
                          <div className="flex items-center gap-2 mb-4">
                            <span className="font-bold text-primary">
                              ₹{item.price.toLocaleString()}
                            </span>
                            {item.originalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{item.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Quantity & Remove */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemove(item.id, item.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>

                        {/* Item Total - Desktop */}
                        <div className="hidden lg:flex flex-col items-end justify-center">
                          <span className="text-sm text-muted-foreground">Total</span>
                          <span className="text-xl font-bold gradient-text">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Clear Cart */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => {
                      clearCart();
                      toast.info('Cart cleared');
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-6 sticky top-24"
                >
                  <h2 className="text-xl font-display font-semibold mb-6">Order Summary</h2>

                  {/* Promo Code */}
                  <div className="mb-6">
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Enter code"
                          className="w-full h-10 pl-10 pr-4 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <Button variant="outline">Apply</Button>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="space-y-3 pb-6 border-b border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={shipping === 0 ? 'text-green-500' : ''}>
                        {shipping === 0 ? 'FREE' : `₹${shipping}`}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Add ₹{(1000 - subtotal).toLocaleString()} more for free shipping
                      </p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-6">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold gradient-text">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <Link to="/checkout">
                    <Button variant="hero" size="xl" className="w-full">
                      Proceed to Checkout
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>

                  {/* Continue Shopping */}
                  <Link to="/products" className="block mt-4">
                    <Button variant="ghost" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
