import { motion } from 'framer-motion';
import { Truck, Clock, MapPin, Package, Shield, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Shipping = () => {
  const shippingInfo = [
    {
      icon: Truck,
      title: 'Standard Delivery',
      description: '5-7 business days',
      details: 'Available across all serviceable pin codes in India',
    },
    {
      icon: Clock,
      title: 'Express Delivery',
      description: '2-3 business days',
      details: 'Available in major cities and metros',
    },
    {
      icon: MapPin,
      title: 'Pan India Coverage',
      description: '20,000+ pin codes',
      details: 'We deliver to most locations across India',
    },
    {
      icon: Package,
      title: 'Secure Packaging',
      description: 'Quality assured',
      details: 'Products are carefully packed to prevent damage',
    },
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
              Shipping <span className="gradient-text">Information</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about how we deliver your orders
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {shippingInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <info.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{info.title}</h3>
                <p className="text-primary font-medium text-sm mb-2">{info.description}</p>
                <p className="text-sm text-muted-foreground">{info.details}</p>
              </motion.div>
            ))}
          </div>

          <div className="space-y-8">
            <section className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Shipping Charges
              </h2>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Shipping charges are determined by individual sellers and may vary based on:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                  <li>Product weight and dimensions</li>
                  <li>Delivery location</li>
                  <li>Order value (many sellers offer free shipping above a minimum order)</li>
                </ul>
                <p className="text-muted-foreground">
                  The exact shipping cost will be displayed at checkout before you place your order.
                </p>
              </div>
            </section>

            <section className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-semibold mb-4">Order Processing</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Order Confirmation:</strong> Once you place an order, 
                  you'll receive a confirmation email with your order details.
                </p>
                <p>
                  <strong className="text-foreground">Processing Time:</strong> Most orders are processed 
                  within 1-2 business days. Handmade items may take longer.
                </p>
                <p>
                  <strong className="text-foreground">Tracking:</strong> You'll receive a tracking link 
                  via email and SMS once your order is shipped.
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Important Notes
              </h2>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                <li>Delivery times may be affected during festivals and peak seasons</li>
                <li>Some remote areas may have longer delivery times</li>
                <li>Cash on Delivery (COD) availability depends on the seller and location</li>
                <li>Please ensure someone is available to receive the package at the delivery address</li>
              </ul>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Shipping;