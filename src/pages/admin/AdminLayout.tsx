import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users,
  LogOut,
  ChevronRight,
  Store,
  Star,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Products', icon: Package, href: '/admin/products' },
  { label: 'Categories', icon: FolderOpen, href: '/admin/categories' },
  { label: 'Featured', icon: Star, href: '/admin/featured' },
  { label: 'Orders', icon: ShoppingCart, href: '/admin/orders' },
  { label: 'Sellers', icon: Store, href: '/admin/sellers' },
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Customers', icon: Users, href: '/admin/customers' },
];

export default function AdminLayout() {
  const { user, isAdmin, isSeller, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || (!isAdmin && !isSeller))) {
      navigate('/auth');
    }
  }, [user, isAdmin, isSeller, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isSeller)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col">
        <div className="mb-8">
          <Link to="/" className="text-xl font-display font-bold text-primary">
            Gamchha Dukaan
          </Link>
          <p className="text-xs text-muted-foreground mt-1">
            {isAdmin ? 'Admin Panel' : 'Seller Dashboard'}
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
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

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
