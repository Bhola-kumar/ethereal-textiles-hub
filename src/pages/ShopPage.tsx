import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store, MapPin, BadgeCheck, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicShop, usePublicShopProducts } from '@/hooks/usePublicShops';
import ProductCard from '@/components/product/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: shop, isLoading: shopLoading, error: shopError } = usePublicShop(slug || '');
  const { data: products = [], isLoading: productsLoading } = usePublicShopProducts(shop?.id || '');

  if (shopLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <Skeleton className="h-64 w-full" />
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (shopError || !shop) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold mb-4">Shop Not Found</h1>
            <p className="text-muted-foreground mb-6">This shop may no longer be available or is inactive.</p>
            <Link to="/products">
              <Button variant="hero">Browse Products</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Shop Banner */}
        <div className="relative h-48 lg:h-64 overflow-hidden">
          {shop.banner_url ? (
            <img
              src={shop.banner_url}
              alt={shop.shop_name || 'Shop banner'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        {/* Shop Info */}
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row items-start gap-6 mb-8"
          >
            {/* Logo */}
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl overflow-hidden border-4 border-background bg-card shadow-lg">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={shop.shop_name || 'Shop logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Store className="h-12 w-12 text-primary" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-display font-bold">
                  {shop.shop_name}
                </h1>
                {shop.is_verified && (
                  <BadgeCheck className="h-6 w-6 text-primary" />
                )}
              </div>
              
              {(shop.city || shop.state) && (
                <p className="text-muted-foreground flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4" />
                  {[shop.city, shop.state].filter(Boolean).join(', ')}
                </p>
              )}

              {shop.description && (
                <p className="text-muted-foreground max-w-2xl">
                  {shop.description}
                </p>
              )}
            </div>
          </motion.div>

          {/* Back Button */}
          <Link to="/products">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>

        {/* Products Section */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-display font-bold mb-6">
            Products from {shop.shop_name}
          </h2>

          {productsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-6">
                This shop hasn't listed any products yet.
              </p>
              <Link to="/products">
                <Button variant="outline">Browse Other Products</Button>
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
