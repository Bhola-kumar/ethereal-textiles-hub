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

      <main className="pt-14 lg:pt-16">
        {/* Shop Banner */}
        <div className="relative h-32 lg:h-48 overflow-hidden">
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
        <div className="container mx-auto px-3 -mt-12 lg:-mt-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row items-start gap-4 mb-4"
          >
            {/* Logo */}
            <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden border-4 border-background bg-card shadow-lg flex-shrink-0">
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
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl lg:text-2xl font-display font-bold">
                  {shop.shop_name}
                </h1>
                {shop.is_verified && (
                  <BadgeCheck className="h-5 w-5 text-primary" />
                )}
              </div>

              {(shop.city || shop.state) && (
                <p className="text-xs lg:text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="h-3 w-3" />
                  {[shop.city, shop.state].filter(Boolean).join(', ')}
                </p>
              )}

              {shop.description && (
                <p className="text-xs lg:text-sm text-muted-foreground max-w-2xl line-clamp-2">
                  {shop.description}
                </p>
              )}
            </div>
          </motion.div>

          {/* Back Button */}
          <Link to="/products">
            <Button variant="ghost" size="sm" className="mb-4 text-xs">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Products
            </Button>
          </Link>
        </div>

        {/* Products Section */}
        <section className="container mx-auto px-3 py-6 lg:py-8">
          <h2 className="text-lg lg:text-xl font-display font-bold mb-4">
            All Products
          </h2>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3 auto-rows-fr">
              {products.map((product, index) => (
                <div key={product.id} className="h-full max-w-[160px] mx-auto w-full">
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This shop hasn't listed any products yet.
              </p>
              <Link to="/products">
                <Button variant="outline" size="sm">Browse Other Products</Button>
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
