import { supabase } from "./supabase";
import { toCamel, toSnake } from "./helpers";
import type { Customer, Expense, Product, Profile, Sale } from "../types";

// ── Products ─────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw error;
  return toCamel<Product[]>(data);
}

export async function createProduct(p: Omit<Product, "id" | "createdAt">) {
  const { error } = await supabase.from("products").insert(toSnake(p as Record<string, unknown>));
  if (error) throw error;
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, "id" | "createdAt">>) {
  const { error } = await supabase.from("products").update(toSnake(updates as Record<string, unknown>)).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function decreaseStock(productId: string, qty: number) {
  const { data: p, error: e1 } = await supabase
    .from("products").select("stock").eq("id", productId).single();
  if (e1) throw e1;
  if (p.stock < qty) throw new Error("Estoque insuficiente.");
  const { error: e2 } = await supabase
    .from("products").update({ stock: p.stock - qty }).eq("id", productId);
  if (e2) throw e2;
}

// ── Sales ─────────────────────────────────────────────────────────────
export interface SaleFilters {
  sellerId?: string;
  from?: string;
  to?: string;
}

export async function getSales(filters: SaleFilters = {}): Promise<Sale[]> {
  let q = supabase.from("sales").select("*").order("created_at", { ascending: false });
  if (filters.sellerId) q = q.eq("seller_id", filters.sellerId);
  if (filters.from)     q = q.gte("created_at", filters.from);
  if (filters.to)       q = q.lte("created_at", filters.to + "T23:59:59");
  const { data, error } = await q;
  if (error) throw error;
  return toCamel<Sale[]>(data);
}

export async function createSale(sale: Omit<Sale, "id">) {
  const { error } = await supabase.from("sales").insert(toSnake(sale as unknown as Record<string, unknown>));
  if (error) throw error;
}

export async function deleteSale(id: string) {
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw error;
}

// ── Profiles ──────────────────────────────────────────────────────────
export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("name");
  if (error) throw error;
  return toCamel<Profile[]>(data);
}

// ── Customers ─────────────────────────────────────────────────────────
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select("*").order("name");
  if (error) throw error;
  return toCamel<Customer[]>(data);
}

export async function createCustomer(c: Omit<Customer, "id" | "createdAt">) {
  const { error } = await supabase.from("customers").insert(toSnake(c as unknown as Record<string, unknown>));
  if (error) throw error;
}

export async function updateCustomer(id: string, updates: Partial<Omit<Customer, "id" | "createdAt">>) {
  const { error } = await supabase.from("customers").update(toSnake(updates as Record<string, unknown>)).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// ── Expenses ──────────────────────────────────────────────────────────
export async function getExpenses(): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses").select("*").order("date", { ascending: false });
  if (error) throw error;
  return toCamel<Expense[]>(data);
}

export async function createExpense(e: Omit<Expense, "id" | "createdAt">) {
  const { error } = await supabase.from("expenses").insert(toSnake(e as unknown as Record<string, unknown>));
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}
