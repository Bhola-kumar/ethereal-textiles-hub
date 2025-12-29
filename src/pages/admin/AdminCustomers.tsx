import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { Users, Search, Mail, Phone, ShoppingBag, Calendar, IndianRupee, X, User } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminCustomers() {
  const { data: customers = [], isLoading } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c =>
    (c.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (c.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery)
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.orders_count, 0);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
      {/* Left Panel - Customers List */}
      <motion.div 
        className={`flex-1 flex flex-col min-w-0 ${selectedCustomer ? 'hidden lg:flex' : 'flex'}`}
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-6">Customers</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or phone..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>

        {/* Customer List */}
        <Card className="flex-1 bg-card border-border/50 overflow-hidden">
          <CardContent className="p-0 h-full">
            {filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No customers found</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="divide-y divide-border">
                  {filteredCustomers.map(customer => (
                    <motion.div
                      key={customer.id}
                      className={`p-4 hover:bg-accent/30 cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id ? 'bg-accent/50 border-l-2 border-primary' : ''
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={customer.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground line-clamp-1">
                            {customer.full_name || 'Unnamed Customer'}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary">
                            ₹{customer.total_spent.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.orders_count} orders
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Right Panel - Customer Details */}
      {selectedCustomer && (
        <motion.div
          className="w-full lg:w-[400px] xl:w-[450px] flex-shrink-0"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <Card className="h-full bg-card border-border/50 flex flex-col">
            <CardHeader className="flex-shrink-0 border-b border-border/50 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-display">Customer Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <CardContent className="p-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center mb-8">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={selectedCustomer.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {selectedCustomer.full_name?.charAt(0)?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{selectedCustomer.full_name || 'Unnamed Customer'}</h2>
                  <Badge variant="outline" className="mt-2">Customer</Badge>
                </div>

                {/* Contact Info */}
                <div className="space-y-4 mb-8">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedCustomer.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedCustomer.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                          {format(new Date(selectedCustomer.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Stats */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Order Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-accent/30 text-center">
                      <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedCustomer.orders_count}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 text-center">
                      <IndianRupee className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">₹{selectedCustomer.total_spent.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                  </div>
                  {selectedCustomer.orders_count > 0 && (
                    <div className="p-4 rounded-lg bg-accent/30 text-center">
                      <p className="text-lg font-semibold">
                        ₹{Math.round(selectedCustomer.total_spent / selectedCustomer.orders_count).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Average Order Value</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
