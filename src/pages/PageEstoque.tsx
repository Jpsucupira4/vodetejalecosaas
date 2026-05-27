import { useState, useEffect, useCallback } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../lib/storage";
import { fmt } from "../lib/helpers";
import { CATEGORIES, SIZES } from "../lib/constants";
import type { Product } from "../types";
import type { ToastType } from "../hooks/useToast";
import Modal from "../components/Modal";
import InputGroup from "../components/InputGroup";
import StockBadge from "../components/StockBadge";
import EmptyState from "../components/EmptyState";

interface FormState {
  name: string;
  category: string;
  size: string;
  color: string;
  priceRetail: string;
  priceWholesale: string;
  stock: string;
}

const BLANK: FormState = {
  name: "", category: "scrub", size: "M", color: "",
  priceRetail: "", priceWholesale: "", stock: "",
};

interface Props {
  isAdmin: boolean;
  showToast: (msg: string, type?: ToastType) => void;
}

export default function PageEstoque({ isAdmin, showToast }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState<FormState>(BLANK);

  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await getProducts()); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.color.toLowerCase().includes(q);
    const matchCat    = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const openNew = () => { setEditId(null); setForm(BLANK); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, category: p.category, size: p.size, color: p.color,
      priceRetail: String(p.priceRetail), priceWholesale: String(p.priceWholesale),
      stock: String(p.stock),
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return showToast("Informe o nome do produto.", "error");
    const priceRetail    = parseFloat(form.priceRetail);
    const priceWholesale = parseFloat(form.priceWholesale);
    const stock          = parseInt(form.stock);
    if (isNaN(priceRetail)    || priceRetail < 0)    return showToast("Preço varejo inválido.", "error");
    if (isNaN(priceWholesale) || priceWholesale < 0) return showToast("Preço atacado inválido.", "error");
    if (isNaN(stock)          || stock < 0)           return showToast("Estoque inválido.", "error");
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(), category: form.category, size: form.size,
        color: form.color.trim() || "—", priceRetail, priceWholesale, stock,
      };
      if (editId) { await updateProduct(editId, data); showToast("Produto atualizado!", "success"); }
      else        { await createProduct(data as Omit<Product, "id" | "createdAt">); showToast("Produto cadastrado!", "success"); }
      setModalOpen(false);
      load();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remover este produto?")) return;
    try { await deleteProduct(id); showToast("Produto removido.", "info"); load(); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  return (
    <section className="page active">
      <div className="page-header">
        <h2>Estoque</h2>
        <p>Gestão de produtos</p>
        {isAdmin && <button className="btn btn-primary" onClick={openNew}>+ Novo Produto</button>}
      </div>
      <div className="filters-bar">
        <input type="text" className="input-search" placeholder="Buscar produto..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Produto</th><th>Categoria</th><th>Tam.</th><th>Cor</th>
              <th>Varejo</th><th>Atacado</th><th>Estoque</th>
              {isAdmin && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 8 : 7}><EmptyState msg="Carregando..." /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 7}><EmptyState msg="Nenhum produto encontrado." /></td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td><span className="cat-label">{CATEGORIES[p.category] || p.category}</span></td>
                <td>{p.size}</td>
                <td>{p.color}</td>
                <td>{fmt(p.priceRetail)}</td>
                <td>{fmt(p.priceWholesale)}</td>
                <td><StockBadge qty={p.stock} /></td>
                {isAdmin && (
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(p)}>Editar</button>
                      <button className="btn btn-sm btn-danger"  onClick={() => remove(p.id)}>Remover</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editId ? "Editar Produto" : "Novo Produto"}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Produto"}
            </button>
          </>
        }
        wide
      >
        <div className="form-grid">
          <InputGroup label="Nome do Produto *">
            <input className="input-field" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Scrub Premium Rosa" />
          </InputGroup>
          <InputGroup label="Categoria *">
            <select className="input-select" value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Tamanho">
            <select className="input-select" value={form.size}
              onChange={e => setForm({ ...form, size: e.target.value })}>
              {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Cor">
            <input className="input-field" value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              placeholder="Ex: Rosa Antigo" />
          </InputGroup>
          <InputGroup label="Preço Varejo (R$) *">
            <input type="number" className="input-field" step="0.01" min="0"
              value={form.priceRetail}
              onChange={e => setForm({ ...form, priceRetail: e.target.value })}
              placeholder="0.00" />
          </InputGroup>
          <InputGroup label="Preço Atacado (R$) *">
            <input type="number" className="input-field" step="0.01" min="0"
              value={form.priceWholesale}
              onChange={e => setForm({ ...form, priceWholesale: e.target.value })}
              placeholder="0.00" />
          </InputGroup>
          <InputGroup label="Quantidade em Estoque *">
            <input type="number" className="input-field" min="0"
              value={form.stock}
              onChange={e => setForm({ ...form, stock: e.target.value })}
              placeholder="0" />
          </InputGroup>
        </div>
      </Modal>
    </section>
  );
}
