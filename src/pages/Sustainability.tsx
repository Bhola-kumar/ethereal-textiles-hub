import { motion } from 'framer-motion';
import { Leaf, Recycle, Heart, Sun, Droplets, Wind } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Sustainability = () => {
  const initiatives = [
    {
      icon: Leaf,
      title: 'Natural Fibers',
      description: 'Our gamchhas are made from 100% natural cotton, grown without harmful pesticides.',
    },
    {
      icon: Droplets,
      title: 'Water Conservation',
      description: 'Traditional weaving uses minimal water compared to industrial textile production.',
    },
    {
      icon: Sun,
      title: 'Solar Drying',
      description: 'Fabrics are sun-dried naturally, reducing energy consumption.',
    },
    {
      icon: Recycle,
      title: 'Minimal Waste',
      description: 'Handloom weaving produces near-zero fabric waste in the production process.',
    },
    {
      icon: Wind,
      title: 'Low Carbon',
      description: 'No heavy machinery means a significantly lower carbon footprint.',
    },
    {
      icon: Heart,
      title: 'Fair Trade',
      description: 'Direct trade with artisans ensures fair wages and sustainable livelihoods.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our <span className="gradient-text">Sustainability</span> Commitment
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Handloom is inherently sustainable. Here's how our artisans are keeping the planet in mind.
            </p>
          </div>

          {/* Hero Statement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-8 border border-green-500/20 mb-12 text-center"
          >
            <Leaf className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-3">Tradition Meets Responsibility</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              When you choose a handwoven gamchha, you're not just buying a product — you're supporting 
              a centuries-old craft that's naturally aligned with sustainable practices. Our artisans 
              have been practicing eco-friendly production long before it became a movement.
            </p>
          </motion.div>

          {/* Initiatives Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {initiatives.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Impact Section */}
          <div className="bg-card rounded-xl p-8 border border-border mb-12">
            <h2 className="text-xl font-semibold mb-6 text-center">Why Handloom Matters</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-primary mb-2">70%</p>
                <p className="text-sm text-muted-foreground">Less water used compared to industrial textiles</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary mb-2">Zero</p>
                <p className="text-sm text-muted-foreground">Chemical dyes in traditional production</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary mb-2">100%</p>
                <p className="text-sm text-muted-foreground">Biodegradable natural cotton fibers</p>
              </div>
            </div>
          </div>

          {/* Commitment */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-xl font-semibold mb-4">Our Promise</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              We're committed to promoting sustainable fashion by connecting you directly with artisans 
              who practice traditional, eco-friendly methods. Every purchase supports not just a family, 
              but a way of life that respects our planet.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                Eco-Friendly
              </span>
              <span className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                Handmade
              </span>
              <span className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                Fair Trade
              </span>
              <span className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                Zero Waste
              </span>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Sustainability;