import { useState, useEffect } from "react";
import { getSales, getProducts, getExpenses } from "../lib/storage";
import { fmt, fmtDateTime, currentMonthStart } from "../lib/helpers";
import type { Sale, Product, Expense } from "../types";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";

interface Props {
  isAdmin: boolean;
  userId: string;
}

export default function PageDashboard({ isAdmin, userId }: Props) {
  const [sales, setSales]     = useState<Sale[]>([]);
  const [monthSales, setMonthSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const filters = isAdmin ? {} : { sellerId: userId };
        const [allSales, prods, exps] = await Promise.all([
          getSales(filters),
          getProducts(),
          isAdmin ? getExpenses() : Promise.resolve([]),
        ]);
        setSales(allSales);
        const ms = currentMonthStart();
        setMonthSales(allSales.filter(s => s.createdAt >= ms));
        setProducts(prods);
        setExpenses(exps);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, userId]);

  if (loading) return <div className="empty-state"><p>Carregando...</p></div>;

  const monthRevenue  = monthSales.reduce((s, v) => s + Number(v.total), 0);
  const totalRevenue  = sales.reduce((s, v) => s + Number(v.total), 0);
  const totalExpenses = expenses.reduce((s, v) => s + Number(v.amount), 0);
  const netProfit     = totalRevenue - totalExpenses;
  const totalItems    = sales.reduce((s, v) => s + v.qty, 0);
  const lowStock      = products.filter(p => p.stock <= 3 && p.stock > 0).length;
  const outOfStock    = products.filter(p => p.stock === 0).length;

  const productRank = Object.values(
    sales.reduce<Record<string, { qty: number; revenue: number; name: string }>>((acc, s) => {
      if (!acc[s.productId]) acc[s.productId] = { qty: 0, revenue: 0, name: s.productName };
      acc[s.productId].qty     += s.qty;
      acc[s.productId].revenue += Number(s.total);
      return acc;
    }, {})
  ).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const recent = [...sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <section className="page active">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Visão geral do negócio</p>
      </div>
      <div className="stats-grid">
        <StatCard label="Faturamento do Mês" value={fmt(monthRevenue)} sub={`${monthSales.length} vendas no mês`} />
        <StatCard label="Faturamento Total"  value={fmt(totalRevenue)} sub={`${sales.length} transações totais`} />
        <StatCard label="Peças Vendidas"     value={totalItems} sub="unidades no total" />
        {isAdmin && <StatCard label="Lucro Líquido Total" value={fmt(netProfit)} sub={`Desp: ${fmt(totalExpenses)}`} accent />}
        <StatCard label="Produtos Cadastrados" value={products.length} sub={`${lowStock} com estoque baixo`} />
        <StatCard label="Sem Estoque" value={outOfStock} sub="produtos esgotados" danger={outOfStock > 0} />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 className="card-title">Produtos Mais Vendidos</h3>
          {productRank.length === 0
            ? <EmptyState msg="Nenhuma venda registrada ainda." />
            : productRank.map((info, i) => (
              <div className="top-item" key={i}>
                <div className="top-rank">{i + 1}</div>
                <div className="top-info">
                  <strong>{info.name}</strong>
                  <span>{info.qty} unidades vendidas</span>
                </div>
                <div className="top-value">{fmt(info.revenue)}</div>
              </div>
            ))
          }
        </div>
        <div className="card">
          <h3 className="card-title">Vendas Recentes</h3>
          {recent.length === 0
            ? <EmptyState msg="Nenhuma venda ainda." />
            : recent.map((s, i) => (
              <div className="recent-sale" key={i}>
                <div className="recent-sale-info">
                  <strong>{s.productName}</strong>
                  <span>{fmtDateTime(s.createdAt)} · {s.qty} un.</span>
                </div>
                <div className="recent-sale-value">{fmt(s.total)}</div>
              </div>
            ))
          }
        </div>
      </div>
    </section>
  );
}
