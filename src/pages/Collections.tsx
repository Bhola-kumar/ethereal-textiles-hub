import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const collections = [
  {
    id: "bengali-gamchha",
    name: "Bengali Gamchha",
    description: "Traditional handwoven cotton gamchhas from Bengal, known for their distinctive red borders and lightweight comfort.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    productCount: 12,
  },
  {
    id: "assamese-gamosa",
    name: "Assamese Gamosa",
    description: "The iconic red and white Gamosa from Assam, a symbol of Assamese culture and hospitality.",
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=400&fit=crop",
    productCount: 8,
  },
  {
    id: "bath-towels",
    name: "Bath Towels",
    description: "Premium cotton bath towels combining traditional weaving with modern absorbency for everyday luxury.",
    image: "https://images.unsplash.com/photo-1616627988170-6c2c0e55f9b9?w=600&h=400&fit=crop",
    productCount: 15,
  },
  {
    id: "hand-towels",
    name: "Hand Towels",
    description: "Compact and quick-drying hand towels perfect for kitchen, bathroom, or travel.",
    image: "https://images.unsplash.com/photo-1583922146270-a19ff1b2ad2c?w=600&h=400&fit=crop",
    productCount: 10,
  },
  {
    id: "beach-towels",
    name: "Beach Towels",
    description: "Large, sand-resistant beach towels with vibrant patterns inspired by traditional textiles.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
    productCount: 6,
  },
  {
    id: "yoga-towels",
    name: "Yoga & Gym Towels",
    description: "Lightweight, sweat-absorbent towels designed for workouts and yoga sessions.",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
    productCount: 9,
  },
];

const Collections = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Our Collections
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Discover our curated collections of handwoven gamchhas and premium towels, 
            crafted with centuries-old techniques and sustainable practices.
          </motion.p>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link 
                  to={`/products?category=${collection.id}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-card border border-border">
                    <div className="aspect-[3/2] overflow-hidden">
                      <img
                        src={collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {collection.productCount} Products
                        </span>
                        <span className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                          Explore <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Browse our complete catalog or contact us for custom orders and bulk purchases.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Collections;
