const VARIETY_IMAGES: Record<string, string> = {
  'raf':           'images/products/tomato-raf.jpg',
  'cherry':        'images/products/tomato-cherry.jpg',
  'corazón de buey': 'images/products/tomato-cordebou.jpg',
  'black':         'https://images.unsplash.com/photo-1561136594-7f68f8b7e4b5?w=400&q=80',
  'batavia':       'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&q=80',
  'basil':         'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=400&q=80',
};

const CATEGORY_IMAGES: Record<string, string> = {
  'tomato':      'images/products/tomato-default.jpg',
  'vegetable':   'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&q=80',
  'herb':        'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=400&q=80',
  'fruit':       'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80',
  'lettuce':     'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80';

export function getProductImage(variety: string, category: string): string {
  const varietyKey = variety.toLowerCase();
  const categoryKey = category.toLowerCase();

  return VARIETY_IMAGES[varietyKey]
    ?? CATEGORY_IMAGES[categoryKey]
    ?? DEFAULT_IMAGE;
}