import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, X, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart, useUpdateCartQuantity, useRemoveFromCart } from '@/hooks/useCart';
import { usePincode, getEstimatedDelivery } from '@/hooks/usePincode';
import { ScrollArea } from '@/components/ui/scroll-area';
import PincodeInput from '@/components/common/PincodeInput';
import { useAuth } from '@/hooks/useAuth';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDropdown = ({ isOpen, onClose }: CartDropdownProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: items = [], isLoading } = useCart();
  const { data: pincode } = usePincode();
  const updateQuantity = useUpdateCartQuantity();
  const removeFromCart = useRemoveFromCart();

  const cartCount = items.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = items.reduce((total, item) => total + (item.products.price * item.quantity), 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Your Cart ({cartCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <PincodeInput compact />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!user ? (
              <div className="p-6 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Sign in to view your cart</p>
                <Button variant="outline" size="sm" onClick={() => { onClose(); navigate('/auth'); }}>
                  Sign In
                </Button>
              </div>
            ) : isLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Your cart is empty</p>
                <Button variant="outline" size="sm" onClick={() => { onClose(); navigate('/products'); }}>
                  Start Shopping
                </Button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <ScrollArea className="max-h-64">
                  <div className="p-2 space-y-2">
                    {items.map((item) => {
                      const delivery = getEstimatedDelivery(item.products.deliverable_pincodes, pincode);
                      
                      return (
                        <div
                          key={item.id}
                          className="flex gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          {/* Image */}
                          <Link
                            to={`/product/${item.products.slug || item.products.id}`}
                            onClick={onClose}
                            className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0"
                          >
                            <img
                              src={item.products.images?.[0] || '/placeholder.svg'}
                              alt={item.products.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${item.products.slug || item.products.id}`}
                              onClick={onClose}
                              className="text-xs font-medium line-clamp-1 hover:text-primary transition-colors"
                            >
                              {item.products.name}
                            </Link>
                            <p className="text-xs text-primary font-semibold">
                              ₹{item.products.price.toLocaleString()}
                            </p>

                            {/* Delivery Estimate */}
                            {pincode && (
                              <div className="mt-0.5">
                                {delivery.isDeliverable ? (
                                  <span className="text-[9px] text-green-600 flex items-center gap-0.5">
                                    <Truck className="h-2 w-2" />
                                    By {delivery.estimatedDate}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-destructive">
                                    Not deliverable
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 mt-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: Math.max(0, item.quantity - 1) })}
                                disabled={updateQuantity.isPending}
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </Button>
                              <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                                disabled={updateQuantity.isPending}
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
                            onClick={() => removeFromCart.mutate(item.id)}
                            disabled={removeFromCart.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-sm font-bold">₹{cartTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={handleViewCart}
                    >
                      View Cart
                    </Button>
                    <Button
                      variant="hero"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={handleCheckout}
                    >
                      Checkout
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDropdown;
