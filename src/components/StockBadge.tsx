interface Props { qty: number }

export default function StockBadge({ qty }: Props) {
  if (qty === 0) return <span className="stock-zero">Sem estoque</span>;
  if (qty <= 3)  return <span className="stock-low">{qty} un.</span>;
  if (qty <= 8)  return <span className="stock-mid">{qty} un.</span>;
  return <span className="stock-high">{qty} un.</span>;
}
