import { motion } from 'framer-motion';
import { RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Returns = () => {
  const steps = [
    { step: 1, title: 'Request Return', description: 'Go to My Orders and select the item you want to return' },
    { step: 2, title: 'Approval', description: 'Our team reviews your request within 24 hours' },
    { step: 3, title: 'Pickup/Drop', description: 'Schedule a pickup or drop at the nearest courier point' },
    { step: 4, title: 'Refund', description: 'Refund processed within 5-7 days after receiving the item' },
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
              Returns & <span className="gradient-text">Refunds</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We want you to be completely satisfied with your purchase
            </p>
          </div>

          {/* Return Process Steps */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6 text-center">How Returns Work</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl p-4 border border-border text-center"
                >
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Eligible for Return */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Eligible for Return
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  Products returned within 7 days of delivery
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  Unused items in original packaging
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  Products with manufacturing defects
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  Wrong item received
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  Damaged during transit
                </li>
              </ul>
            </div>

            {/* Not Eligible for Return */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Not Eligible for Return
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Products returned after 7 days
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Used or washed items
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Items without original tags/packaging
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Custom or personalized orders
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  Items marked as "Non-Returnable"
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <section className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                Refund Policy
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Processing Time:</strong> Refunds are initiated within 
                  2-3 business days after we receive and verify the returned item.
                </p>
                <p>
                  <strong className="text-foreground">Credit Time:</strong> The refund will be credited to your 
                  original payment method within 5-7 business days.
                </p>
                <p>
                  <strong className="text-foreground">COD Orders:</strong> For Cash on Delivery orders, refunds 
                  will be processed via bank transfer. Please ensure your bank details are updated.
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Important Information
              </h2>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                <li>Keep the original invoice and packaging until the return window expires</li>
                <li>Take photos/videos while unpacking if you receive a damaged item</li>
                <li>Shipping charges are non-refundable unless the return is due to our error</li>
                <li>For any issues, contact our support team within 48 hours of delivery</li>
              </ul>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Returns;