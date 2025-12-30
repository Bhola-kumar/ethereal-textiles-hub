import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Grid3X3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicProducts } from '@/hooks/usePublicProducts';
import { useCategories } from '@/hooks/useCategories';
import ProductCard from '@/components/product/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'react-router-dom';

interface FilterOption {
  label: string;
  value: string;
}

const FilterSection = ({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: FilterOption[];
  selected: string[];
  onSelect: (option: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-border/50 pb-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-medium mb-3"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => onSelect(option.value)}
                  className="h-4 w-4 rounded border-border bg-secondary accent-primary"
                />
                {option.label}
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);
  const [sortBy, setSortBy] = useState('popularity');

  // Initialize from URL params
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  const { data: products = [], isLoading } = usePublicProducts();
  const { data: categories = [] } = useCategories();

  // Sync with URL params on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    } else {
      // If no URL param, ensure state is clear (e.g. if navigating back)
      setSelectedCategories([]);
    }
  }, [searchParams]);

  const toggleFilter = (list: string[], item: string, setter: (items: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  // Extract unique filter options from products
  const filterOptions = useMemo(() => {
    const fabrics = [...new Set(products.map(p => p.fabric).filter(Boolean))] as string[];
    const colors = [...new Set(products.map(p => p.color).filter(Boolean))] as string[];
    const patterns = [...new Set(products.map(p => p.pattern).filter(Boolean))] as string[];

    return {
      fabrics: fabrics.map(f => ({ label: f, value: f })),
      colors: colors.map(c => ({ label: c, value: c })),
      patterns: patterns.map(p => ({ label: p, value: p }))
    };
  }, [products]);

  const categoryOptions = useMemo(() => {
    return categories.map(c => ({ label: c.name, value: c.id }));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategories.length > 0) {
      result = result.filter((p) => {
        // Filter by ID instead of name
        return p.category_id && selectedCategories.includes(p.category_id);
      });
    }
    if (selectedFabrics.length > 0) {
      result = result.filter((p) => p.fabric && selectedFabrics.includes(p.fabric));
    }
    if (selectedColors.length > 0) {
      result = result.filter((p) => p.color && selectedColors.includes(p.color));
    }
    if (selectedPatterns.length > 0) {
      result = result.filter((p) => p.pattern && selectedPatterns.includes(p.pattern));
    }
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        result = result.filter((p) => p.is_trending).concat(result.filter((p) => !p.is_trending));
    }

    return result;
  }, [products, selectedCategories, selectedFabrics, selectedColors, selectedPatterns, priceRange, sortBy]);

  const activeFiltersCount =
    selectedCategories.length +
    selectedFabrics.length +
    selectedColors.length +
    selectedPatterns.length;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedFabrics([]);
    setSelectedColors([]);
    setSelectedPatterns([]);
    setPriceRange([0, 10000]);
    // Clear URL param
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-24">
        {/* Hero Banner */}
        <section className="relative py-12 lg:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-dark to-background" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl lg:text-6xl font-display font-bold mb-4">
                Our <span className="gradient-text">Collection</span>
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Discover our complete range of handcrafted gamchhas from verified sellers.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Toolbar */}
        <section className="sticky top-16 lg:top-20 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={isFilterOpen ? 'default' : 'outline'}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="lg:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground hidden lg:block">
                  {filteredProducts.length} Products
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-1 p-1 bg-secondary rounded-lg">
                  <button
                    onClick={() => setGridCols(2)}
                    className={`p-2 rounded-md transition-colors ${gridCols === 2 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(3)}
                    className={`p-2 rounded-md transition-colors ${gridCols === 3 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setGridCols(4)}
                    className={`p-2 rounded-md transition-colors ${gridCols === 4 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="3" height="3" rx="0.5" />
                      <rect x="5" y="1" width="3" height="3" rx="0.5" />
                      <rect x="9" y="1" width="3" height="3" rx="0.5" />
                      <rect x="13" y="1" width="2" height="3" rx="0.5" />
                    </svg>
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 px-4 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="popularity">Popularity</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex gap-8">
              {/* Desktop Filters Sidebar */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-40">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-semibold text-lg">Filters</h3>
                    {activeFiltersCount > 0 && (
                      <button onClick={clearAllFilters} className="text-sm text-primary hover:underline">
                        Clear all
                      </button>
                    )}
                  </div>

                  <FilterSection
                    title="Category"
                    options={categoryOptions}
                    selected={selectedCategories}
                    onSelect={(opt) => toggleFilter(selectedCategories, opt, setSelectedCategories)}
                  />

                  <FilterSection
                    title="Fabric"
                    options={filterOptions.fabrics}
                    selected={selectedFabrics}
                    onSelect={(opt) => toggleFilter(selectedFabrics, opt, setSelectedFabrics)}
                  />

                  <FilterSection
                    title="Color"
                    options={filterOptions.colors}
                    selected={selectedColors}
                    onSelect={(opt) => toggleFilter(selectedColors, opt, setSelectedColors)}
                  />

                  <FilterSection
                    title="Pattern"
                    options={filterOptions.patterns}
                    selected={selectedPatterns}
                    onSelect={(opt) => toggleFilter(selectedPatterns, opt, setSelectedPatterns)}
                  />

                  <div className="pb-4">
                    <h4 className="font-medium mb-3">Price Range</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-full h-9 px-3 bg-secondary border border-border rounded-lg text-sm"
                        placeholder="Min"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full h-9 px-3 bg-secondary border border-border rounded-lg text-sm"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </aside>

              {/* Product Grid */}
              <div className="flex-1">
                {isLoading ? (
                  <div className={`grid gap-4 lg:gap-6 grid-cols-2 lg:grid-cols-${gridCols}`}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground mb-4">No products found.</p>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`grid gap-4 lg:gap-6 ${gridCols === 2 ? 'grid-cols-2' : gridCols === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'
                      }`}
                  >
                    {filteredProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setIsFilterOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-80 bg-card border-r border-border z-50 lg:hidden overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-semibold text-lg">Filters</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {activeFiltersCount > 0 && (
                    <button onClick={clearAllFilters} className="text-sm text-primary hover:underline mb-6">
                      Clear all filters
                    </button>
                  )}

                  <FilterSection
                    title="Category"
                    options={categoryOptions}
                    selected={selectedCategories}
                    onSelect={(opt) => toggleFilter(selectedCategories, opt, setSelectedCategories)}
                  />

                  <FilterSection
                    title="Fabric"
                    options={filterOptions.fabrics}
                    selected={selectedFabrics}
                    onSelect={(opt) => toggleFilter(selectedFabrics, opt, setSelectedFabrics)}
                  />

                  <FilterSection
                    title="Color"
                    options={filterOptions.colors}
                    selected={selectedColors}
                    onSelect={(opt) => toggleFilter(selectedColors, opt, setSelectedColors)}
                  />

                  <FilterSection
                    title="Pattern"
                    options={filterOptions.patterns}
                    selected={selectedPatterns}
                    onSelect={(opt) => toggleFilter(selectedPatterns, opt, setSelectedPatterns)}
                  />

                  <div className="mt-6">
                    <Button variant="hero" className="w-full" onClick={() => setIsFilterOpen(false)}>
                      Show {filteredProducts.length} Products
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
