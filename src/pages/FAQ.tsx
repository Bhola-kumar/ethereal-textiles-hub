import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      category: 'Orders & Shipping',
      questions: [
        {
          q: 'How long does delivery take?',
          a: 'Standard delivery takes 5-7 business days within India. Express delivery is available for select locations and takes 2-3 business days.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Currently, we only ship within India. We\'re working on expanding to international markets soon.',
        },
        {
          q: 'How can I track my order?',
          a: 'Once your order is shipped, you\'ll receive a tracking link via email and SMS. You can also track your order from the "My Orders" section.',
        },
        {
          q: 'What are the shipping charges?',
          a: 'Shipping charges vary by seller. Many sellers offer free shipping above a certain order value. You can see the exact charges at checkout.',
        },
      ],
    },
    {
      category: 'Returns & Refunds',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We accept returns within 7 days of delivery for most products. Items must be unused and in original packaging.',
        },
        {
          q: 'How do I initiate a return?',
          a: 'Go to "My Orders", select the order, and click "Request Return". Our team will review and process your request within 24 hours.',
        },
        {
          q: 'When will I receive my refund?',
          a: 'Refunds are processed within 5-7 business days after we receive the returned item. The amount will be credited to your original payment method.',
        },
      ],
    },
    {
      category: 'Products',
      questions: [
        {
          q: 'Are all products handmade?',
          a: 'Most products on Gamchha Dukaan are handmade by skilled artisans. Each product description mentions the crafting method.',
        },
        {
          q: 'How do I care for gamchha products?',
          a: 'We recommend hand washing with mild detergent and air drying. Detailed care instructions are provided with each product.',
        },
        {
          q: 'Can I request custom orders?',
          a: 'Yes! Many of our sellers accept custom orders. Contact the seller directly through the product page to discuss your requirements.',
        },
      ],
    },
    {
      category: 'Sellers',
      questions: [
        {
          q: 'How can I become a seller?',
          a: 'Click on "Become a Seller" in the header and fill out the registration form. Our team will review your application within 48 hours.',
        },
        {
          q: 'What are the seller fees?',
          a: 'We charge a small commission on each sale. The exact percentage depends on the product category. Contact us for more details.',
        },
        {
          q: 'How do sellers receive payments?',
          a: 'Sellers receive payments directly through UPI or bank transfer after successful order delivery.',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h1>
            <p className="text-muted-foreground">
              Find answers to common questions about our platform
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((section, sectionIndex) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                <h2 className="text-lg font-semibold mb-4 text-primary">{section.category}</h2>
                <Accordion type="single" collapsible className="bg-card rounded-xl border border-border">
                  {section.questions.map((faq, index) => (
                    <AccordionItem key={index} value={`${sectionIndex}-${index}`}>
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <span className="text-left text-sm">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 text-sm text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center p-6 bg-secondary/50 rounded-xl border border-border"
          >
            <h3 className="font-semibold mb-2">Still have questions?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is here to help you
            </p>
            <a href="/contact" className="text-primary hover:underline text-sm font-medium">
              Contact Us →
            </a>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;