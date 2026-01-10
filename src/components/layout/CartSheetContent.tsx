import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart, useUpdateCartQuantity, useRemoveFromCart } from '@/hooks/useCart';
import { usePincode, getEstimatedDelivery } from '@/hooks/usePincode';
import { ScrollArea } from '@/components/ui/scroll-area';
import PincodeInput from '@/components/common/PincodeInput';
import { useAuth } from '@/hooks/useAuth';

interface CartSheetContentProps {
  onClose: () => void;
}

const CartSheetContent = ({ onClose }: CartSheetContentProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: items = [], isLoading } = useCart();
  const { data: pincode } = usePincode();
  const updateQuantity = useUpdateCartQuantity();
  const removeFromCart = useRemoveFromCart();

  const cartTotal = items.reduce((total, item) => total + (item.products.price * item.quantity), 0);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Sign in to view your cart</p>
        <Button variant="outline" onClick={() => { onClose(); navigate('/auth'); }}>
          Sign In
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Your cart is empty</p>
        <Button variant="outline" onClick={() => { onClose(); navigate('/products'); }}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Pincode Input */}
      <div className="pb-3 border-b border-border">
        <PincodeInput compact />
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 py-3">
        <div className="space-y-3 pr-2">
          {items.map((item) => {
            const delivery = getEstimatedDelivery(item.products.deliverable_pincodes, pincode);
            
            return (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-lg bg-muted/50"
              >
                {/* Image */}
                <Link
                  to={`/product/${item.products.slug || item.products.id}`}
                  onClick={onClose}
                  className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0"
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
                    className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors"
                  >
                    {item.products.name}
                  </Link>
                  <p className="text-sm text-primary font-semibold mt-1">
                    ₹{item.products.price.toLocaleString()}
                  </p>

                  {/* Delivery Estimate */}
                  {pincode && (
                    <div className="mt-1">
                      {delivery.isDeliverable ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          By {delivery.estimatedDate}
                        </span>
                      ) : (
                        <span className="text-xs text-destructive">
                          Not deliverable to your location
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: Math.max(0, item.quantity - 1) })}
                      disabled={updateQuantity.isPending}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                      disabled={updateQuantity.isPending}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive ml-auto"
                      onClick={() => removeFromCart.mutate(item.id)}
                      disabled={removeFromCart.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-lg font-bold">₹{cartTotal.toLocaleString()}</span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleViewCart}
          >
            View Cart
          </Button>
          <Button
            variant="hero"
            className="flex-1"
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSheetContent;
