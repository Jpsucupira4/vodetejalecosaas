import { useState, useEffect, useCallback } from "react";
import { getExpenses, createExpense, deleteExpense } from "../lib/storage";
import { fmt, fmtDate, today } from "../lib/helpers";
import { EXPENSE_CATEGORIES } from "../lib/constants";
import type { Expense } from "../types";
import type { ToastType } from "../hooks/useToast";
import InputGroup from "../components/InputGroup";
import EmptyState from "../components/EmptyState";

interface Props {
  showToast: (msg: string, type?: ToastType) => void;
}

export default function PageDespesas({ showToast }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({ description: "", category: "Geral", amount: "", date: today() });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setExpenses(await getExpenses()); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.description.trim()) return showToast("Informe a descrição.", "error");
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) return showToast("Valor inválido.", "error");
    setSaving(true);
    try {
      await createExpense({ description: form.description.trim(), category: form.category, amount, date: form.date });
      showToast("Despesa registrada!", "success");
      setForm({ description: "", category: "Geral", amount: "", date: today() });
      load();
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Remover esta despesa?")) return;
    try { await deleteExpense(id); showToast("Despesa removida.", "info"); load(); }
    catch (e: unknown) { showToast((e as Error).message, "error"); }
  };

  const total = expenses.reduce((s, v) => s + Number(v.amount), 0);

  return (
    <section className="page active">
      <div className="page-header"><h2>Despesas</h2><p>Controle de gastos</p></div>
      <div className="sale-layout" style={{ gridTemplateColumns: "380px 1fr" }}>
        <div className="card">
          <h3 className="card-title">Nova Despesa</h3>
          <InputGroup label="Descrição *">
            <input className="input-field" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Compra de tecido..." />
          </InputGroup>
          <InputGroup label="Categoria">
            <select className="input-select" value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Valor (R$) *">
            <input type="number" className="input-field" step="0.01" min="0"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00" />
          </InputGroup>
          <InputGroup label="Data *">
            <input type="date" className="input-field" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </InputGroup>
          <div style={{ height: 12 }} />
          <button className="btn btn-primary btn-full" onClick={save} disabled={saving}>
            {saving ? "Registrando..." : "Registrar Despesa"}
          </button>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Despesas Registradas</h3>
            <strong style={{ color: "var(--danger)", fontFamily: "var(--font-display)", fontSize: "1.2rem" }}>
              {fmt(total)}
            </strong>
          </div>
          {expenses.length === 0
            ? <EmptyState msg="Nenhuma despesa registrada." />
            : <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th></th></tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id}>
                        <td>{fmtDate(e.date)}</td>
                        <td><strong>{e.description}</strong></td>
                        <td><span className="cat-label">{e.category}</span></td>
                        <td><strong style={{ color: "var(--danger)" }}>{fmt(e.amount)}</strong></td>
                        <td>
                          <button className="btn btn-sm btn-danger" onClick={() => remove(e.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </div>
    </section>
  );
}
