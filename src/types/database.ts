export type SubscriptionStatus = 'pending' | 'active' | 'expired';
export type UserRole = 'owner' | 'kasir';
export type ActivationCodeStatus = 'unused' | 'used' | 'void';
export type StockMovementType = 'stok_masuk' | 'opname' | 'penjualan';
export type PaymentMethod = 'tunai' | 'qris' | 'transfer';
export type TransactionStatus = 'selesai' | 'dibatalkan';

export interface Store {
  id: string;
  name: string;
  owner_name: string | null;
  address: string | null;
  whatsapp_number: string | null;
  email: string | null;
  auth_user_id: string | null;
  subscription_status: SubscriptionStatus;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface StoreUser {
  id: string;
  store_id: string;
  auth_user_id: string | null;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface ActivationCode {
  id: string;
  store_id: string;
  code: string;
  status: ActivationCodeStatus;
  generated_at: string;
  used_at: string | null;
  valid_until: string | null;
  stores?: {
    name: string;
    owner_name: string | null;
    email: string | null;
  };
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  category: string | null;
  unit: string | null;
  sku: string | null;
  cost_price: number;
  sell_price: number;
  current_stock: number;
  min_stock_alert: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StockMovement {
  id: string;
  store_id: string;
  product_id: string;
  type: StockMovementType;
  quantity_change: number;
  cost_price: number | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  products?: {
    name: string;
    unit: string | null;
  };
  store_users?: {
    name: string;
  };
}

export interface Transaction {
  id: string;
  store_id: string;
  transaction_number: string;
  cashier_id: string | null;
  payment_method: PaymentMethod;
  total_amount: number;
  status: TransactionStatus;
  created_at: string;
  store_users?: {
    name: string;
  };
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  store_id: string;
  transaction_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price_at_sale: number;
  subtotal: number;
}
