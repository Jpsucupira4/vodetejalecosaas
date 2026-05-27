export interface Profile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "vendedora";
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  size: string;
  color: string;
  priceRetail: number;
  priceWholesale: number;
  stock: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  total: number;
  payment: string;
  saleType: "varejo" | "atacado";
  shippingMethod: string;
  shippingCost: number;
  notes: string | null;
  sellerId: string;
  sellerName: string;
  customerId: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  createdAt: string;
}
