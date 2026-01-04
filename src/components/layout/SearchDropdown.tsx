import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Star, Store, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  rating: number | null;
  images: string[] | null;
  shop_name: string | null;
  shop_slug: string | null;
  category_name?: string;
}

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchDropdown = ({ isOpen, onClose }: SearchDropdownProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search products
  useEffect(() => {
    const searchProducts = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products_with_shop')
          .select(`
            id,
            name,
            slug,
            price,
            original_price,
            rating,
            images,
            shop_name,
            shop_slug
          `)
          .eq('is_published', true)
          .or(`name.ilike.%${query}%,fabric.ilike.%${query}%,pattern.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(8);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    // Close first, then navigate to avoid refresh
    onClose();
    setQuery('');
    
    // Use replace: false to ensure proper navigation without page reload
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`, { replace: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getProductImage = (product: SearchProduct) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return '/placeholder.svg';
  };

  const popularSearches = ['Cotton Gamchha', 'Bengali Gamchha', 'Handloom Towel', 'Traditional'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 bg-background border-b border-border shadow-lg z-50 max-h-[80vh] overflow-hidden"
          >
            <div className="container mx-auto px-3 py-4">
              {/* Search Input */}
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search for gamchhas, fabrics, patterns..."
                    className="w-full h-12 pl-12 pr-12 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search Results / Suggestions */}
              <div className="mt-4 max-h-[60vh] overflow-y-auto">
                {/* Loading State */}
                {isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-16 w-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Results */}
                {!isLoading && results.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleSearch(query)}
                      >
                        View all
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.slug || product.id}`}
                        onClick={() => {
                          onClose();
                          setQuery('');
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {product.name}
                          </h4>
                          {product.shop_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Store className="h-3 w-3" />
                              {product.shop_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-primary">
                              ₹{product.price.toLocaleString()}
                            </span>
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-xs text-muted-foreground line-through">
                                ₹{product.original_price.toLocaleString()}
                              </span>
                            )}
                            {product.rating && (
                              <span className="flex items-center text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-primary text-primary mr-0.5" />
                                {product.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {!isLoading && query.length >= 2 && results.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No products found for "{query}"</p>
                    <p className="text-xs text-muted-foreground mt-1">Try searching for something else</p>
                  </div>
                )}

                {/* Initial State - Show Recent & Popular Searches */}
                {!isLoading && query.length < 2 && (
                  <div className="space-y-6">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Recent Searches
                          </p>
                          <button
                            onClick={clearRecentSearches}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search) => (
                            <button
                              key={search}
                              onClick={() => handleSearch(search)}
                              className="px-3 py-1.5 bg-secondary/50 border border-border rounded-full text-xs hover:bg-secondary hover:border-primary/30 transition-colors"
                            >
                              {search}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Searches */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Popular Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {popularSearches.map((search) => (
                          <button
                            key={search}
                            onClick={() => handleSearch(search)}
                            className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary hover:bg-primary/20 transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchDropdown;