// Static product data for reference/demo purposes
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  category?: string;
  fabric?: string;
  color?: string;
  pattern?: string;
  rating?: number;
  reviews?: number;
  description?: string;
  care?: string[];
  inStock?: boolean;
  isNew?: boolean;
  isTrending?: boolean;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Beldanga Classic Red Gamchha',
    price: 299,
    originalPrice: 449,
    image: 'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=800',
    images: [
      'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4210342/pexels-photo-4210342.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    category: 'Traditional',
    fabric: 'Pure Cotton',
    color: 'Red & White',
    pattern: 'Checkered',
    rating: 4.9,
    reviews: 567,
    description: 'The iconic Beldanga gamchha from West Bengal featuring the quintessential red and white checks. Handwoven by skilled artisans using traditional pit looms, this gamchha is a cultural symbol used in puja ceremonies, as a towel, and as a versatile everyday accessory.',
    care: ['Machine wash cold', 'Tumble dry low', 'Do not bleach', 'Iron on medium heat'],
    inStock: true,
    isTrending: true,
  },
  {
    id: '2',
    name: 'Phulia Handloom Cotton Gamchha',
    price: 399,
    originalPrice: 549,
    image: 'https://images.pexels.com/photos/4210341/pexels-photo-4210341.jpeg?auto=compress&cs=tinysrgb&w=800',
    category: 'Premium',
    fabric: 'Handloom Cotton',
    color: 'Blue & White',
    pattern: 'Striped',
    rating: 4.8,
    reviews: 324,
    description: 'Woven in the famous handloom cluster of Phulia, this gamchha showcases the signature blue and white stripes. Made with 100% cotton, it is highly absorbent, quick-drying, and becomes softer with each wash.',
    care: ['Hand wash recommended', 'Dry in shade', 'Do not bleach', 'Iron on low heat'],
    inStock: true,
    isNew: true,
  },
];

export const categories = [
  { id: 'traditional', name: 'Traditional', count: 28, image: 'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'premium', name: 'Premium', count: 18, image: 'https://images.pexels.com/photos/4210341/pexels-photo-4210341.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'luxury', name: 'Luxury', count: 12, image: 'https://images.pexels.com/photos/6044827/pexels-photo-6044827.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 'everyday', name: 'Everyday', count: 35, image: 'https://images.pexels.com/photos/5591664/pexels-photo-5591664.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

export const fabrics = [
  'Pure Cotton',
  'Handloom Cotton', 
  'Khadi Cotton',
  'Organic Cotton',
  'Cotton-Silk Blend',
  'Silk-Cotton Blend',
  'Fine Cotton',
  'Ikat Cotton',
  'Fine Muslin Cotton',
  'Microfiber Cotton'
];

export const colors = [
  'Red & White',
  'Blue & White', 
  'Red & Golden',
  'Natural White',
  'Cream & Maroon',
  'Off-White',
  'Multi-Color Pack',
  'Indigo & White',
  'White & Silver',
  'Navy & Orange',
  'Green & White'
];

export const patterns = [
  'Checkered',
  'Striped',
  'Bordered',
  'Plain',
  'Traditional Weave',
  'Handspun Texture',
  'Assorted Checks',
  'Geometric Ikat',
  'Bordered Checks',
  'Floral Jamdani',
  'Sporty Stripes',
  'Classic Checks'
];
