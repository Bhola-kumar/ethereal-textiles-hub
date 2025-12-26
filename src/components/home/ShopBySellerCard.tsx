import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Store, MapPin, BadgeCheck } from 'lucide-react';
import { PublicShop } from '@/hooks/usePublicShops';

interface ShopBySellerCardProps {
  shop: PublicShop;
  index: number;
}

export default function ShopBySellerCard({ shop, index }: ShopBySellerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/shop/${shop.shop_slug}`}>
        <div className="group relative overflow-hidden rounded-2xl glass-card hover-lift h-full">
          {/* Banner/Background */}
          <div className="aspect-[16/9] relative overflow-hidden">
            {shop.banner_url ? (
              <img
                src={shop.banner_url}
                alt={shop.shop_name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          {/* Shop Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-start gap-3">
              {/* Logo */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 border-background bg-card">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={shop.shop_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {shop.shop_name}
                  </h3>
                  {shop.is_verified && (
                    <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                {(shop.city || shop.state) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {[shop.city, shop.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
