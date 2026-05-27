import { useState, useEffect, useCallback } from "react";
import { getSales, getExpenses, getCustomers } from "../lib/storage";
import { fmt, today, currentMonthStart } from "../lib/helpers";
import type { Sale, Expense, Customer } from "../types";
import type { ToastType } from "../hooks/useToast";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";

interface Props {
  showToast: (msg: string, type?: ToastType) => void;
}

export default function PageRelatorios({ showToast }: Props) {
  const [sales,     setSales]     = useState<Sale[]>([]);
  const [expenses,  setExpenses]  = useState<Expense[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [from, setFrom] = useState(currentMonthStart());
  const [to,   setTo]   = useState(today());
  const [loading, setLoading] = useState(false);
  const [customerPeriod, setCustomerPeriod] = useState<"monthly" | "semiannual" | "annual">("monthly");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e, c] = await Promise.all([
        getSales({ from, to }),
        getExpenses(),
        getCustomers(),
      ]);
      setSales(s); setExpenses(e); setCustomers(c);
    } catch (err: unknown) { showToast((err as Error).message, "error"); }
    finally { setLoading(false); }
  }, [from, to, showToast]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const totalRevenue  = sales.reduce((s, v) => s + Number(v.total), 0);
  const totalQty      = sales.reduce((s, v) => s + v.qty, 0);
  const totalExpenses = expenses.reduce((s, v) => s + Number(v.amount), 0);
  const netProfit     = totalRevenue - totalExpenses;
  const avgTicket     = sales.length ? totalRevenue / sales.length : 0;

  const bySeller = Object.values(
    sales.reduce<Record<string, { name: string; total: number; qty: number }>>((acc, s) => {
      if (!acc[s.sellerId]) acc[s.sellerId] = { name: s.sellerName, total: 0, qty: 0 };
      acc[s.sellerId].total += Number(s.total);
      acc[s.sellerId].qty   += s.qty;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const byProduct = Object.values(
    sales.reduce<Record<string, { name: string; qty: number; total: number }>>((acc, s) => {
      if (!acc[s.productId]) acc[s.productId] = { name: s.productName, qty: 0, total: 0 };
      acc[s.productId].qty   += s.qty;
      acc[s.productId].total += Number(s.total);
      return acc;
    }, {})
  ).sort((a, b) => b.qty - a.qty).slice(0, 8);

  const now = new Date();
  const periodStart: Record<string, string> = {
    monthly:    new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    semiannual: new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString(),
    annual:     new Date(now.getFullYear(), 0, 1).toISOString(),
  };

  const customerMap = Object.fromEntries(customers.map(c => [c.id, c.name]));
  const periodSales = sales.filter(s => s.createdAt >= periodStart[customerPeriod] && s.customerId);
  const byCustomer = Object.entries(
    periodSales.reduce<Record<string, { name: string; total: number; qty: number }>>((acc, s) => {
      const cid = s.customerId!;
      if (!acc[cid]) acc[cid] = { name: customerMap[cid] || "Cliente", total: 0, qty: 0 };
      acc[cid].total += Number(s.total);
      acc[cid].qty   += s.qty;
      return acc;
    }, {})
  ).sort((a, b) => b[1].total - a[1].total);

  const maxSeller = bySeller[0]?.total || 1;
  const maxProd   = byProduct[0]?.qty  || 1;

  return (
    <section className="page active">
      <div className="page-header"><h2>Relatórios</h2><p>Análise de desempenho</p></div>
      <div className="filters-bar">
        <input type="date" className="input-field" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="input-field" value={to}   onChange={e => setTo(e.target.value)} />
        <button className="btn btn-primary" onClick={load}>Gerar Relatório</button>
      </div>

      {loading ? <EmptyState msg="Carregando..." /> : (
        <>
          <div className="stats-grid">
            <StatCard label="Faturamento Total" value={fmt(totalRevenue)} sub={`${sales.length} vendas no período`} />
            <StatCard label="Peças Vendidas"    value={totalQty}          sub="unidades" />
            <StatCard label="Ticket Médio"      value={fmt(avgTicket)}    sub="por venda" />
            <StatCard label="Total de Despesas" value={fmt(totalExpenses)} sub="acumulado geral" danger={totalExpenses > 0} />
            <StatCard label="Lucro Líquido"     value={fmt(netProfit)}    sub="faturamento − despesas" accent={netProfit >= 0} />
          </div>

          <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="card">
              <h3 className="card-title">Ranking por Vendedora</h3>
              {bySeller.length === 0 ? <EmptyState msg="Nenhuma venda no período." /> :
                bySeller.map((info, i) => (
                  <div className="report-bar-item" key={i}>
                    <div className="report-bar-label">
                      <span>{["🥇","🥈","🥉"][i] || `${i+1}º`} {info.name}</span>
                      <span>{fmt(info.total)} · {info.qty} un.</span>
                    </div>
                    <div className="report-bar-track">
                      <div className="report-bar-fill" style={{ width: `${(info.total / maxSeller * 100).toFixed(1)}%` }} />
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="card">
              <h3 className="card-title">Produtos Mais Vendidos</h3>
              {byProduct.length === 0 ? <EmptyState msg="Nenhuma venda no período." /> :
                byProduct.map((info, i) => (
                  <div className="report-bar-item" key={i}>
                    <div className="report-bar-label">
                      <span>{info.name}</span>
                      <span>{info.qty} un.</span>
                    </div>
                    <div className="report-bar-track">
                      <div className="report-bar-fill" style={{ width: `${(info.qty / maxProd * 100).toFixed(1)}%` }} />
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="card-title" style={{ marginBottom: 0 }}>Clientes Recorrentes</h3>
              <select className="input-select" style={{ width: "auto" }}
                value={customerPeriod}
                onChange={e => setCustomerPeriod(e.target.value as typeof customerPeriod)}>
                <option value="monthly">Mensal</option>
                <option value="semiannual">Semestral</option>
                <option value="annual">Anual</option>
              </select>
            </div>
            {byCustomer.length === 0
              ? <EmptyState msg="Nenhum cliente com compras no período." />
              : <table className="data-table">
                  <thead><tr><th>Ranking</th><th>Cliente</th><th>Total Comprado</th><th>Peças</th></tr></thead>
                  <tbody>
                    {byCustomer.map(([id, info], i) => (
                      <tr key={id}>
                        <td><div className="top-rank">{i + 1}</div></td>
                        <td><strong>{info.name}</strong></td>
                        <td><strong style={{ color: "var(--rose-dark)" }}>{fmt(info.total)}</strong></td>
                        <td>{info.qty} un.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </>
      )}
    </section>
  );
}
