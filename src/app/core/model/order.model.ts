export type OrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'IN_PREPARATION'
  | 'READY_FOR_PICKUP'
  | 'CANCELLED';

export interface OrderLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  visibleId: string;
  customerId: string;
  lines: OrderLine[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  possibleDuplicate: boolean;
}

export interface CreateOrderRequest {
  customerId: string;
  lines: { productId: string; quantity: number }[];
}