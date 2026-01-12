import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Privacy = () => {
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
            Privacy <span className="gradient-text">Policy</span>
          </h1>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-6">
              Last updated: January 2024
            </p>

            <div className="space-y-8">
              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  We collect information you provide directly, including:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Name, email address, and phone number</li>
                  <li>Shipping and billing addresses</li>
                  <li>Payment information (processed securely by our payment partners)</li>
                  <li>Order history and preferences</li>
                </ul>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Process and fulfill your orders</li>
                  <li>Communicate about orders, products, and promotions</li>
                  <li>Improve our platform and user experience</li>
                  <li>Prevent fraud and ensure security</li>
                </ul>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">3. Information Sharing</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  We share your information only with:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Sellers to fulfill your orders</li>
                  <li>Shipping partners for delivery</li>
                  <li>Payment processors for transactions</li>
                  <li>Service providers who assist our operations</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  We never sell your personal information to third parties.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">4. Data Security</h2>
                <p className="text-sm text-muted-foreground">
                  We implement appropriate security measures to protect your personal information. 
                  All data is encrypted in transit and at rest. We regularly review and update our 
                  security practices.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">5. Your Rights</h2>
                <p className="text-sm text-muted-foreground mb-3">You have the right to:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">6. Cookies</h2>
                <p className="text-sm text-muted-foreground">
                  We use cookies to improve your browsing experience, analyze site traffic, and 
                  personalize content. You can manage cookie preferences through your browser settings.
                </p>
              </section>

              <section className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-lg font-semibold mb-3">7. Contact Us</h2>
                <p className="text-sm text-muted-foreground">
                  For privacy-related questions or concerns, contact us at:{' '}
                  <a href="mailto:privacy@gamchha.com" className="text-primary hover:underline">
                    privacy@gamchha.com
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

export default Privacy;