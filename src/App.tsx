import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { HelpDeskChat } from "@/components/helpdesk/HelpDeskChat";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Auth from "./pages/Auth";
import MyOrders from "./pages/MyOrders";
import Settings from "./pages/Settings";
import Collections from "./pages/Collections";
import About from "./pages/About";
import ShopPage from "./pages/ShopPage";
import TrackOrder from "./pages/TrackOrder";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import Story from "./pages/Story";
import Artisans from "./pages/Artisans";
import Sustainability from "./pages/Sustainability";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminFeaturedProducts from "./pages/admin/AdminFeaturedProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCollections from "./pages/admin/AdminCollections";
import AdminHomeSections from "./pages/admin/AdminHomeSections";
import SellerRegister from "./pages/seller/SellerRegister";
import SellerLayout from "./pages/seller/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerAnalytics from "./pages/seller/SellerAnalytics";
import SellerShop from "./pages/seller/SellerShop";
import SellerSettings from "./pages/seller/SellerSettings";
import SellerOrderDetail from "./pages/seller/SellerOrderDetail";
import SellerPromoCodes from "./pages/seller/SellerPromoCodes";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/utils/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/about" element={<About />} />
            <Route path="/shop/:slug" element={<ShopPage />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/story" element={<Story />} />
            <Route path="/artisans" element={<Artisans />} />
            <Route path="/sustainability" element={<Sustainability />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="sellers" element={<AdminSellers />} />
              <Route path="featured" element={<AdminFeaturedProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="collections" element={<AdminCollections />} />
              <Route path="home-sections" element={<AdminHomeSections />} />
              <Route path="promo-codes" element={<AdminPromoCodes />} />
            </Route>

            {/* Seller Routes */}
            <Route path="/seller/register" element={<SellerRegister />} />
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<SellerDashboard />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="orders/:orderId" element={<SellerOrderDetail />} />
              <Route path="analytics" element={<SellerAnalytics />} />
              <Route path="shop" element={<SellerShop />} />
              <Route path="settings" element={<SellerSettings />} />
              <Route path="promo-codes" element={<SellerPromoCodes />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Global Help Desk Chat */}
          <HelpDeskChat />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
