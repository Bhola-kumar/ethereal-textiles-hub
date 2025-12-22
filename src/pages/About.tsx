import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Heart, Leaf, Users, Award, MapPin, History } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Handcrafted with Love",
      description: "Every gamchha is woven by skilled artisans who have inherited this craft through generations.",
    },
    {
      icon: Leaf,
      title: "Sustainable & Natural",
      description: "We use 100% natural cotton and eco-friendly dyes, ensuring minimal environmental impact.",
    },
    {
      icon: Users,
      title: "Empowering Artisans",
      description: "We work directly with weaver communities, ensuring fair wages and preserving traditional livelihoods.",
    },
    {
      icon: Award,
      title: "Quality Assured",
      description: "Each piece undergoes rigorous quality checks to ensure durability and authenticity.",
    },
  ];

  const milestones = [
    { year: "2018", title: "Founded", description: "Started with 5 artisan families in rural Bengal" },
    { year: "2019", title: "First 1000 Orders", description: "Reached our first milestone of customer trust" },
    { year: "2021", title: "Pan-India Delivery", description: "Expanded to deliver across all states" },
    { year: "2023", title: "International Shipping", description: "Now shipping to 15+ countries worldwide" },
    { year: "2024", title: "500+ Artisans", description: "Growing community of skilled weavers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Weaving Stories, <br />
                <span className="text-primary">One Thread at a Time</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                We are on a mission to revive the ancient art of gamchha weaving 
                while creating sustainable livelihoods for rural artisan communities 
                across India.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Artisans</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">15+</div>
                  <div className="text-sm text-muted-foreground">Countries</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=500&fit=crop"
                alt="Artisan weaving gamchha"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-foreground">Bengal, India</div>
                    <div className="text-sm text-muted-foreground">Handloom Heritage</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <History className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The gamchha, a simple cotton towel, has been an integral part of Indian culture 
                for centuries. From the rice fields of Bengal to the tea gardens of Assam, 
                it has served as a versatile companion—a towel, a head cover, a makeshift bag, 
                and even a symbol of respect when offered as a gift.
              </p>
              <p>
                We started this journey in 2018 when we visited a small weaving village in 
                Shantipur, West Bengal. We saw master weavers struggling to find markets for 
                their exquisite handwoven gamchhas, as machine-made alternatives flooded the market.
              </p>
              <p>
                Today, we work with over 500 artisan families across Bengal, Assam, Bihar, 
                and Odisha—helping them preserve their ancestral craft while reaching customers 
                who appreciate authentic, handmade textiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every decision we make is guided by our commitment to quality, 
              sustainability, and the welfare of our artisan partners.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-6 rounded-2xl border border-border text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Journey</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border" />
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center gap-8 mb-8 ${
                    index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "text-right" : "text-left"}`}>
                    <div className="font-bold text-primary text-lg">{milestone.year}</div>
                    <div className="font-semibold text-foreground">{milestone.title}</div>
                    <div className="text-sm text-muted-foreground">{milestone.description}</div>
                  </div>
                  <div className="w-4 h-4 bg-primary rounded-full z-10 ring-4 ring-background" />
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Join Our Journey
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Every purchase supports traditional artisans and helps preserve 
            India's rich textile heritage.
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Shop Now
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
