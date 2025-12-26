import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Award, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrendingPublicProducts, useNewPublicProducts, usePublicProducts, ProductWithShop } from '@/hooks/usePublicProducts';
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts';
import { useCategories } from '@/hooks/useCategories';
import ProductCard from '@/components/product/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';

const ProductCarousel = ({ 
  title, 
  products, 
  viewAllLink,
  isLoading 
}: { 
  title: string; 
  products: ProductWithShop[]; 
  viewAllLink: string;
  isLoading?: boolean;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-[280px] lg:w-[320px] flex-shrink-0">
                <Skeleton className="aspect-[3/4] rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-2xl lg:text-4xl font-display font-bold"
          >
            {title}
          </motion.h2>
          <Link to={viewAllLink}>
            <Button variant="ghost" className="group">
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div
          ref={scrollRef}
          className="netflix-carousel"
        >
          {products.map((product, index) => (
            <div key={product.id} className="w-[280px] lg:w-[320px]">
              <ProductCard product={product} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CategoryCard = ({ category, index }: { category: { id: string; name: string; image_url?: string | null; slug: string }; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
  >
    <Link to={`/products?category=${category.id}`}>
      <div className="group relative overflow-hidden rounded-2xl aspect-[4/5] glass-card hover-lift">
        <img
          src={category.image_url || 'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl lg:text-2xl font-display font-bold mb-1 group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Explore Collection
          </p>
        </div>
      </div>
    </Link>
  </motion.div>
);

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const { data: trendingProducts = [], isLoading: trendingLoading } = useTrendingPublicProducts();
  const { data: newProducts = [], isLoading: newLoading } = useNewPublicProducts();
  const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts();
  const { data: allProducts = [], isLoading: productsLoading } = usePublicProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  // Fallback to first 6 products if no admin-curated featured products exist
  const displayFeaturedProducts = featuredProducts.length > 0 ? featuredProducts : allProducts.slice(0, 6);

  const features = [
    { icon: Sparkles, title: 'Handcrafted', description: 'By skilled artisans' },
    { icon: Award, title: 'Premium Quality', description: '100% authentic fabrics' },
    { icon: Truck, title: 'Free Shipping', description: 'On orders above ₹999' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      >
        {/* Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=1920)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
          
          {/* Glow Effect */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
                ✨ Authentic Handwoven from Bengal & Assam
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6"
            >
              Traditional
              <br />
              <span className="gradient-text">Gamchha & Towels</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg lg:text-xl text-muted-foreground max-w-xl mb-8"
            >
              Discover the timeless tradition of handwoven gamchhas from Beldanga, Phulia & Santipur. 
              Crafted with love by skilled artisans using age-old pit loom techniques.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/products">
                <Button variant="hero" size="xl">
                  Shop Collection
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="hero-outline" size="xl">
                  Our Story
                </Button>
              </Link>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap gap-8 mt-16"
            >
              {features.map((feature, index) => (
                <div key={feature.title} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
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
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/50 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ opacity: [1, 0, 1], y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1 h-2 bg-primary rounded-full"
            />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Categories Section */}
      <section className="py-12 lg:py-20 bg-charcoal-dark">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-5xl font-display font-bold mb-4">
              Shop by <span className="gradient-text">Category</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Explore our curated collections of handcrafted gamchhas for every occasion.
            </p>
          </motion.div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No categories available yet.
            </div>
          )}
        </div>
      </section>

      {/* Trending Products */}
      <ProductCarousel
        title="🔥 Trending Now"
        products={trendingProducts}
        viewAllLink="/products?filter=trending"
        isLoading={trendingLoading}
      />

      {/* Feature Banner */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-charcoal-light to-charcoal-dark border border-border/50"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full">
              <img
                src="https://images.pexels.com/photos/4210343/pexels-photo-4210343.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Assamese Gamosa Collection"
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal-dark to-transparent" />
            </div>
            
            {/* Glow */}
            <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />

            <div className="relative z-10 p-8 lg:p-16 max-w-2xl">
              <span className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
                Featured Collection
              </span>
              <h2 className="text-3xl lg:text-5xl font-display font-bold mb-4">
                Assamese
                <br />
                <span className="gradient-text">Gamosa Collection</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Discover the iconic Bihu Gamosa from Assam. Each piece features intricate red borders 
                woven with traditional motifs, symbolizing respect and hospitality.
              </p>
              <Link to="/products?category=traditional">
                <Button variant="hero" size="lg">
                  Explore Collection
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* New Arrivals */}
      <ProductCarousel
        title="✨ New Arrivals"
        products={newProducts}
        viewAllLink="/products?filter=new"
        isLoading={newLoading}
      />

      {/* Featured Products */}
      <section className="py-12 lg:py-20 bg-charcoal-dark">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-5xl font-display font-bold mb-4">
              Featured <span className="gradient-text">Products</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Hand-picked favorites from our collection.
            </p>
          </motion.div>

          {featuredLoading || productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
          ) : displayFeaturedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {displayFeaturedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No products available yet.</p>
              <p className="text-sm">Products from active seller shops will appear here.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="hero-outline" size="lg">
                View All Products
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 lg:py-16 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '15K+', label: 'Happy Customers' },
              { value: '230+', label: 'Regional Variants' },
              { value: '100%', label: 'Handwoven' },
              { value: '4.8★', label: 'Average Rating' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl lg:text-4xl font-display font-bold gradient-text mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
