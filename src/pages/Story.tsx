import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Story = () => {
  const timeline = [
    { year: '2020', title: 'The Idea', description: 'During the pandemic, we saw artisans struggling to sell their handmade gamchhas. The idea of a dedicated platform was born.' },
    { year: '2021', title: 'First Steps', description: 'We started connecting with weavers in West Bengal, understanding their craft and challenges.' },
    { year: '2022', title: 'Platform Launch', description: 'Gamchha Dukaan launched with 10 artisan sellers and 50 unique products.' },
    { year: '2023', title: 'Growing Together', description: 'Expanded to 50+ sellers across multiple states, serving thousands of customers.' },
    { year: '2024', title: 'Building Community', description: 'Focused on building a community that celebrates traditional textiles and supports artisans.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our <span className="gradient-text">Story</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From a simple idea to a platform that connects artisans with conscious consumers
            </p>
          </div>

          {/* Opening Story */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg dark:prose-invert mx-auto mb-16"
          >
            <div className="bg-card rounded-xl p-8 border border-border">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Gamchha Dukaan was born from a simple observation: while the world was moving digital, 
                our skilled artisans were being left behind. The pandemic hit traditional weavers hard, 
                cutting off their access to local markets and leaving them with unsold inventory.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We asked ourselves - <em className="text-foreground">what if we could create a bridge?</em> A platform where 
                these master craftsmen could showcase their work to the world, where each purchase tells 
                a story, and where tradition meets modern convenience.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, Gamchha Dukaan is more than a marketplace. It's a movement to preserve 
                India's rich textile heritage while ensuring our artisans can earn a dignified livelihood.
              </p>
            </div>
          </motion.div>

          {/* Timeline */}
          <div className="mb-16">
            <h2 className="text-2xl font-display font-bold text-center mb-8">Our Journey</h2>
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-border hidden md:block" />
              <div className="space-y-8">
                {timeline.map((item, index) => (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                      <div className="bg-card rounded-xl p-6 border border-border">
                        <span className="text-primary font-bold">{item.year}</span>
                        <h3 className="font-semibold mt-1 mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 h-4 w-4 rounded-full bg-primary hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 border border-primary/20 text-center"
          >
            <h2 className="text-2xl font-display font-bold mb-4">What Drives Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Every gamchha has a story - of the weaver who made it, the tradition it carries, 
              and the hands that will cherish it. We're here to make sure these stories continue.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-4 py-2 bg-background/50 rounded-full border border-border">Artisan First</span>
              <span className="px-4 py-2 bg-background/50 rounded-full border border-border">Quality Always</span>
              <span className="px-4 py-2 bg-background/50 rounded-full border border-border">Heritage Preserved</span>
              <span className="px-4 py-2 bg-background/50 rounded-full border border-border">Community Built</span>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Story;