import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Award, Truck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useTrendingPublicProducts,
  useNewPublicProducts,
  usePublicProducts,
  ProductWithShop,
} from "@/hooks/usePublicProducts";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { useFeaturedCollections } from "@/hooks/useFeaturedCollections";
import { useCategories } from "@/hooks/useCategories";
import { usePublicShops } from "@/hooks/usePublicShops";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useVisibleHomeSections } from "@/hooks/useHomeSections";
import ProductCard from "@/components/product/ProductCard";
import ShopBySellerCard from "@/components/home/ShopBySellerCard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const ProductCarousel = ({
  title,
  products,
  viewAllLink,
  isLoading,
}: {
  title: string;
  products: ProductWithShop[];
  viewAllLink: string;
  isLoading?: boolean;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <section className="py-6 lg:py-10">
        <div className="container mx-auto px-3">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-[160px] lg:w-[180px] flex-shrink-0">
                <Skeleton className="aspect-[3/4] rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="py-6 lg:py-10">
      <div className="container mx-auto px-3">
        <div className="flex items-center justify-between mb-4">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-lg lg:text-2xl font-display font-bold"
          >
            {title}
          </motion.h2>
          <Link to={viewAllLink}>
            <Button variant="ghost" size="sm" className="group text-xs">
              View All
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div ref={scrollRef} className="netflix-carousel">
          {products.map((product, index) => (
            <div key={product.id} className="w-[160px] lg:w-[180px] h-full">
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CategoryCard = ({
  category,
  index,
}: {
  category: { id: string; name: string; image_url?: string | null; slug: string };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05 }}
    className="h-full"
  >
    <Link to={`/products?category=${category.id}`} className="h-full block">
      <div className="group relative overflow-hidden rounded-lg aspect-[4/5] glass-card hover-lift h-full">
        <img
          src={
            category.image_url ||
            "/placeholder.svg"
          }
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm lg:text-base font-display font-bold mb-0.5 group-hover:text-primary transition-colors truncate">
            {category.name}
          </h3>
          <p className="text-[10px] text-muted-foreground">Explore</p>
        </div>
      </div>
    </Link>
  </motion.div>
);

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  const { data: trendingProducts = [], isLoading: trendingLoading } = useTrendingPublicProducts();
  const { data: newProducts = [], isLoading: newLoading } = useNewPublicProducts();
  const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts();
  const { data: allProducts = [], isLoading: productsLoading } = usePublicProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: shops = [], isLoading: shopsLoading } = usePublicShops(8);
  const { data: platformStats } = usePlatformStats();
  const { data: featuredCollections = [], isLoading: collectionsLoading } = useFeaturedCollections();
  const { data: homeSections = [] } = useVisibleHomeSections();

  // Only show admin-curated featured products (no fallback)
  const displayFeaturedProducts = featuredProducts;

  // Create a map of section visibility for easy lookup
  const sectionMap = useMemo(() => {
    const map: Record<string, number> = {};
    homeSections.forEach((section, index) => {
      map[section.section_key] = index;
    });
    return map;
  }, [homeSections]);

  const isSectionVisible = (key: string) => key in sectionMap;
  const isHeroVisible = isSectionVisible("hero");

  // Only use scroll animations when hero is visible
  const { scrollYProgress } = useScroll({
    target: isHeroVisible ? heroRef : undefined,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Dynamic trust badges based on real platform data
  const trustBadges = [
    {
      value: platformStats?.totalOrders ? `${platformStats.totalOrders}+` : "0",
      label: "Orders Completed",
    },
    {
      value: platformStats?.totalProducts ? `${platformStats.totalProducts}+` : "0",
      label: "Products Available",
    },
    {
      value: "100%",
      label: "Handwoven",
    },
    {
      value: platformStats?.avgRating ? `${platformStats.avgRating}★` : "N/A",
      label: "Average Rating",
    },
  ];

  const features = [
    { icon: Sparkles, title: "Handcrafted", description: "By skilled artisans" },
    { icon: Award, title: "Premium Quality", description: "100% authentic fabrics" },
    { icon: Truck, title: "Free Shipping", description: "On orders above ₹999" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      {isHeroVisible && (
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-14"
        >
          {/* Background */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://iyfewwbohyvrhibuhdyl.supabase.co/storage/v1/object/public/assets/hero-section.jpg)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />

            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-3 relative z-10">
            <div className="max-w-2xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-medium mb-4">
                  ✨ Authentic Handwoven from Patwatoli
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-2xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4"
              >
                Traditional
                <br />
                <span className="gradient-text">Gamchha & Towels</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm lg:text-base text-muted-foreground max-w-lg mb-5"
              >
                Discover handwoven gamchhas from Patwatoli, Manpur, Gayaji. Crafted by skilled artisans.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap gap-2"
              >
                <Link to="/products">
                  <Button variant="hero" size="default">
                    Shop Collection
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button variant="hero-outline" size="default">
                    Our Story
                  </Button>
                </Link>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap gap-4 mt-8"
              >
                {features.map((feature, index) => (
                  <div key={feature.title} className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <feature.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{feature.title}</p>
                      <p className="text-[10px] text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-5 h-8 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-1.5"
            >
              <motion.div
                animate={{ opacity: [1, 0, 1], y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1 h-1.5 bg-primary rounded-full"
              />
            </motion.div>
          </motion.div>
        </motion.section>
      )}

      {/* Categories Section */}
      {isSectionVisible("categories") && (
        <section className="py-6 lg:py-10 bg-secondary/50">
          <div className="container mx-auto px-3">
            <div className="flex items-center justify-between mb-4">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-lg lg:text-2xl font-display font-bold mb-1">
                  Shop by <span className="gradient-text">Category</span>
                </h2>
                <p className="text-xs text-muted-foreground max-w-md">
                  Explore our curated collections of handcrafted gamchhas.
                </p>
              </motion.div>
              <Link to="/products">
                <Button variant="ghost" size="sm" className="group hidden sm:flex text-xs">
                  View All
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {categoriesLoading ? (
              <div className="netflix-carousel">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-[120px] lg:w-[150px] flex-shrink-0">
                    <Skeleton className="aspect-[4/5] rounded-lg" />
                  </div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="netflix-carousel">
                {categories.map((category, index) => (
                  <div key={category.id} className="w-[120px] lg:w-[150px] flex-shrink-0 h-full">
                    <CategoryCard category={category} index={index} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">No categories available yet.</div>
            )}
          </div>
        </section>
      )}

      {/* Shop by Sellers Section */}
      {isSectionVisible("sellers") && (
        <section className="py-6 lg:py-10">
          <div className="container mx-auto px-3">
            <div className="flex items-center justify-between mb-4">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-lg lg:text-2xl font-display font-bold mb-1">
                  Shop by <span className="gradient-text">Sellers</span>
                </h2>
                <p className="text-xs text-muted-foreground max-w-md">
                  Discover authentic products from trusted sellers.
                </p>
              </motion.div>
            </div>

            {shopsLoading ? (
              <div className="netflix-carousel">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-[180px] lg:w-[200px] flex-shrink-0">
                    <Skeleton className="aspect-[16/9] rounded-lg" />
                  </div>
                ))}
              </div>
            ) : shops.length > 0 ? (
              <div className="netflix-carousel">
                {shops.map((shop, index) => (
                  <div key={shop.id} className="w-[180px] lg:w-[200px] flex-shrink-0 h-full">
                    <ShopBySellerCard shop={shop} index={index} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No seller shops available yet.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trending Products */}
      {isSectionVisible("trending") && (
        <ProductCarousel
          title="🔥 Trending Now"
          products={trendingProducts}
          viewAllLink="/products?filter=trending"
          isLoading={trendingLoading}
        />
      )}

      {/* Featured Collections - Dynamic from Admin */}
      {isSectionVisible("featured_collections") &&
        (collectionsLoading ? (
          <section className="py-8 lg:py-12">
            <div className="container mx-auto px-4">
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          </section>
        ) : featuredCollections.length > 0 ? (
          featuredCollections.map((collection) => (
            <section key={collection.id} className="py-8 lg:py-12">
              <div className="container mx-auto px-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary to-muted border border-border/50"
                >
                  <div className="absolute top-0 right-0 w-1/2 h-full">
                    {collection.image_url && (
                      <img
                        src={collection.image_url}
                        alt={collection.title}
                        className="w-full h-full object-cover opacity-30"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary to-transparent" />
                  </div>

                  {/* Glow */}
                  <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />

                  <div className="relative z-10 p-8 lg:p-16 max-w-2xl">
                    {collection.badge_text && (
                      <span className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
                        {collection.badge_text}
                      </span>
                    )}
                    <h2 className="text-2xl lg:text-3xl font-display font-bold mb-3">
                      {collection.subtitle ? (
                        <>
                          {collection.subtitle}
                          <br />
                          <span className="gradient-text">{collection.title}</span>
                        </>
                      ) : (
                        <span className="gradient-text">{collection.title}</span>
                      )}
                    </h2>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mb-6 max-w-md">{collection.description}</p>
                    )}
                    <Link to={collection.link_url}>
                      <Button variant="hero" size="default">
                        {collection.link_text}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </section>
          ))
        ) : null)}

      {/* New Arrivals */}
      {isSectionVisible("new_arrivals") && (
        <ProductCarousel
          title="✨ New Arrivals"
          products={newProducts}
          viewAllLink="/products?filter=new"
          isLoading={newLoading}
        />
      )}

      {/* Featured Products */}
      {isSectionVisible("featured_products") && (
        <section className="py-8 lg:py-12 bg-secondary/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-xl lg:text-2xl font-display font-bold mb-2">
                Featured <span className="gradient-text">Products</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">Hand-picked favorites from our collection.</p>
            </motion.div>

            {featuredLoading || productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                ))}
              </div>
            ) : displayFeaturedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4 auto-rows-fr">
                {displayFeaturedProducts.map((product, index) => (
                  <div key={product.id} className="h-full">
                    <ProductCard product={product} index={index} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2 text-sm">No products available yet.</p>
                <p className="text-xs">Products from active seller shops will appear here.</p>
              </div>
            )}

            <div className="text-center mt-8">
              <Link to="/products">
                <Button variant="hero-outline" size="default">
                  View All Products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      {isSectionVisible("trust_badges") && (
        <section className="py-8 lg:py-10 border-t border-border/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {trustBadges.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-2xl lg:text-3xl font-display font-bold gradient-text mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Index;
