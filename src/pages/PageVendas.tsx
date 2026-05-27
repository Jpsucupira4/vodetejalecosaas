import { useState, useEffect, useCallback } from "react";
import { getProducts, getCustomers, getSales, decreaseStock, createSale } from "../lib/storage";
import { fmt, today } from "../lib/helpers";
import { PAYMENT_LABELS, SHIPPING_LABELS, SHIPPING_FIXED } from "../lib/constants";
import type { Product, Customer, Sale } from "../types";
import type { ToastType } from "../hooks/useToast";
import InputGroup from "../components/InputGroup";
import EmptyState from "../components/EmptyState";

interface FormState {
  productId: string;
  qty: number;
  payment: string;
  saleType: "varejo" | "atacado";
  shippingMethod: string;
  shippingCost: number;
  notes: string;
  customerId: string;
}

const BLANK: FormState = {
  productId: "", qty: 1, payment: "pix", saleType: "varejo",
  shippingMethod: "none", shippingCost: 0, notes: "", customerId: "",
};

interface Props {
  userId: string;
  userName: string;
  showToast: (msg: string, type?: ToastType) => void;
}

export default function PageVendas({ userId, userName, showToast }: Props) {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [form, setForm] = useState<FormState>(BLANK);
  const [saving, setSaving] = useState(false);

  const selectedProduct = products.find(p => p.id === form.productId);
  const unitPrice = selectedProduct
    ? (form.saleType === "atacado"
        ? Number(selectedProduct.priceWholesale)
        : Number(selectedProduct.priceRetail))
    : 0;
  const baseTotal = unitPrice * (Number(form.qty) || 1);
  const shippingCostVal = form.shippingMethod === "correios"
    ? (parseFloat(String(form.shippingCost)) || 0)
    : SHIPPING_FIXED[form.shippingMethod] || 0;
  const grandTotal = baseTotal + shippingCostVal;

  const load = useCallback(async () => {
    const [prods, custs, sales] = await Promise.all([
      getProducts(),
      getCustomers(),
      getSales({ from: today(), sellerId: userId }),
    ]);
    setProducts(prods.filter(p => p.stock > 0));
    setCustomers(custs);
    setTodaySales(sales);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const confirm = async () => {
    if (!form.productId) return showToast("Selecione um produto.", "error");
    const qty = parseInt(String(form.qty));
    if (!qty || qty < 1) return showToast("Quantidade inválida.", "error");
    if (!selectedProduct) return showToast("Produto não encontrado.", "error");
    if (selectedProduct.stock < qty)
      return showToast(`Estoque insuficiente. Disponível: ${selectedProduct.stock} un.`, "error");

    setSaving(true);
    try {
      await decreaseStock(form.productId, qty);
      await createSale({
        productId:      form.productId,
        productName:    selectedProduct.name,
        qty,
        unitPrice,
        total:          grandTotal,
        payment:        form.payment,
        saleType:       form.saleType,
        shippingMethod: form.shippingMethod,
        shippingCost:   shippingCostVal,
        notes:          form.notes.trim() || null,
        sellerId:       userId,
        sellerName:     userName,
        customerId:     form.customerId || null,
        createdAt:      new Date().toISOString(),
      });
      showToast(`Venda registrada! ${fmt(grandTotal)}`, "success");
      setForm(BLANK);
      load();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <section className="page active">
      <div className="page-header"><h2>Registrar Venda</h2><p>Nova transação</p></div>
      <div className="sale-layout">
        <div className="card sale-form-card">
          <h3 className="card-title">Dados da Venda</h3>

          <InputGroup label="Produto">
            <select className="input-select" value={form.productId}
              onChange={e => setForm({ ...form, productId: e.target.value })}>
              <option value="">— Selecione um produto —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.size} / {p.color})
                </option>
              ))}
            </select>
          </InputGroup>

          {selectedProduct && (
            <div className="sale-product-info">
              <span className="info-stock">Estoque: {selectedProduct.stock} un.</span>
              <span>Varejo: {fmt(selectedProduct.priceRetail)}</span>
              <span className="info-wholesale">Atacado: {fmt(selectedProduct.priceWholesale)}</span>
            </div>
          )}

          <InputGroup label="Tipo de Venda">
            <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
              {(["varejo", "atacado"] as const).map(t => (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
                  <input type="radio" name="saleType" value={t}
                    checked={form.saleType === t}
                    onChange={e => setForm({ ...form, saleType: e.target.value as "varejo" | "atacado" })} />
                  {t === "varejo" ? "Varejo" : "Atacado"}
                </label>
              ))}
            </div>
          </InputGroup>

          <InputGroup label="Quantidade">
            <input type="number" className="input-field" min="1" value={form.qty}
              onChange={e => setForm({ ...form, qty: Number(e.target.value) })} />
          </InputGroup>

          <InputGroup label="Forma de Pagamento">
            <select className="input-select" value={form.payment}
              onChange={e => setForm({ ...form, payment: e.target.value })}>
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </InputGroup>

          <InputGroup label="Opção de Envio">
            <select className="input-select" value={form.shippingMethod}
              onChange={e => setForm({ ...form, shippingMethod: e.target.value, shippingCost: SHIPPING_FIXED[e.target.value] || 0 })}>
              {Object.entries(SHIPPING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </InputGroup>

          {form.shippingMethod === "correios" && (
            <InputGroup label="Valor do Frete Correios (R$)">
              <input type="number" className="input-field" step="0.01" min="0"
                value={form.shippingCost}
                onChange={e => setForm({ ...form, shippingCost: parseFloat(e.target.value) })}
                placeholder="0.00" />
            </InputGroup>
          )}

          <InputGroup label="Cliente (opcional)">
            <select className="input-select" value={form.customerId}
              onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">— Sem cliente cadastrado —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </InputGroup>

          <InputGroup label="Observações">
            <textarea className="input-field" rows={2} placeholder="Opcional..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </InputGroup>

          {shippingCostVal > 0 && (
            <div style={{ fontSize: 12, color: "var(--text-soft)", textAlign: "right", marginBottom: 4 }}>
              Subtotal: {fmt(baseTotal)} + Frete: {fmt(shippingCostVal)}
            </div>
          )}
          <div className="sale-total-box">
            <span>Total</span>
            <strong>{fmt(grandTotal)}</strong>
          </div>
          <button className="btn btn-primary btn-full" onClick={confirm} disabled={saving}>
            {saving ? "Registrando..." : "Confirmar Venda"}
          </button>
        </div>

        <div className="card sale-summary-card">
          <h3 className="card-title">Vendas de Hoje</h3>
          {todaySales.length === 0
            ? <EmptyState msg="Nenhuma venda hoje ainda." />
            : todaySales.slice(0, 10).map((s, i) => (
              <div className="today-sale-item" key={i}>
                <div>
                  <strong>{s.productName}</strong><br />
                  <small style={{ color: "var(--text-soft)" }}>
                    {s.qty} un. · {PAYMENT_LABELS[s.payment] || s.payment}
                    {s.shippingMethod !== "none" && ` · ${SHIPPING_LABELS[s.shippingMethod]?.split(" ")[0]}`}
                  </small>
                </div>
                <span className="s-val">{fmt(s.total)}</span>
              </div>
            ))
          }
          {todaySales.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span>Total do dia</span>
              <span style={{ color: "var(--success)" }}>
                {fmt(todaySales.reduce((s, v) => s + Number(v.total), 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
