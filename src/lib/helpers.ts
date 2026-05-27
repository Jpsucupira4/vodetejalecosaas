export const fmt = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

export const fmtDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR") + " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
};

export const today = () => new Date().toISOString().split("T")[0];

export const currentMonthStart = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0];
};

// snake_case → camelCase deep mapper
export const toCamel = <T>(obj: unknown): T => {
  if (!obj || typeof obj !== "object") return obj as T;
  if (Array.isArray(obj)) return obj.map(toCamel) as unknown as T;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      toCamel(v),
    ])
  ) as T;
};

export const toSnake = (obj: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/([A-Z])/g, "_$1").toLowerCase(),
      v,
    ])
  );
};
