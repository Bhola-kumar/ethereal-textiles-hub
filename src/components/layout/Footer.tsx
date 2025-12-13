import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const footerLinks = {
    shop: [
      { name: 'All Products', path: '/products' },
      { name: 'New Arrivals', path: '/products?filter=new' },
      { name: 'Best Sellers', path: '/products?filter=trending' },
      { name: 'Collections', path: '/collections' },
    ],
    support: [
      { name: 'Contact Us', path: '/contact' },
      { name: 'FAQs', path: '/faq' },
      { name: 'Shipping Info', path: '/shipping' },
      { name: 'Returns', path: '/returns' },
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Our Story', path: '/story' },
      { name: 'Artisans', path: '/artisans' },
      { name: 'Sustainability', path: '/sustainability' },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-charcoal-dark border-t border-border/50">
      {/* Newsletter Section */}
      <div className="border-b border-border/30">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-display font-bold mb-2">
                Join the <span className="gradient-text">Gamchha</span> Family
              </h3>
              <p className="text-muted-foreground">
                Get 10% off your first order and stay updated with new arrivals.
              </p>
            </div>
            <div className="flex w-full lg:w-auto gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 lg:w-80 h-12 px-4 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button variant="hero" size="lg">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-display font-bold gradient-text">
                Gamchha
              </span>
              <span className="text-xs text-muted-foreground ml-1">DUKAAN</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6">
              Celebrating the timeless tradition of Indian textiles, one gamchha at a time.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="h-10 w-10 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                hello@gamchha.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                +91 98765 43210
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                Kolkata, West Bengal, India
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Gamchha Dukaan. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
