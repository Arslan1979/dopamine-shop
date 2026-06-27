export interface User {
  id: string;
  email: string;
  name: string;
  soundEnabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  category: Category;
  inStock: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingPhone: string;
  deliveryMethod: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceSnapshot: number;
  productName: string;
  productImage: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  code: 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'INTERNAL_ERROR';
  message: string;
  details?: Array<{ field: string; message: string }>;
}
