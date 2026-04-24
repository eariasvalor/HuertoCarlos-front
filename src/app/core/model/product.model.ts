export type Unit = 'KG' | 'GRAMS' | 'UNIT' | 'BUNCH' | 'BAG' | 'LITRE';

export interface Product {
  id: string;
  name: string;
  variety: string;
  varietyId: string;
  category: string;
  price: number;
  currency: string;
  unit: Unit;
  stock: number;
  available: boolean;
  image: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}