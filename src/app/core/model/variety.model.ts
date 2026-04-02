export interface Variety {
  id: string;
  name: string;
  productCategory: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}