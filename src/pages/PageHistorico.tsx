import { useState, useEffect, useCallback } from "react";
import { getSales, getProfiles } from "../lib/storage";
import { fmt, fmtDateTime } from "../lib/helpers";
import { PAYMENT_LABELS, SHIPPING_LABELS } from "../lib/constants";
import type { Sale, Profile } from "../types";
import type { ToastType } from "../hooks/useToast";
import EmptyState from "../components/EmptyState";

interface Props {
  isAdmin: boolean;
  userId: string;
  showToast: (msg: string, type?: ToastType) => void;
}

export default function PageHistorico({ isAdmin, userId, showToast }: Props) {
  const [sales,    setSales]    = useState<Sale[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [from, setFrom] = useState("");
  const [to,   setTo]   = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  useEffect(() => {
    if (isAdmin) getProfiles().then(setProfiles).catch(() => {});
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (!isAdmin) filters.sellerId = userId;
      else if (sellerFilter) filters.sellerId = sellerFilter;
      if (from) filters.from = from;
      if (to)   filters.to   = to;
      setSales(await getSales(filters));
    } catch (e: unknown) { showToast((e as Error).message, "error"); }
    finally { setLoading(false); }
  }, [isAdmin, userId, from, to, sellerFilter, showToast]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <section className="page active">
      <div className="page-header"><h2>Histórico de Vendas</h2><p>Todas as transações</p></div>
      <div className="filters-bar">
        <input type="date" className="input-field" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input-field" value={to}   onChange={e => setTo(e.target.value)} />
        {isAdmin && (
          <select className="input-select" value={sellerFilter} onChange={e => setSellerFilter(e.target.value)}>
            <option value="">Todas as vendedoras</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <button className="btn btn-outline" onClick={load}>Filtrar</button>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data</th><th>Produto</th><th>Qtd</th><th>Tipo</th>
              <th>Valor</th><th>Frete</th><th>Pagamento</th>
              {isAdmin && <th>Vendedora</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 8 : 7}><EmptyState msg="Carregando..." /></td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 7}><EmptyState msg="Nenhuma venda encontrada." /></td></tr>
            ) : sales.map(s => (
              <tr key={s.id}>
                <td>{fmtDateTime(s.createdAt)}</td>
                <td>
                  <strong>{s.productName}</strong>
                  {s.notes && <><br /><small style={{ color: "var(--text-soft)" }}>{s.notes}</small></>}
                </td>
                <td>{s.qty}</td>
                <td>
                  <span className={`badge ${s.saleType === "atacado" ? "badge-blue" : "badge-rose"}`}>
                    {s.saleType === "atacado" ? "Atacado" : "Varejo"}
                  </span>
                </td>
                <td><strong>{fmt(s.total)}</strong></td>
                <td>
                  {s.shippingMethod && s.shippingMethod !== "none"
                    ? <span className="badge badge-yellow">
                        {SHIPPING_LABELS[s.shippingMethod]?.split(" ")[0]} {fmt(s.shippingCost)}
                      </span>
                    : "—"}
                </td>
                <td>
                  <span className="badge badge-rose">{PAYMENT_LABELS[s.payment] || s.payment}</span>
                </td>
                {isAdmin && <td>{s.sellerName}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
