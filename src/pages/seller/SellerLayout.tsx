import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Store,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/seller' },
  { label: 'Products', icon: Package, href: '/seller/products' },
  { label: 'Orders', icon: ShoppingCart, href: '/seller/orders' },
  { label: 'Analytics', icon: BarChart3, href: '/seller/analytics' },
  { label: 'Shop Settings', icon: Store, href: '/seller/shop' },
];

interface Shop {
  id: string;
  shop_name: string;
  logo_url: string | null;
  is_verified: boolean;
}

export default function SellerLayout() {
  const { user, isSeller, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shop, setShop] = useState<Shop | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (!isSeller && !isAdmin))) {
      navigate('/seller/register');
    }
  }, [user, isSeller, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from('shops')
        .select('id, shop_name, logo_url, is_verified')
        .eq('seller_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setShop(data);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!user || (!isSeller && !isAdmin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <Link to="/" className="text-lg font-display font-bold text-primary">
          Gamchha Seller
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border p-6 flex flex-col transition-transform lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="mb-8 mt-12 lg:mt-0">
          <Link to="/" className="text-xl font-display font-bold text-primary">
            Gamchha Dukaan
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Seller Dashboard</p>
        </div>

        {/* Shop Info */}
        {shop && (
          <div className="mb-6 p-3 bg-accent/30 rounded-lg">
            <div className="flex items-center gap-3">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.shop_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{shop.shop_name}</p>
                <p className={`text-xs ${shop.is_verified ? 'text-green-500' : 'text-yellow-500'}`}>
                  {shop.is_verified ? '✓ Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Account Settings</span>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
