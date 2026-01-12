import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">
            Terms of <span className="gradient-text">Service</span>
          </h1>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              Last updated: January 2024
            </p>

            <div className="space-y-8">
              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-sm text-muted-foreground">
                  By accessing or using Gamchha Dukaan, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our platform.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">2. Account Registration</h2>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>You must be at least 18 years old to create an account</li>
                  <li>One account per person; sharing accounts is not allowed</li>
                </ul>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">3. Purchases & Payments</h2>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>All prices are in Indian Rupees (INR) unless stated otherwise</li>
                  <li>Prices may change without notice</li>
                  <li>Payment must be made at the time of purchase</li>
                  <li>We accept UPI, bank transfers, and COD where available</li>
                </ul>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">4. Shipping & Delivery</h2>
                <p className="text-sm text-muted-foreground">
                  Shipping times are estimates and may vary based on location and seller processing time. 
                  We are not responsible for delays caused by shipping carriers or customs.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">5. Returns & Refunds</h2>
                <p className="text-sm text-muted-foreground">
                  Please refer to our{' '}
                  <a href="/returns" className="text-primary hover:underline">
                    Returns Policy
                  </a>{' '}
                  for detailed information about returns, exchanges, and refunds.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">6. Seller Terms</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Sellers on our platform agree to:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Provide accurate product descriptions and images</li>
                  <li>Ship orders within the specified timeframe</li>
                  <li>Handle customer queries professionally</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">7. Intellectual Property</h2>
                <p className="text-sm text-muted-foreground">
                  All content on Gamchha Dukaan, including logos, text, graphics, and software, 
                  is the property of Gamchha Dukaan or its content suppliers and is protected by 
                  intellectual property laws.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">8. Limitation of Liability</h2>
                <p className="text-sm text-muted-foreground">
                  Gamchha Dukaan acts as a marketplace connecting buyers and sellers. We are not 
                  responsible for the quality, safety, or legality of items listed by sellers.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">9. Changes to Terms</h2>
                <p className="text-sm text-muted-foreground">
                  We may update these terms from time to time. Continued use of the platform after 
                  changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">10. Contact</h2>
                <p className="text-sm text-muted-foreground">
                  For questions about these terms, contact us at:{' '}
                  <a href="mailto:legal@gamchha.com" className="text-primary hover:underline">
                    legal@gamchha.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;