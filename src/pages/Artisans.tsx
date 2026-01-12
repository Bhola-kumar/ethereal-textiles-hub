import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Award, Heart, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { usePublicShops } from '@/hooks/usePublicShops';

const Artisans = () => {
  const { data: shops, isLoading } = usePublicShops();

  const features = [
    {
      icon: Users,
      title: 'Direct Connection',
      description: 'Buy directly from artisans with no middlemen, ensuring fair prices for both you and the maker.',
    },
    {
      icon: Award,
      title: 'Verified Artisans',
      description: 'Each seller is verified to ensure authenticity and quality of their handcrafted products.',
    },
    {
      icon: Heart,
      title: 'Support Livelihoods',
      description: 'Your purchase directly supports artisan families and helps preserve traditional crafts.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Meet Our <span className="gradient-text">Artisans</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The skilled hands behind every beautiful gamchha you see on our platform
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border text-center"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Featured Sellers */}
          <div className="mb-16">
            <h2 className="text-2xl font-display font-bold text-center mb-8">Featured Sellers</h2>
            
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl p-6 border border-border animate-pulse">
                    <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            ) : shops && shops.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.slice(0, 6).map((shop, index) => (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/shop/${shop.shop_slug}`}
                      className="block bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {shop.logo_url ? (
                            <img src={shop.logo_url} alt={shop.shop_name || ''} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-primary">
                              {shop.shop_name?.charAt(0) || 'S'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{shop.shop_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {shop.city}, {shop.state}
                          </p>
                          {shop.is_verified && (
                            <span className="text-xs text-primary font-medium">✓ Verified</span>
                          )}
                        </div>
                      </div>
                      {shop.description && (
                        <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                          {shop.description}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No sellers found</p>
            )}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 border border-primary/20 text-center"
          >
            <h2 className="text-2xl font-display font-bold mb-4">Become a Seller</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Are you an artisan or weaver? Join Gamchha Dukaan and reach customers across India. 
              We provide the platform, you provide the craft.
            </p>
            <Button asChild variant="hero">
              <Link to="/seller/register">
                Start Selling <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Artisans;