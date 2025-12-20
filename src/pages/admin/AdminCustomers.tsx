import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AdminCustomers() {
  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Customers</h1>
        <Card className="bg-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Customer management coming soon</p>
            <p className="text-sm text-muted-foreground mt-2">View customer profiles and order history</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
